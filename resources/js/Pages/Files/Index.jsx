import { useState, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '../../Components/Layout/AppLayout';
import SearchBar from '../../Components/Search/SearchBar';
import FileGrid from '../../Components/Files/FileGrid';
import FileList from '../../Components/Files/FileList';
import FileUploader from '../../Components/Files/FileUploader';
import FileContextMenu from '../../Components/Files/FileContextMenu';
import ShareModal from '../../Components/Files/ShareModal';
import MediaPreview from '../../Components/Files/MediaPreview';
import MoveModal from '../../Components/Files/MoveModal';
import GroupFoldersModal from '../../Components/Files/GroupFoldersModal';
import PageDropOverlay from '../../Components/Files/PageDropOverlay';
import InlineUploadProgress from '../../Components/Files/InlineUploadProgress';
import Modal from '../../Components/UI/Modal';
import Button from '../../Components/UI/Button';
import useFileSort from '../../Hooks/useFileSort';
import usePageDropzone from '../../Hooks/usePageDropzone';

export default function FilesIndex({
    files,
    folders,
    currentFolder,
    breadcrumbs,
    filters,
    stats,
}) {
    const [viewMode, setViewMode] = useState('grid');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFile, setShareFile] = useState(null);
    const [existingShare, setExistingShare] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [folderContextMenu, setFolderContextMenu] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [renameName, setRenameName] = useState('');
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveItem, setMoveItem] = useState(null);
    const [moveItemType, setMoveItemType] = useState(null);
    const [selectedFolders, setSelectedFolders] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [inlineUploadFiles, setInlineUploadFiles] = useState([]);
    const [showInlineProgress, setShowInlineProgress] = useState(false);

    const { sortBy, sortOrder, handleSort } = useFileSort(
        filters.sort_by || 'created_at',
        filters.sort_order || 'desc'
    );

    // Page-level drag-and-drop for file uploads
    const handlePageFileDrop = useCallback((files) => {
        setInlineUploadFiles(files);
        setShowInlineProgress(true);
    }, []);

    const { isDragOver, dragHandlers } = usePageDropzone({
        onFileDrop: handlePageFileDrop,
        enabled: !showUploadModal, // Disable when modal is open
    });

    const handleSelectFile = useCallback((fileId, clearAll = false) => {
        if (clearAll) {
            setSelectedFiles([]);
            return;
        }
        setSelectedFiles((prev) =>
            prev.includes(fileId)
                ? prev.filter((id) => id !== fileId)
                : [...prev, fileId]
        );
    }, []);

    const handleContextMenu = useCallback((e, file) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
        setSelectedItem(file);
    }, []);

    const handleFolderContextMenu = useCallback((e, folder) => {
        e.preventDefault();
        setFolderContextMenu({ x: e.clientX, y: e.clientY });
        setSelectedItem(folder);
    }, []);

    const handleOpenFolder = (folderId) => {
        router.get('/files', { folder_id: folderId });
    };

    const handleDownload = (file) => {
        window.location.href = `/files/${file.id}/download`;
    };

    const handlePreview = (file) => {
        setPreviewFile(file);
    };

    const handleRename = (item) => {
        setSelectedItem(item);
        setRenameName(item.name);
        setShowRenameModal(true);
    };

    const handleDelete = (item) => {
        setDeleteItem(item);
        setShowDeleteModal(true);
    };

    const handleMove = (item, isFolder = false) => {
        setMoveItem(item);
        setMoveItemType(isFolder ? 'folder' : 'file');
        setShowMoveModal(true);
    };

    const submitMove = (itemId, itemType, targetFolderId) => {
        return new Promise((resolve, reject) => {
            const url = itemType === 'file'
                ? `/files/${itemId}/move`
                : `/folders/${itemId}/move`;
            const payload = itemType === 'file'
                ? { folder_id: targetFolderId }
                : { parent_id: targetFolderId };

            router.patch(url, payload, {
                onSuccess: () => resolve(),
                onError: (errors) => reject(errors),
            });
        });
    };

    const handleDropToFolder = (itemId, itemType, targetFolderId) => {
        const url = itemType === 'file'
            ? `/files/${itemId}/move`
            : `/folders/${itemId}/move`;
        const payload = itemType === 'file'
            ? { folder_id: targetFolderId }
            : { parent_id: targetFolderId };

        router.patch(url, payload);
    };

    const handleSelectFolder = useCallback((folderId) => {
        setSelectedFolders((prev) =>
            prev.includes(folderId)
                ? prev.filter((id) => id !== folderId)
                : [...prev, folderId]
        );
    }, []);

    const submitGroupFolders = (name) => {
        return new Promise((resolve, reject) => {
            router.post('/folders/group', {
                folder_ids: selectedFolders,
                name,
                parent_id: currentFolder?.id || null,
            }, {
                onSuccess: () => {
                    setSelectedFolders([]);
                    resolve();
                },
                onError: (errors) => reject(errors),
            });
        });
    };

    const handleShare = async (file) => {
        setShareFile(file);
        setExistingShare(null);

        // Fetch existing share if any
        try {
            const response = await fetch(`/shares/files/${file.id}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.share) {
                setExistingShare(data.share);
            }
        } catch {
            // No existing share
        }

        setShowShareModal(true);
    };

    const submitNewFolder = (e) => {
        e.preventDefault();
        router.post('/folders', {
            name: newFolderName,
            parent_id: currentFolder?.id || null,
        }, {
            onSuccess: () => {
                setShowNewFolderModal(false);
                setNewFolderName('');
            },
        });
    };

    const submitRename = (e) => {
        e.preventDefault();
        const isFolder = !selectedItem.extension;
        const url = isFolder
            ? `/folders/${selectedItem.id}`
            : `/files/${selectedItem.id}/rename`;
        const method = isFolder ? 'patch' : 'patch';

        router[method](url, { name: renameName }, {
            onSuccess: () => {
                setShowRenameModal(false);
                setSelectedItem(null);
                setRenameName('');
            },
        });
    };

    const submitDelete = () => {
        if (!deleteItem) return;

        const isFolder = !deleteItem.extension;
        const url = isFolder
            ? `/folders/${deleteItem.id}`
            : `/files/${deleteItem.id}`;

        router.delete(url, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeleteItem(null);
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedFiles.length === 0) return;
        router.post('/files/bulk-delete', { file_ids: selectedFiles }, {
            onSuccess: () => setSelectedFiles([]),
        });
    };

    const handleTypeFilter = (type) => {
        router.get('/files', {
            ...Object.fromEntries(new URLSearchParams(window.location.search)),
            folder_id: currentFolder?.id,
            type: type === 'all' ? undefined : type,
        }, {
            preserveState: true,
        });
    };

    return (
        <AppLayout title="My Files">
            <Head title="My Files" />

            {/* Page-level drag overlay */}
            <PageDropOverlay
                isVisible={isDragOver}
                folderName={currentFolder?.name || 'My Files'}
            />

            {/* Inline upload progress panel */}
            {showInlineProgress && (
                <InlineUploadProgress
                    files={inlineUploadFiles}
                    folderId={currentFolder?.id}
                    onComplete={() => router.reload({ only: ['files', 'stats'] })}
                    onClose={() => {
                        setShowInlineProgress(false);
                        setInlineUploadFiles([]);
                    }}
                />
            )}

            <div {...dragHandlers} className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={() => setShowUploadModal(true)}>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                        </Button>
                        <Button variant="secondary" onClick={() => setShowNewFolderModal(true)}>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            New Folder
                        </Button>
                        {selectedFiles.length > 0 && (
                            <Button variant="danger" onClick={handleBulkDelete}>
                                Delete ({selectedFiles.length})
                            </Button>
                        )}
                        {selectedFolders.length >= 2 && (
                            <Button variant="secondary" onClick={() => setShowGroupModal(true)}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Group ({selectedFolders.length})
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex-1 sm:w-72">
                            <SearchBar initialValue={filters.search || ''} />
                        </div>
                        <div className="flex items-center border border-border rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-50'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-50'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm">
                    <Link
                        href="/files"
                        className="text-primary hover:text-primary-hover font-medium"
                    >
                        My Files
                    </Link>
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.id} className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {index === breadcrumbs.length - 1 ? (
                                <span className="text-text-primary font-medium">{crumb.name}</span>
                            ) : (
                                <Link
                                    href={`/files?folder_id=${crumb.id}`}
                                    className="text-primary hover:text-primary-hover"
                                >
                                    {crumb.name}
                                </Link>
                            )}
                        </span>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {['all', 'image', 'video', 'audio', 'document', 'archive'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeFilter(type)}
                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                (filters.type || 'all') === type
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Stats bar */}
                <div className="text-sm text-text-secondary">
                    {stats.file_count} files · {stats.total_size} used
                </div>

                {/* File display */}
                {viewMode === 'grid' ? (
                    <FileGrid
                        files={files.data}
                        folders={folders}
                        selectedFiles={selectedFiles}
                        onSelectFile={handleSelectFile}
                        onContextMenu={handleContextMenu}
                        onOpenFolder={handleOpenFolder}
                        onFolderContextMenu={handleFolderContextMenu}
                        onPreview={handlePreview}
                        onDownload={handleDownload}
                        onShare={handleShare}
                        onDropToFolder={handleDropToFolder}
                        selectedFolders={selectedFolders}
                        onSelectFolder={handleSelectFolder}
                    />
                ) : (
                    <FileList
                        files={files.data}
                        folders={folders}
                        selectedFiles={selectedFiles}
                        onSelectFile={handleSelectFile}
                        onContextMenu={handleContextMenu}
                        onOpenFolder={handleOpenFolder}
                        onFolderContextMenu={handleFolderContextMenu}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        onDropToFolder={handleDropToFolder}
                        selectedFolders={selectedFolders}
                        onSelectFolder={handleSelectFolder}
                    />
                )}

                {/* Pagination */}
                {files.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {files.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-3 py-1 rounded ${
                                    link.active
                                        ? 'bg-primary text-white'
                                        : link.url
                                        ? 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Files"
                size="lg"
            >
                <FileUploader
                    folderId={currentFolder?.id}
                    onClose={() => setShowUploadModal(false)}
                />
            </Modal>

            {/* New Folder Modal */}
            <Modal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                title="Create New Folder"
            >
                <form onSubmit={submitNewFolder} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter folder name"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowNewFolderModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!newFolderName.trim()}>
                            Create
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Rename Modal */}
            <Modal
                isOpen={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                title={`Rename ${selectedItem?.extension ? 'File' : 'Folder'}`}
            >
                <form onSubmit={submitRename} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            New Name
                        </label>
                        <input
                            type="text"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowRenameModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!renameName.trim()}>
                            Rename
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteItem(null);
                }}
                title={`Delete ${deleteItem?.extension ? 'File' : 'Folder'}`}
            >
                <div className="space-y-4">
                    <p className="text-text-secondary">
                        Are you sure you want to delete <strong>{deleteItem?.name}</strong>?
                        {!deleteItem?.extension && ' All files inside will also be deleted.'}
                        This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={submitDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* File Context Menu */}
            {contextMenu && selectedItem && (
                <FileContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    file={selectedItem}
                    onClose={() => {
                        setContextMenu(null);
                        setSelectedItem(null);
                    }}
                    onDownload={handleDownload}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onMove={handleMove}
                    onShare={handleShare}
                />
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => {
                    setShowShareModal(false);
                    setShareFile(null);
                    setExistingShare(null);
                }}
                file={shareFile}
                existingShare={existingShare}
            />

            {/* Media Preview */}
            {previewFile && (
                <MediaPreview
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                    onDownload={handleDownload}
                    onShare={handleShare}
                />
            )}

            {/* Folder Context Menu */}
            {folderContextMenu && selectedItem && (
                <div
                    className="fixed z-50 bg-card rounded-lg shadow-lg border border-border py-1 min-w-[180px]"
                    style={{ left: folderContextMenu.x, top: folderContextMenu.y }}
                >
                    <button
                        onClick={() => {
                            handleOpenFolder(selectedItem.id);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Open
                    </button>
                    <button
                        onClick={() => {
                            handleRename(selectedItem);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Rename
                    </button>
                    <button
                        onClick={() => {
                            handleMove(selectedItem, true);
                            setFolderContextMenu(null);
                            setSelectedItem(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-gray-50 flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Move to...
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                        onClick={() => {
                            handleDelete(selectedItem);
                            setFolderContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-error hover:bg-red-50 flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}

            {/* Click outside to close folder context menu */}
            {folderContextMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setFolderContextMenu(null);
                        setSelectedItem(null);
                    }}
                />
            )}

            {/* Move Modal */}
            <MoveModal
                isOpen={showMoveModal}
                onClose={() => {
                    setShowMoveModal(false);
                    setMoveItem(null);
                    setMoveItemType(null);
                }}
                item={moveItem}
                itemType={moveItemType}
                onMove={submitMove}
                currentFolderId={moveItemType === 'file' ? moveItem?.folder_id : moveItem?.parent_id}
            />

            {/* Group Folders Modal */}
            <GroupFoldersModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                selectedFolders={folders.filter((f) => selectedFolders.includes(f.id))}
                onSubmit={submitGroupFolders}
            />
        </AppLayout>
    );
}
