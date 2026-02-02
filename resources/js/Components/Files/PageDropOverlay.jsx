/**
 * Full-screen overlay shown when dragging files over the page.
 * Provides visual feedback that files can be dropped to upload.
 */
export default function PageDropOverlay({ isVisible, folderName }) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Semi-transparent backdrop */}
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm" />

            {/* Dashed border around the page */}
            <div className="absolute inset-4 border-4 border-dashed border-primary rounded-2xl" />

            {/* Centered drop indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
                    {/* Upload icon */}
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>

                    {/* Drop text */}
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                        Drop files to upload
                    </h3>

                    {/* Folder context */}
                    <p className="text-sm text-text-secondary">
                        Files will be uploaded to{' '}
                        <span className="font-medium text-text-primary">
                            {folderName}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
