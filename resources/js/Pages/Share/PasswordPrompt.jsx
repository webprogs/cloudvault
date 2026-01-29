import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Button from '../../Components/UI/Button';

export default function PasswordPrompt({ token, fileName }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/share/${token}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            setVerified(true);
            setFileInfo(data.file);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.location.href = `/share/${token}/download?password=${encodeURIComponent(password)}`;
    };

    const getIconByType = (iconType) => {
        const icons = {
            image: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            video: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            document: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            file: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        };
        return icons[iconType] || icons.file;
    };

    return (
        <>
            <Head title="Protected File" />

            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-primary-dark">CloudVault</span>
                    </div>

                    <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
                        {!verified ? (
                            <>
                                <div className="p-6 border-b border-border text-center">
                                    <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-xl font-semibold text-text-primary">Password Protected</h1>
                                    <p className="text-text-secondary mt-2">
                                        This file requires a password to access
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <p className="text-sm text-text-secondary mb-1">File name</p>
                                        <p className="font-medium text-text-primary truncate">{fileName}</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-error">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Enter Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                            placeholder="Enter the share password"
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" loading={loading}>
                                        Verify Password
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="p-6 border-b border-border text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-success">
                                        {getIconByType(fileInfo?.icon_type)}
                                    </div>
                                    <h1 className="text-xl font-semibold text-text-primary">Ready to Download</h1>
                                    <p className="text-text-secondary mt-2">
                                        Password verified successfully
                                    </p>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-text-primary">{fileInfo?.name}</p>
                                                <p className="text-sm text-text-secondary">{fileInfo?.formatted_size}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-gray-200 rounded-lg text-xs font-medium text-text-secondary uppercase">
                                                {fileInfo?.extension}
                                            </span>
                                        </div>
                                    </div>

                                    <Button onClick={handleDownload} className="w-full" size="lg">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download File
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    <p className="text-center text-sm text-text-secondary mt-6">
                        Shared via CloudVault
                    </p>
                </div>
            </div>
        </>
    );
}
