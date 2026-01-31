import { useState } from 'react';
import { router } from '@inertiajs/react';
import ShareIndicator from './ShareIndicator';

export default function FileList({
    files,
    folders,
    selectedFiles,
    onSelectFile,
    onContextMenu,
    onOpenFolder,
    onFolderContextMenu,
    sortBy,
    sortOrder,
    onSort,
    onDropToFolder,
    selectedFolders,
    onSelectFolder,
}) {
    const [dragOverFolderId, setDragOverFolderId] = useState(null);
    const handleSort = (column) => {
        onSort(column);
    };

    const getSortIcon = (column) => {
        if (column !== sortBy) return null;
        return (
            <svg className={`w-4 h-4 inline ml-1 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (files.length === 0 && folders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No files yet</h3>
                <p className="text-text-secondary">Upload files to get started</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-border">
                    <tr>
                        <th className="w-10 px-4 py-4">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded-md border-border cursor-pointer"
                                checked={selectedFiles.length === files.length && files.length > 0}
                                onChange={() => {
                                    if (selectedFiles.length === files.length) {
                                        onSelectFile(null, true);
                                    } else {
                                        files.forEach(f => onSelectFile(f.id));
                                    }
                                }}
                            />
                        </th>
                        <th
                            className="px-4 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            Name {getSortIcon('name')}
                        </th>
                        <th
                            className="px-4 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors hidden sm:table-cell"
                            onClick={() => handleSort('created_at')}
                        >
                            Date {getSortIcon('created_at')}
                        </th>
                        <th
                            className="px-4 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors hidden md:table-cell"
                            onClick={() => handleSort('size')}
                        >
                            Size {getSortIcon('size')}
                        </th>
                        <th className="w-10 px-4 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {/* Folders */}
                    {folders.map((folder) => (
                        <tr
                            key={`folder-${folder.id}`}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                setDragOverFolderId(folder.id);
                            }}
                            onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setDragOverFolderId(null);
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOverFolderId(null);
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                    if (data.type === 'folder' && data.id === folder.id) return;
                                    if (onDropToFolder) {
                                        onDropToFolder(data.id, data.type, folder.id);
                                    }
                                } catch (error) {
                                    console.error('Drop error:', error);
                                }
                            }}
                            className={`cursor-pointer transition-colors ${
                                dragOverFolderId === folder.id
                                    ? 'bg-primary-light/50 ring-2 ring-primary/40'
                                    : selectedFolders?.includes(folder.id)
                                    ? 'bg-primary-light/30'
                                    : 'hover:bg-gray-50/60'
                            }`}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    if (onSelectFolder) {
                                        onSelectFolder(folder.id);
                                    }
                                } else {
                                    onOpenFolder(folder.id);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                onFolderContextMenu(e, folder);
                            }}
                        >
                            <td className="px-4 py-4">
                                {onSelectFolder ? (
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded-md border-border cursor-pointer"
                                        checked={selectedFolders?.includes(folder.id)}
                                        onChange={() => onSelectFolder(folder.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className="w-5" />
                                )}
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-primary-light to-blue-100 flex items-center justify-center shrink-0 transition-transform ${dragOverFolderId === folder.id ? 'scale-110' : ''}`}>
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-text-primary">{folder.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary hidden sm:table-cell">
                                {formatDate(folder.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary hidden md:table-cell">
                                —
                            </td>
                            <td className="px-4 py-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFolderContextMenu(e, folder);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}

                    {/* Files */}
                    {files.map((file) => (
                        <tr
                            key={`file-${file.id}`}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id }));
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            className={`hover:bg-gray-50/60 transition-colors ${selectedFiles.includes(file.id) ? 'bg-primary-light/30' : ''}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                onContextMenu(e, file);
                            }}
                        >
                            <td className="px-4 py-4">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded-md border-border cursor-pointer"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => onSelectFile(file.id)}
                                />
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-text-primary truncate">{file.name}</p>
                                            {file.is_shared && <ShareIndicator size="sm" />}
                                        </div>
                                        <p className="text-xs text-text-secondary uppercase">{file.extension}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary hidden sm:table-cell">
                                {formatDate(file.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary hidden md:table-cell">
                                {file.formatted_size}
                            </td>
                            <td className="px-4 py-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onContextMenu(e, file);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
