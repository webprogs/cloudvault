import { Head, Link } from '@inertiajs/react';
import Button from '../../Components/UI/Button';

export default function Expired({ reason, message }) {
    const icons = {
        not_found: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        expired: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        revoked: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
        limit_reached: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    };

    const titles = {
        not_found: 'Link Not Found',
        expired: 'Link Expired',
        revoked: 'Link Revoked',
        limit_reached: 'Download Limit Reached',
    };

    return (
        <>
            <Head title="Share Link Unavailable" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-primary-dark">Gray Media</span>
                    </div>

                    <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-red-50 text-error">
                                {icons[reason] || icons.not_found}
                            </div>

                            <h1 className="text-2xl font-semibold text-text-primary mb-3">
                                {titles[reason] || 'Link Unavailable'}
                            </h1>

                            <p className="text-text-secondary mb-8">
                                {message}
                            </p>

                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    Go to Gray Media
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-sm text-text-secondary mt-6">
                        Need to share files? Sign up for Gray Media
                    </p>
                </div>
            </div>
        </>
    );
}
