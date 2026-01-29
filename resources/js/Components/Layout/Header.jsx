import { Link, usePage, router } from '@inertiajs/react';
import Dropdown, { DropdownItem, DropdownDivider } from '../UI/Dropdown';

export default function Header({ title }) {
    const { auth } = usePage().props;

    const handleLogout = () => {
        router.post('/logout');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border/80">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-text-primary lg:ml-0 ml-12">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <Dropdown
                        trigger={
                            <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-sm font-semibold text-white">
                                        {getInitials(auth.user?.name)}
                                    </span>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-medium text-text-primary">{auth.user?.name}</p>
                                    <p className="text-xs text-text-secondary capitalize">{auth.user?.role}</p>
                                </div>
                                <svg className="w-4 h-4 text-text-secondary hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        }
                        width="w-56"
                    >
                        <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-medium text-text-primary">{auth.user?.name}</p>
                            <p className="text-xs text-text-secondary">@{auth.user?.username}</p>
                        </div>
                        <Link href="/password" className="block">
                            <DropdownItem>
                                <span className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Change Password
                                </span>
                            </DropdownItem>
                        </Link>
                        <DropdownDivider />
                        <DropdownItem onClick={handleLogout} danger>
                            <span className="flex items-center gap-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                            </span>
                        </DropdownItem>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}
