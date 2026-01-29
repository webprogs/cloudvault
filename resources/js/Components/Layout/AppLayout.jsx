import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect, useState } from 'react';

export default function AppLayout({ children, title }) {
    const { flash } = usePage().props;
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
        }

        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <div className="lg:pl-64">
                <Header title={title} />

                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
                        notification.type === 'success'
                            ? 'bg-success text-white'
                            : 'bg-error text-white'
                    }`}>
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span>{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-2 hover:opacity-80"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
