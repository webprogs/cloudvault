import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import Button from '../UI/Button';
import UploadProgressTracker from './UploadProgressTracker';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONCURRENT_UPLOADS = 3;

export default function ChunkedFileUploader({ folderId, onClose, onUploadComplete }) {
    const [files, setFiles] = useState([]);
    const [uploadStates, setUploadStates] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef(null);
    const abortControllersRef = useRef({});

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(abortControllersRef.current).forEach(controller => {
                controller?.abort();
            });
        };
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
        e.target.value = '';
    };

    const addFiles = (newFiles) => {
        setFiles(prev => {
            const existingNames = new Set(prev.map(f => f.name));
            const uniqueFiles = newFiles.filter(f => !existingNames.has(f.name));
            return [...prev, ...uniqueFiles];
        });
    };

    const removeFile = (index) => {
        const file = files[index];
        // Cancel if uploading
        if (uploadStates[index]?.sessionId) {
            cancelUpload(index);
        }
        setFiles(prev => prev.filter((_, i) => i !== index));
        setUploadStates(prev => {
            const newStates = { ...prev };
            delete newStates[index];
            return newStates;
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const initializeUpload = async (file, fileIndex) => {
        try {
            abortControllersRef.current[fileIndex] = new AbortController();

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    status: 'initializing',
                    progress: 0,
                    error: null,
                }
            }));

            const response = await axios.post('/api/uploads/initiate', {
                filename: file.name,
                file_size: file.size,
                folder_id: folderId,
            }, {
                signal: abortControllersRef.current[fileIndex]?.signal,
            });

            const { session_id, chunk_size, total_chunks } = response.data;

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    sessionId: session_id,
                    status: 'uploading',
                    progress: 0,
                    uploadedChunks: [],
                    totalChunks: total_chunks,
                    chunkSize: chunk_size,
                    error: null,
                }
            }));

            await uploadChunks(file, fileIndex, session_id, chunk_size, total_chunks);
        } catch (error) {
            if (axios.isCancel(error)) return;

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    ...prev[fileIndex],
                    status: 'error',
                    error: error.response?.data?.message || error.response?.data?.errors?.[0] || 'Failed to initialize upload',
                }
            }));
        }
    };

    const uploadChunks = async (file, fileIndex, sessionId, chunkSize, totalChunks) => {
        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            chunks.push({ index: i, start, end });
        }

        // Upload chunks with concurrency limit
        const uploadQueue = [...chunks];
        const activeUploads = new Set();

        const processQueue = async () => {
            while (uploadQueue.length > 0 || activeUploads.size > 0) {
                // Check if cancelled
                if (abortControllersRef.current[fileIndex]?.signal?.aborted) {
                    return;
                }

                // Start new uploads if under limit
                while (activeUploads.size < MAX_CONCURRENT_UPLOADS && uploadQueue.length > 0) {
                    const chunk = uploadQueue.shift();
                    const uploadPromise = uploadSingleChunk(file, fileIndex, sessionId, chunk)
                        .catch(error => {
                            if (!axios.isCancel(error)) {
                                // Re-queue failed chunk for retry (max 3 retries)
                                if (!chunk.retries || chunk.retries < 3) {
                                    chunk.retries = (chunk.retries || 0) + 1;
                                    uploadQueue.push(chunk);
                                } else {
                                    throw error;
                                }
                            }
                        })
                        .finally(() => {
                            activeUploads.delete(uploadPromise);
                        });
                    activeUploads.add(uploadPromise);
                }

                if (activeUploads.size > 0) {
                    await Promise.race(activeUploads);
                }
            }
        };

        try {
            await processQueue();
        } catch (error) {
            if (!axios.isCancel(error)) {
                setUploadStates(prev => ({
                    ...prev,
                    [fileIndex]: {
                        ...prev[fileIndex],
                        status: 'error',
                        error: error.response?.data?.message || 'Upload failed',
                    }
                }));
            }
        }
    };

    const uploadSingleChunk = async (file, fileIndex, sessionId, chunk) => {
        const blob = file.slice(chunk.start, chunk.end);
        const formData = new FormData();
        formData.append('chunk', blob);
        formData.append('chunk_index', chunk.index);

        const response = await axios.post(`/api/uploads/${sessionId}/chunk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abortControllersRef.current[fileIndex]?.signal,
        });

        setUploadStates(prev => {
            const currentState = prev[fileIndex];
            if (!currentState) return prev;

            const newStatus = response.data.status === 'assembling' ? 'processing' :
                             response.data.status === 'completed' ? 'completed' : 'uploading';

            return {
                ...prev,
                [fileIndex]: {
                    ...currentState,
                    progress: response.data.progress,
                    uploadedChunks: response.data.uploaded_chunks,
                    status: newStatus,
                }
            };
        });

        // If completed, trigger refresh
        if (response.data.status === 'completed') {
            onUploadComplete?.();
        }

        return response.data;
    };

    const cancelUpload = async (fileIndex) => {
        const state = uploadStates[fileIndex];
        if (!state?.sessionId) return;

        // Abort ongoing requests
        abortControllersRef.current[fileIndex]?.abort();

        try {
            await axios.delete(`/api/uploads/${state.sessionId}`);
        } catch (error) {
            // Ignore errors when cancelling
        }

        setUploadStates(prev => ({
            ...prev,
            [fileIndex]: {
                ...prev[fileIndex],
                status: 'cancelled',
            }
        }));
    };

    const retryUpload = async (fileIndex) => {
        const file = files[fileIndex];
        if (!file) return;

        // Create new abort controller
        abortControllersRef.current[fileIndex] = new AbortController();

        // Reset state
        setUploadStates(prev => ({
            ...prev,
            [fileIndex]: {
                status: 'initializing',
                progress: 0,
                error: null,
            }
        }));

        await initializeUpload(file, fileIndex);
    };

    const handleUpload = async () => {
        if (files.length === 0 || isUploading) return;

        setIsUploading(true);

        // Upload all files
        const uploadPromises = files.map((file, index) => {
            // Skip already completed or uploading files
            const state = uploadStates[index];
            if (state?.status === 'completed' || state?.status === 'uploading' || state?.status === 'processing') {
                return Promise.resolve();
            }
            return initializeUpload(file, index);
        });

        await Promise.allSettled(uploadPromises);
        setIsUploading(false);
    };

    const allCompleted = files.length > 0 && files.every((_, index) =>
        uploadStates[index]?.status === 'completed'
    );

    const hasErrors = Object.values(uploadStates).some(state => state?.status === 'error');
    const isProcessing = Object.values(uploadStates).some(state =>
        state?.status === 'uploading' || state?.status === 'processing' || state?.status === 'initializing'
    );

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            {!isUploading && !isProcessing && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        isDragging
                            ? 'border-primary bg-primary-light dropzone-active'
                            : 'border-border hover:border-primary hover:bg-gray-50'
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            isDragging ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                        }`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text-primary font-medium">
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="text-sm text-text-secondary mt-1">
                                or click to browse
                            </p>
                        </div>
                        <p className="text-xs text-text-secondary">
                            Maximum file size: 10GB (large files upload in chunks)
                        </p>
                    </div>
                </div>
            )}

            {/* File List with Progress */}
            {files.length > 0 && (
                <UploadProgressTracker
                    files={files}
                    uploadStates={uploadStates}
                    onRemove={removeFile}
                    onCancel={cancelUpload}
                    onRetry={retryUpload}
                    formatFileSize={formatFileSize}
                />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={onClose}>
                    {allCompleted ? 'Close' : 'Cancel'}
                </Button>
                {!allCompleted && (
                    <Button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isProcessing}
                        loading={isProcessing}
                    >
                        {isProcessing ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
                    </Button>
                )}
                {allCompleted && (
                    <Button onClick={() => {
                        onUploadComplete?.();
                        onClose?.();
                    }}>
                        Done
                    </Button>
                )}
            </div>
        </div>
    );
}
