import { useState } from 'react';

function FolderTreeItem({ folder, selectedId, onSelect, disabledIds, level = 0 }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = folder.children && folder.children.length > 0;
    const isDisabled = disabledIds.includes(folder.id);
    const isSelected = selectedId === folder.id;

    return (
        <div>
            <div
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                    isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={() => {
                    if (!isDisabled) {
                        onSelect(folder.id);
                    }
                }}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className={`p-0.5 rounded transition-colors ${isSelected ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ) : (
                    <div className="w-5" />
                )}
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                </svg>
                <span className="truncate text-sm font-medium">{folder.name}</span>
            </div>
            {hasChildren && expanded && (
                <div>
                    {folder.children.map((child) => (
                        <FolderTreeItem
                            key={child.id}
                            folder={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            disabledIds={disabledIds}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders, selectedId, onSelect, disabledIds = [] }) {
    return (
        <div className="space-y-1">
            {/* Root option */}
            <div
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                    selectedId === null
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelect(null)}
            >
                <div className="w-5" />
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
                <span className="text-sm font-medium">My Files (Root)</span>
            </div>

            {/* Folder tree */}
            {folders.map((folder) => (
                <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    disabledIds={disabledIds}
                />
            ))}
        </div>
    );
}
