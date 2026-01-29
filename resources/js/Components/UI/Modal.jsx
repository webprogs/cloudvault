import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true,
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop with blur */}
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm fade-in"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className={`relative w-full ${sizes[size]} bg-card rounded-2xl shadow-2xl modal-enter border border-border/50`}>
                    {/* Header */}
                    {(title || showClose) && (
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                            {title && (
                                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                            )}
                            {showClose && (
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-xl text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
