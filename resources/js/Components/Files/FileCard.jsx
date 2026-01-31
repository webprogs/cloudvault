import { useState, useRef, useEffect } from 'react';
import ShareIndicator from './ShareIndicator';

export default function FileCard({ file, selected, onSelect, onContextMenu, onPreview, onDownload, onShare, onDragStart, onDragEnd }) {
    const [imageError, setImageError] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIconByType = (iconType) => {
        const icons = {
            image: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            video: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            audio: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            ),
            document: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            archive: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            file: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        };
        return icons[iconType] || icons.file;
    };

    const iconColors = {
        image: 'text-green-500 bg-green-50',
        video: 'text-purple-500 bg-purple-50',
        audio: 'text-pink-500 bg-pink-50',
        document: 'text-blue-500 bg-blue-50',
        archive: 'text-yellow-500 bg-yellow-50',
        file: 'text-gray-500 bg-gray-50',
    };

    const isImage = file.icon_type === 'image';
    const isVideo = file.icon_type === 'video';
    const isPreviewable = isImage || isVideo;

    const handleClick = (e) => {
        if (e.ctrlKey || e.metaKey) {
            onSelect(file.id);
        } else if (isPreviewable && onPreview) {
            onPreview(file);
        }
    };

    const handleDoubleClick = () => {
        if (onDownload) {
            onDownload(file);
        }
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) {
            onDragStart(file, 'file');
        }
    };

    const handleDragEnd = () => {
        if (onDragEnd) {
            onDragEnd();
        }
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`group relative bg-card border rounded-2xl p-4 transition-all duration-200 cursor-pointer card-hover ${
                selected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/40 hover:shadow-lg'
            }`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, file);
            }}
        >
            {/* Selection checkbox */}
            <div
                className={`absolute top-3 left-3 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 z-10 ${
                    selected
                        ? 'bg-primary border-primary shadow-sm'
                        : 'border-border bg-white opacity-0 group-hover:opacity-100 hover:border-primary/50'
                }`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(file.id);
                }}
            >
                {selected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>

            {/* Options dropdown */}
            <div className="absolute top-3 right-3 z-10" ref={dropdownRef}>
                <button
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                        showDropdown
                            ? 'bg-gray-100 opacity-100'
                            : 'hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                    }}
                >
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-1 w-44 bg-card rounded-xl shadow-xl border border-border py-1.5 slide-up">
                        {isPreviewable && onPreview && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(false);
                                    onPreview(file);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Preview
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(false);
                                onDownload && onDownload(file);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                        {onShare && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(false);
                                    onShare(file);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share
                            </button>
                        )}
                        <div className="my-1.5 border-t border-border" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(false);
                                onContextMenu(e, file);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            More options...
                        </button>
                    </div>
                )}
            </div>

            {/* File preview/icon */}
            <div className="flex justify-center mb-4 mt-2">
                {isImage && !imageError ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100 relative">
                        <img
                            src={file.thumbnail_url || `/files/${file.id}/download`}
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => setImageError(true)}
                        />
                        {/* Play icon overlay for videos would go here if needed */}
                    </div>
                ) : isVideo ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-900 relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconColors.video}`}>
                            {getIconByType('video')}
                        </div>
                    </div>
                ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconColors[file.icon_type]} transition-transform duration-200 group-hover:scale-110`}>
                        {getIconByType(file.icon_type)}
                    </div>
                )}
            </div>

            {/* File info */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                    <p className="text-sm font-medium text-text-primary truncate max-w-[140px]" title={file.name}>
                        {file.name}
                    </p>
                    {file.is_shared && <ShareIndicator size="sm" />}
                </div>
                <p className="text-xs text-text-secondary mt-1.5">
                    {file.formatted_size}
                </p>
            </div>
        </div>
    );
}
