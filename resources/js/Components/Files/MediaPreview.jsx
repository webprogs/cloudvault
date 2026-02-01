import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function MediaPreview({ file, onClose, onDownload, onShare }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    if (!file) return null;

    const isImage = file.icon_type === 'image';
    const isVideo = file.icon_type === 'video';

    const handleLoad = () => {
        setLoading(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm fade-in"
                onClick={onClose}
            />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* File info header */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-white font-medium truncate max-w-md">{file.name}</p>
                    <p className="text-white/60 text-sm">{file.formatted_size}</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                <button
                    onClick={() => onDownload(file)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
                {onShare && (
                    <button
                        onClick={() => {
                            onClose();
                            onShare(file);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                )}
            </div>

            {/* Media content */}
            <div className="relative max-w-[90vw] max-h-[85vh] modal-enter">
                {loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-white font-medium mb-1">Unable to load preview</p>
                        <p className="text-white/60 text-sm">Download the file to view it</p>
                    </div>
                )}

                {isImage && (
                    <img
                        src={file.preview_url || `/files/${file.id}/download`}
                        alt={file.name}
                        className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                )}

                {isVideo && (
                    <video
                        src={file.preview_url || `/files/${file.id}/download`}
                        controls
                        autoPlay
                        className={`max-w-full max-h-[85vh] rounded-lg shadow-2xl ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        onLoadedData={handleLoad}
                        onError={handleError}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}
