import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
};

export default function ShareModal({ isOpen, onClose, file, existingShare }) {
    const [shareType, setShareType] = useState('public');
    const [password, setPassword] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [maxDownloads, setMaxDownloads] = useState('');
    const [loading, setLoading] = useState(false);
    const [share, setShare] = useState(existingShare || null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (existingShare) {
            setShare(existingShare);
            setShareType(existingShare.share_type);
            setExpiresAt(existingShare.expires_at ? existingShare.expires_at.slice(0, 16) : '');
            setMaxDownloads(existingShare.max_downloads?.toString() || '');
        } else {
            setShare(null);
            setShareType('public');
            setPassword('');
            setExpiresAt('');
            setMaxDownloads('');
        }
        setError('');
    }, [existingShare, isOpen]);

    const handleCreateShare = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/shares/files/${file.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    share_type: shareType,
                    password: shareType === 'password' ? password : null,
                    expires_at: expiresAt || null,
                    max_downloads: maxDownloads ? parseInt(maxDownloads) : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create share link');
            }

            setShare(data.share);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateShare = async () => {
        if (!share) return;
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/shares/${share.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    share_type: shareType,
                    password: shareType === 'password' && password ? password : null,
                    expires_at: expiresAt || null,
                    max_downloads: maxDownloads ? parseInt(maxDownloads) : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update share');
            }

            setShare(data.share);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeShare = async () => {
        if (!share) return;
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/shares/${share.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to revoke share');
            }

            setShare(null);
            setShareType('public');
            setPassword('');
            setExpiresAt('');
            setMaxDownloads('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!share?.share_url) return;
        try {
            await navigator.clipboard.writeText(share.share_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = share.share_url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Share "${file?.name}"`} size="md">
            <div className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-error">
                        {error}
                    </div>
                )}

                {share ? (
                    <>
                        {/* Share Link Display */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-primary">
                                Share Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={share.share_url}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-gray-50 text-text-primary text-sm"
                                />
                                <Button
                                    variant={copied ? 'secondary' : 'primary'}
                                    onClick={copyToClipboard}
                                >
                                    {copied ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Share Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-text-secondary uppercase tracking-wider">Downloads</p>
                                <p className="text-2xl font-semibold text-text-primary mt-1">
                                    {share.access_count}
                                    {share.max_downloads && (
                                        <span className="text-sm font-normal text-text-secondary"> / {share.max_downloads}</span>
                                    )}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-text-secondary uppercase tracking-wider">Expires</p>
                                <p className="text-lg font-semibold text-text-primary mt-1">
                                    {share.expires_at
                                        ? new Date(share.expires_at).toLocaleDateString()
                                        : 'Never'}
                                </p>
                            </div>
                        </div>

                        {/* Share Settings */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-medium text-text-primary">Update Settings</h4>

                            {/* Share Type */}
                            <div className="space-y-2">
                                <label className="block text-sm text-text-secondary">Access Type</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="shareType"
                                            value="public"
                                            checked={shareType === 'public'}
                                            onChange={(e) => setShareType(e.target.value)}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-text-primary">Public</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="shareType"
                                            value="password"
                                            checked={shareType === 'password'}
                                            onChange={(e) => setShareType(e.target.value)}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-text-primary">Password Protected</span>
                                    </label>
                                </div>
                            </div>

                            {shareType === 'password' && (
                                <div className="space-y-2">
                                    <label className="block text-sm text-text-secondary">
                                        New Password {share.share_type === 'password' && '(leave blank to keep current)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Enter password"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm text-text-secondary">Expires At</label>
                                    <input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm text-text-secondary">Max Downloads</label>
                                    <input
                                        type="number"
                                        value={maxDownloads}
                                        onChange={(e) => setMaxDownloads(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Unlimited"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4">
                            <Button variant="danger" onClick={handleRevokeShare} loading={loading}>
                                Revoke Link
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={onClose}>
                                    Close
                                </Button>
                                <Button onClick={handleUpdateShare} loading={loading}>
                                    Update
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleCreateShare} className="space-y-4">
                        {/* Share Type */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-primary">Access Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShareType('public')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        shareType === 'public'
                                            ? 'border-primary bg-primary-light'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            shareType === 'public' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                                        }`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-text-primary">Public</span>
                                    </div>
                                    <p className="text-xs text-text-secondary">Anyone with the link can download</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShareType('password')}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        shareType === 'password'
                                            ? 'border-primary bg-primary-light'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            shareType === 'password' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                                        }`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-text-primary">Password</span>
                                    </div>
                                    <p className="text-xs text-text-secondary">Requires password to download</p>
                                </button>
                            </div>
                        </div>

                        {shareType === 'password' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-primary">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter a secure password"
                                    required={shareType === 'password'}
                                    minLength={4}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-primary">Expires At</label>
                                <input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-text-secondary">Leave empty for no expiration</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-primary">Max Downloads</label>
                                <input
                                    type="number"
                                    value={maxDownloads}
                                    onChange={(e) => setMaxDownloads(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Unlimited"
                                    min="1"
                                />
                                <p className="text-xs text-text-secondary">Leave empty for unlimited</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={loading}>
                                Create Share Link
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
