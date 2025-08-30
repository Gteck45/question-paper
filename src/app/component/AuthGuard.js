"use client";

import { useAuth } from '../store/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children, requireAuth = false, redirectIfAuth = false }) {
    const { isLoading, isInitialized, isAuthenticated, redirectIfAuthenticated, requireAuth: authRequireAuth } = useAuth();
    const router = useRouter();

    // Handle redirects in useEffect to avoid render-time navigation
    useEffect(() => {
        if (!isInitialized || isLoading) return;

        if (requireAuth && !authRequireAuth()) {
            router.push('/login');
            return;
        }

        if (redirectIfAuth && redirectIfAuthenticated()) {
            router.push('/dashboard');
            return;
        }
    }, [isInitialized, isLoading, requireAuth, redirectIfAuth, authRequireAuth, redirectIfAuthenticated, router]);

    // Show loading while auth is being checked
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render content if redirect is needed
    if (requireAuth && !authRequireAuth()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white text-lg">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (redirectIfAuth && redirectIfAuthenticated()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white text-lg">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return children;
}
