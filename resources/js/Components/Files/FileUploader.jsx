import { useState, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import Button from '../UI/Button';

export default function FileUploader({ folderId, onClose }) {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({});
    const inputRef = useRef(null);

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
        setFiles((prev) => [...prev, ...droppedFiles]);
    }, []);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = () => {
        if (files.length === 0) return;

        setUploading(true);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });
        if (folderId) {
            formData.append('folder_id', folderId);
        }

        router.post('/files/upload', formData, {
            forceFormData: true,
            onProgress: (progress) => {
                setProgress({ percentage: progress.percentage });
            },
            onSuccess: () => {
                setFiles([]);
                setUploading(false);
                onClose?.();
            },
            onError: () => {
                setUploading(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
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
                        Maximum file size: 100MB
                    </p>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">
                        {files.length} file(s) selected
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                {!uploading && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 text-text-secondary hover:text-error transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            {uploading && progress.percentage !== undefined && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Uploading...</span>
                        <span className="text-text-primary font-medium">{Math.round(progress.percentage)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    disabled={files.length === 0}
                    loading={uploading}
                >
                    Upload {files.length > 0 && `(${files.length})`}
                </Button>
            </div>
        </div>
    );
}
