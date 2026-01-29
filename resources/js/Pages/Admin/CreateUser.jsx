import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '../../Components/Layout/AppLayout';
import Button from '../../Components/UI/Button';

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <AppLayout title="Create User">
            <Head title="Create User" />

            <div className="max-w-xl mx-auto">
                {/* Back link */}
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Users
                </Link>

                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-1">Create New User</h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Add a new user to the system with their own storage space.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.name ? 'border-error' : 'border-border'
                                }`}
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-error">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.username ? 'border-error' : 'border-border'
                                }`}
                                placeholder="johndoe"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-error">{errors.username}</p>
                            )}
                            <p className="mt-1 text-xs text-text-secondary">
                                Letters, numbers, and underscores only
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.email ? 'border-error' : 'border-border'
                                }`}
                                placeholder="john@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-error">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.password ? 'border-error' : 'border-border'
                                }`}
                                placeholder="Minimum 8 characters"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-error">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-text-secondary">
                                At least 8 characters with letters and numbers
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Role
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.role ? 'border-error' : 'border-border'
                                }`}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            {errors.role && (
                                <p className="mt-1 text-sm text-error">{errors.role}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Link href="/admin/users">
                                <Button variant="ghost">Cancel</Button>
                            </Link>
                            <Button type="submit" loading={processing}>
                                Create User
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
