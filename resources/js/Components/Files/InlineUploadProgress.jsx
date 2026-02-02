import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const CHUNKED_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for chunked upload
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Floating progress panel for inline file uploads.
 * Appears in the bottom-right corner and shows per-file progress.
 */
export default function InlineUploadProgress({
    files,
    folderId,
    onComplete,
    onClose,
}) {
    const [uploadStates, setUploadStates] = useState({});
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const abortControllersRef = useRef({});

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Start uploads when component mounts with files
    useEffect(() => {
        if (files.length > 0 && !isStarted) {
            setIsStarted(true);
            startUploads();
        }
    }, [files, isStarted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(abortControllersRef.current).forEach(controller => {
                controller?.abort();
            });
        };
    }, []);

    const startUploads = async () => {
        // Initialize states for all files
        const initialStates = {};
        files.forEach((_, index) => {
            initialStates[index] = { status: 'pending', progress: 0 };
        });
        setUploadStates(initialStates);

        // Process files sequentially to manage resources
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const useChunked = file.size > CHUNKED_THRESHOLD;

            if (useChunked) {
                await uploadChunked(file, index);
            } else {
                await uploadSimple(file, index);
            }
        }

        // Trigger refresh after all uploads
        onComplete?.();
    };

    // Simple upload for small files
    const uploadSimple = async (file, fileIndex) => {
        try {
            abortControllersRef.current[fileIndex] = new AbortController();

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: { status: 'uploading', progress: 0 }
            }));

            const formData = new FormData();
            formData.append('files[]', file);
            if (folderId) {
                formData.append('folder_id', folderId);
            }

            await axios.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllersRef.current[fileIndex]?.signal,
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    setUploadStates(prev => ({
                        ...prev,
                        [fileIndex]: { status: 'uploading', progress }
                    }));
                },
            });

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: { status: 'completed', progress: 100 }
            }));
        } catch (error) {
            if (axios.isCancel(error)) return;

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    status: 'error',
                    progress: 0,
                    error: error.response?.data?.message || 'Upload failed'
                }
            }));
        }
    };

    // Chunked upload for large files
    const uploadChunked = async (file, fileIndex) => {
        try {
            abortControllersRef.current[fileIndex] = new AbortController();

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: { status: 'initializing', progress: 0 }
            }));

            // Initiate chunked upload
            const initResponse = await axios.post('/api/uploads/initiate', {
                filename: file.name,
                file_size: file.size,
                folder_id: folderId,
            }, {
                signal: abortControllersRef.current[fileIndex]?.signal,
            });

            const { session_id, chunk_size, total_chunks } = initResponse.data;

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    status: 'uploading',
                    progress: 0,
                    sessionId: session_id,
                    totalChunks: total_chunks,
                    uploadedChunks: 0,
                }
            }));

            // Upload chunks
            for (let chunkIndex = 0; chunkIndex < total_chunks; chunkIndex++) {
                // Check if cancelled
                if (abortControllersRef.current[fileIndex]?.signal?.aborted) {
                    return;
                }

                const start = chunkIndex * chunk_size;
                const end = Math.min(start + chunk_size, file.size);
                const blob = file.slice(start, end);

                const formData = new FormData();
                formData.append('chunk', blob);
                formData.append('chunk_index', chunkIndex);

                const response = await axios.post(
                    `/api/uploads/${session_id}/chunk`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        signal: abortControllersRef.current[fileIndex]?.signal,
                    }
                );

                const newStatus = response.data.status === 'assembling' ? 'processing' :
                                 response.data.status === 'completed' ? 'completed' : 'uploading';

                setUploadStates(prev => ({
                    ...prev,
                    [fileIndex]: {
                        ...prev[fileIndex],
                        status: newStatus,
                        progress: response.data.progress,
                        uploadedChunks: response.data.uploaded_chunks,
                    }
                }));
            }
        } catch (error) {
            if (axios.isCancel(error)) return;

            setUploadStates(prev => ({
                ...prev,
                [fileIndex]: {
                    status: 'error',
                    progress: 0,
                    error: error.response?.data?.message || 'Upload failed'
                }
            }));
        }
    };

    const cancelUpload = async (fileIndex) => {
        const state = uploadStates[fileIndex];

        // Abort ongoing request
        abortControllersRef.current[fileIndex]?.abort();

        // If chunked upload, cancel session on server
        if (state?.sessionId) {
            try {
                await axios.delete(`/api/uploads/${state.sessionId}`);
            } catch {
                // Ignore errors when cancelling
            }
        }

        setUploadStates(prev => ({
            ...prev,
            [fileIndex]: { ...prev[fileIndex], status: 'cancelled' }
        }));
    };

    const retryUpload = async (fileIndex) => {
        const file = files[fileIndex];
        if (!file) return;

        // Create new abort controller
        abortControllersRef.current[fileIndex] = new AbortController();

        const useChunked = file.size > CHUNKED_THRESHOLD;

        if (useChunked) {
            await uploadChunked(file, fileIndex);
        } else {
            await uploadSimple(file, fileIndex);
        }

        // Refresh if this was the last retry
        const states = { ...uploadStates };
        states[fileIndex] = { status: 'completed', progress: 100 };
        const allDone = Object.values(states).every(
            s => s.status === 'completed' || s.status === 'cancelled'
        );
        if (allDone) {
            onComplete?.();
        }
    };

    // Calculate overall progress
    const totalFiles = files.length;
    const completedFiles = Object.values(uploadStates).filter(
        s => s.status === 'completed'
    ).length;
    const hasErrors = Object.values(uploadStates).some(s => s.status === 'error');
    const isUploading = Object.values(uploadStates).some(
        s => ['uploading', 'processing', 'initializing'].includes(s.status)
    );
    const allDone = totalFiles > 0 && Object.values(uploadStates).every(
        s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'error'
    );

    const overallProgress = totalFiles > 0
        ? Math.round(
            Object.values(uploadStates).reduce((sum, s) => sum + (s.progress || 0), 0) / totalFiles
        )
        : 0;

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'cancelled': return 'text-gray-500';
            case 'processing': return 'text-blue-600';
            default: return 'text-primary';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'initializing': return 'Initializing...';
            case 'uploading': return 'Uploading...';
            case 'processing': return 'Processing...';
            case 'completed': return 'Completed';
            case 'error': return 'Failed';
            case 'cancelled': return 'Cancelled';
            default: return 'Pending';
        }
    };

    const getProgressBarColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'cancelled': return 'bg-gray-400';
            case 'processing': return 'bg-blue-500';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    {/* Status icon */}
                    {isUploading ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : allDone && !hasErrors ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : hasErrors ? (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    )}

                    {/* Title */}
                    <div>
                        <p className="text-sm font-medium text-text-primary">
                            {isUploading
                                ? `Uploading ${completedFiles}/${totalFiles}`
                                : allDone && !hasErrors
                                ? `${completedFiles} files uploaded`
                                : hasErrors
                                ? 'Upload completed with errors'
                                : 'Preparing upload...'}
                        </p>
                        {isUploading && (
                            <p className="text-xs text-text-secondary">{overallProgress}% complete</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collapse/Expand toggle */}
                    <button
                        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(!isCollapsed);
                        }}
                    >
                        <svg
                            className={`w-4 h-4 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Close button (only when all done) */}
                    {allDone && (
                        <button
                            className="p-1 text-text-secondary hover:text-error transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Overall progress bar (collapsed view) */}
            {isCollapsed && isUploading && (
                <div className="h-1 bg-gray-200">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            )}

            {/* File list (expanded view) */}
            {!isCollapsed && (
                <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                    {files.map((file, index) => {
                        const state = uploadStates[index] || { status: 'pending', progress: 0 };
                        const isActive = ['initializing', 'uploading', 'processing'].includes(state.status);

                        return (
                            <div
                                key={`${file.name}-${index}`}
                                className="p-2 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {/* Status icon */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            state.status === 'completed' ? 'bg-green-100' :
                                            state.status === 'error' ? 'bg-red-100' :
                                            'bg-primary-light'
                                        }`}>
                                            {state.status === 'completed' ? (
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : state.status === 'error' ? (
                                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            ) : isActive ? (
                                                <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* File info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-text-primary truncate">
                                                {file.name}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs">
                                                <span className="text-text-secondary">
                                                    {formatFileSize(file.size)}
                                                </span>
                                                <span className="text-text-secondary">·</span>
                                                <span className={getStatusColor(state.status)}>
                                                    {getStatusText(state.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {state.status === 'error' && (
                                            <button
                                                onClick={() => retryUpload(index)}
                                                className="p-1 text-primary hover:bg-primary-light rounded transition-colors"
                                                title="Retry"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        )}
                                        {isActive && (
                                            <button
                                                onClick={() => cancelUpload(index)}
                                                className="p-1 text-text-secondary hover:text-error hover:bg-red-50 rounded transition-colors"
                                                title="Cancel"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {(isActive || state.status === 'completed') && (
                                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${getProgressBarColor(state.status)} ${
                                                state.status === 'processing' ? 'animate-pulse' : ''
                                            }`}
                                            style={{ width: `${state.progress || 0}%` }}
                                        />
                                    </div>
                                )}

                                {/* Error message */}
                                {state.status === 'error' && state.error && (
                                    <p className="text-xs text-red-600 mt-1 truncate" title={state.error}>
                                        {state.error}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
