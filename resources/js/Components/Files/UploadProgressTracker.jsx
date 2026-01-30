export default function UploadProgressTracker({
    files,
    uploadStates,
    onRemove,
    onCancel,
    onRetry,
    formatFileSize
}) {
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
        <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
                {files.length} file(s) selected
            </p>
            <div className="max-h-64 overflow-y-auto space-y-3">
                {files.map((file, index) => {
                    const state = uploadStates[index] || { status: 'pending', progress: 0 };
                    const isActive = ['initializing', 'uploading', 'processing'].includes(state.status);

                    return (
                        <div
                            key={`${file.name}-${index}`}
                            className="p-3 bg-gray-50 rounded-lg space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        state.status === 'completed' ? 'bg-green-100' :
                                        state.status === 'error' ? 'bg-red-100' :
                                        'bg-primary-light'
                                    }`}>
                                        {state.status === 'completed' ? (
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : state.status === 'error' ? (
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : isActive ? (
                                            <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {file.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-text-secondary">
                                                {formatFileSize(file.size)}
                                            </span>
                                            <span className={`${getStatusColor(state.status)}`}>
                                                {getStatusText(state.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Retry button for failed uploads */}
                                    {state.status === 'error' && (
                                        <button
                                            onClick={() => onRetry(index)}
                                            className="p-1.5 text-primary hover:bg-primary-light rounded-lg transition-colors"
                                            title="Retry"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Cancel button for active uploads */}
                                    {isActive && (
                                        <button
                                            onClick={() => onCancel(index)}
                                            className="p-1.5 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                                            title="Cancel"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Remove button for pending/completed/cancelled/error */}
                                    {!isActive && (
                                        <button
                                            onClick={() => onRemove(index)}
                                            className="p-1.5 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            {(isActive || state.status === 'completed') && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-secondary">
                                            {state.status === 'processing' ? 'Processing on server...' :
                                             state.status === 'completed' ? 'Upload complete' :
                                             `Uploading chunk ${state.uploadedChunks || 0} of ${state.totalChunks || '?'}`}
                                        </span>
                                        <span className="text-text-primary font-medium">
                                            {Math.round(state.progress || 0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${getProgressBarColor(state.status)} ${
                                                state.status === 'processing' ? 'animate-pulse' : ''
                                            }`}
                                            style={{ width: `${state.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error message */}
                            {state.status === 'error' && state.error && (
                                <p className="text-xs text-red-600 mt-1">
                                    {state.error}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
