import { Head, useForm } from '@inertiajs/react';
import AppLayout from '../../Components/Layout/AppLayout';
import Button from '../../Components/UI/Button';

export default function ChangePassword() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/password', {
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout title="Change Password">
            <Head title="Change Password" />

            <div className="max-w-xl mx-auto">
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-1">Update Password</h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Ensure your account is using a long, random password to stay secure.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.current_password ? 'border-error' : 'border-border'
                                }`}
                            />
                            {errors.current_password && (
                                <p className="mt-1 text-sm text-error">{errors.current_password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.password ? 'border-error' : 'border-border'
                                }`}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-error">{errors.password}</p>
                            )}
                            <p className="mt-1 text-xs text-text-secondary">
                                Minimum 8 characters with letters and numbers
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                    errors.password_confirmation ? 'border-error' : 'border-border'
                                }`}
                            />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-error">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" loading={processing}>
                                Update Password
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
