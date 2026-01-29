import { Head } from '@inertiajs/react';
import Button from '../../Components/UI/Button';

export default function Download({ token, file }) {
    const handleDownload = () => {
        window.location.href = `/share/${token}/download`;
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
            audio: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            ),
            document: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            archive: (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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

    const iconColors = {
        image: 'text-green-500 bg-green-50',
        video: 'text-purple-500 bg-purple-50',
        audio: 'text-pink-500 bg-pink-50',
        document: 'text-blue-500 bg-blue-50',
        archive: 'text-yellow-500 bg-yellow-50',
        file: 'text-gray-500 bg-gray-50',
    };

    return (
        <>
            <Head title={`Download ${file.name}`} />

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
                        <div className="p-8 text-center">
                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 ${iconColors[file.icon_type]}`}>
                                {getIconByType(file.icon_type)}
                            </div>

                            <h1 className="text-xl font-semibold text-text-primary mb-2 break-words">
                                {file.name}
                            </h1>

                            <div className="flex items-center justify-center gap-3 text-text-secondary mb-6">
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium uppercase">
                                    {file.extension}
                                </span>
                                <span className="text-sm">{file.formatted_size}</span>
                            </div>

                            <Button onClick={handleDownload} className="w-full" size="lg">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download File
                            </Button>
                        </div>
                    </div>

                    <p className="text-center text-sm text-text-secondary mt-6">
                        Shared via CloudVault
                    </p>
                </div>
            </div>
        </>
    );
}
