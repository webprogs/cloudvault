import { useState } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

export default function GroupFoldersModal({
    isOpen,
    onClose,
    selectedFolders,
    onSubmit,
}) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSubmit(name.trim());
            setName('');
            onClose();
        } catch (error) {
            console.error('Group failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Group Folders">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Create a new folder containing the selected folders:
                </p>

                <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-3 bg-gray-50">
                    <ul className="space-y-1">
                        {selectedFolders.map((folder) => (
                            <li key={folder.id} className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <span className="text-text-primary truncate">{folder.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        New Folder Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter folder name"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" type="button" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim() || loading}>
                        {loading ? 'Creating...' : 'Group Folders'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
