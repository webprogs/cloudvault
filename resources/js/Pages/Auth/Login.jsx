import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Button from '../../Components/UI/Button';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-primary-dark">Gray Media</h1>
                        <p className="text-text-secondary mt-2">Your files in the cloud</p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                        errors.username ? 'border-error' : 'border-border'
                                    }`}
                                    placeholder="Enter your username"
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-error">{errors.username}</p>
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
                                    className={`w-full px-4 py-2.5 border rounded-lg bg-card text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                                        errors.password ? 'border-error' : 'border-border'
                                    }`}
                                    placeholder="Enter your password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-error">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-text-secondary">
                                    Remember me
                                </label>
                            </div>

                            <Button
                                type="submit"
                                loading={processing}
                                className="w-full"
                                size="lg"
                            >
                                Sign in
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-text-secondary mt-6">
                        Secure cloud storage powered by Gray Media
                    </p>
                </div>
            </div>
        </>
    );
}
