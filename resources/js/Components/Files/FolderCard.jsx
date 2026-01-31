import { useState } from 'react';

export default function FolderCard({
    folder,
    onOpen,
    onContextMenu,
    onDrop,
    onDragStart,
    onDragEnd,
    selected,
    onSelect,
    selectable,
}) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) {
            onDragStart(folder, 'folder');
        }
    };

    const handleDragEnd = () => {
        setIsDragOver(false);
        if (onDragEnd) {
            onDragEnd();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        // Check if the dragged item is not this folder
        try {
            const data = e.dataTransfer.types.includes('application/json');
            if (data) {
                setIsDragOver(true);
            }
        } catch {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        // Only set false if we're actually leaving the element
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            // Don't allow dropping a folder into itself
            if (data.type === 'folder' && data.id === folder.id) {
                return;
            }
            if (onDrop) {
                onDrop(data.id, data.type, folder.id);
            }
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    const handleClick = (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (onSelect) {
                e.stopPropagation();
                onSelect(folder.id);
            }
        } else {
            onOpen();
        }
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative bg-card border rounded-2xl p-4 transition-all duration-200 cursor-pointer card-hover ${
                isDragOver
                    ? 'border-primary ring-2 ring-primary/40 bg-primary-light/30'
                    : selected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/40 hover:shadow-lg'
            }`}
            onClick={handleClick}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, folder);
            }}
        >
            {/* Selection checkbox */}
            {selectable && (
                <div
                    className={`absolute top-3 left-3 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 z-10 ${
                        selected
                            ? 'bg-primary border-primary shadow-sm'
                            : 'border-border bg-white opacity-0 group-hover:opacity-100 hover:border-primary/50'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSelect) {
                            onSelect(folder.id);
                        }
                    }}
                >
                    {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            )}

            {/* Folder icon */}
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-light to-blue-100 text-primary transition-transform duration-200 group-hover:scale-110 ${isDragOver ? 'scale-110' : ''}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
            </div>

            {/* Folder info */}
            <div className="text-center">
                <p className="text-sm font-medium text-text-primary truncate max-w-[140px] mx-auto" title={folder.name}>
                    {folder.name}
                </p>
            </div>

            {/* More options button */}
            <button
                className="absolute top-3 right-3 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, folder);
                }}
            >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
        </div>
    );
}
