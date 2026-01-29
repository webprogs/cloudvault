import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '../../Components/Layout/AppLayout';
import Button from '../../Components/UI/Button';
import Modal from '../../Components/UI/Modal';

export default function SharesIndex({ shares }) {
    const [deleteModal, setDeleteModal] = useState({ open: false, share: null });
    const [copied, setCopied] = useState(null);

    const copyToClipboard = async (url, shareId) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(shareId);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(shareId);
            setTimeout(() => setCopied(null), 2000);
        }
    };

    const handleRevoke = async () => {
        if (!deleteModal.share) return;

        try {
            await fetch(`/shares/${deleteModal.share.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            router.reload();
        } catch (err) {
            console.error('Failed to revoke share:', err);
        } finally {
            setDeleteModal({ open: false, share: null });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (share) => {
        if (!share.is_active) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Revoked</span>;
        }
        if (share.is_expired) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">Expired</span>;
        }
        if (share.is_download_limit_reached) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-600">Limit Reached</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">Active</span>;
    };

    return (
        <AppLayout title="Shared Files">
            <Head title="Shared Files" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">Your Shared Links</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Manage all your shared file links
                        </p>
                    </div>
                </div>

                {/* Shares Table */}
                {shares.data.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No shared links yet</h3>
                        <p className="text-text-secondary mb-6">
                            Share files from your file manager to create links
                        </p>
                        <Link href="/files">
                            <Button>Go to Files</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            File
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Downloads
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Expires
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {shares.data.map((share) => (
                                        <tr key={share.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <p className="font-medium text-text-primary truncate">
                                                            {share.file?.name || 'Deleted file'}
                                                        </p>
                                                        <p className="text-xs text-text-secondary truncate">
                                                            {share.share_url}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {share.share_type === 'password' ? (
                                                        <>
                                                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            <span className="text-sm text-text-primary">Password</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-sm text-text-primary">Public</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(share)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                                                {share.access_count}
                                                {share.max_downloads && (
                                                    <span className="text-text-secondary"> / {share.max_downloads}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {formatDate(share.expires_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                                {formatDate(share.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => copyToClipboard(share.share_url, share.id)}
                                                        className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 transition-colors"
                                                        title="Copy link"
                                                    >
                                                        {copied === share.id ? (
                                                            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, share })}
                                                        className="p-2 rounded-lg text-error hover:bg-red-50 transition-colors"
                                                        title="Revoke share"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {shares.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-border flex justify-center gap-2">
                                {shares.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded-lg ${
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
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, share: null })}
                title="Revoke Share Link"
            >
                <div className="space-y-4">
                    <p className="text-text-secondary">
                        Are you sure you want to revoke this share link? Anyone with this link will no longer be able to access the file.
                    </p>
                    {deleteModal.share && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="font-medium text-text-primary truncate">
                                {deleteModal.share.file?.name}
                            </p>
                            <p className="text-sm text-text-secondary truncate mt-1">
                                {deleteModal.share.share_url}
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setDeleteModal({ open: false, share: null })}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleRevoke}>
                            Revoke Link
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
