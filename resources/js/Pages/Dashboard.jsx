import { Head, Link } from '@inertiajs/react';
import AppLayout from '../Components/Layout/AppLayout';

export default function Dashboard({ stats, typeBreakdown, recentFiles }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">Total Files</p>
                                <p className="text-2xl font-bold text-text-primary">{stats.file_count}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">Total Folders</p>
                                <p className="text-2xl font-bold text-text-primary">{stats.folder_count}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary">Storage Used</p>
                                <p className="text-2xl font-bold text-text-primary">{stats.total_size}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* File Types */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">File Types</h3>
                        {typeBreakdown.length > 0 ? (
                            <div className="space-y-3">
                                {typeBreakdown.map((type) => (
                                    <div key={type.extension} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-text-secondary uppercase bg-gray-100 px-2 py-1 rounded">
                                                {type.extension || 'Unknown'}
                                            </span>
                                            <span className="text-sm text-text-primary">{type.count} files</span>
                                        </div>
                                        <span className="text-sm text-text-secondary">
                                            {formatBytes(type.total_size)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-sm">No files uploaded yet</p>
                        )}
                    </div>

                    {/* Recent Files */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">Recent Files</h3>
                            <Link
                                href="/files"
                                className="text-sm text-primary hover:text-primary-hover font-medium"
                            >
                                View all
                            </Link>
                        </div>
                        {recentFiles.length > 0 ? (
                            <div className="space-y-3">
                                {recentFiles.map((file) => (
                                    <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-text-primary truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                {formatDate(file.created_at)}
                                            </p>
                                        </div>
                                        <span className="text-xs text-text-secondary flex-shrink-0">
                                            {file.formatted_size}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-sm">No files uploaded yet</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/files"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Files
                        </Link>
                        <Link
                            href="/files"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Browse Files
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
