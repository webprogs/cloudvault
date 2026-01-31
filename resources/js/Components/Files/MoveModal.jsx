import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import FolderTree from './FolderTree';

export default function MoveModal({
    isOpen,
    onClose,
    item,
    itemType,
    onMove,
    currentFolderId,
}) {
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setFetching(true);
            setSelectedFolderId(currentFolderId);
            fetch('/folders/tree', {
                headers: {
                    'Accept': 'application/json',
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    setFolders(data.folders || []);
                })
                .catch(console.error)
                .finally(() => setFetching(false));
        }
    }, [isOpen, currentFolderId]);

    const getDisabledIds = () => {
        if (itemType !== 'folder' || !item) return [];

        // Can't move a folder into itself or its descendants
        const disabledIds = [item.id];

        const addDescendants = (folders) => {
            folders.forEach((folder) => {
                if (folder.id === item.id) {
                    const collectChildIds = (children) => {
                        children.forEach((child) => {
                            disabledIds.push(child.id);
                            if (child.children) {
                                collectChildIds(child.children);
                            }
                        });
                    };
                    if (folder.children) {
                        collectChildIds(folder.children);
                    }
                } else if (folder.children) {
                    addDescendants(folder.children);
                }
            });
        };

        addDescendants(folders);
        return disabledIds;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onMove(item.id, itemType, selectedFolderId);
            onClose();
        } catch (error) {
            console.error('Move failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const isCurrentLocation = selectedFolderId === currentFolderId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Move ${item?.name || ''}`}>
            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Select a destination folder:
                </p>

                {fetching ? (
                    <div className="flex items-center justify-center py-8">
                        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                ) : (
                    <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                        <FolderTree
                            folders={folders}
                            selectedId={selectedFolderId}
                            onSelect={setSelectedFolderId}
                            disabledIds={getDisabledIds()}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || isCurrentLocation}
                    >
                        {loading ? 'Moving...' : 'Move'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
