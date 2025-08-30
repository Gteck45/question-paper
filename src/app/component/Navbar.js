"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../store/authContext';
import { useNavigation } from '../store/navigationContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, isLoggedIn, logout: authLogout } = useAuth();
    const { goToDashboard, goToHome, goToLogin, goToSignup, markAsSaved } = useNavigation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        // Mark as saved to avoid warning during logout
        markAsSaved();
        
        // Use auth context logout
        await authLogout();
        
        // Redirect to home
        goToHome({ force: true, showToast: false });
    };

    const handleNavigation = (navigationFunc) => {
        navigationFunc();
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => handleNavigation(goToDashboard)}
                            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all duration-200"
                        >
                            Oblivor Exams
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {isLoggedIn ? (
                                <>
                                    <button
                                        onClick={() => handleNavigation(goToDashboard)}
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700/50 transition-all duration-200"
                                    >
                                        Dashboard
                                    </button>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-300 text-sm">
                                            Welcome, {user?.name || user?.email}
                                        </span>
                                        <button
                                            onClick={handleLogout}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleNavigation(goToLogin)}
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700/50 transition-all duration-200"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => handleNavigation(goToSignup)}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-300 hover:text-white p-2 rounded-md transition-all duration-200"
                        >
                            <svg
                                className="h-6 w-6"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => handleNavigation(goToDashboard)}
                                    className="text-gray-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700/50 transition-all duration-200"
                                >
                                    Dashboard
                                </button>
                                <div className="px-3 py-2">
                                    <span className="text-gray-300 text-sm block mb-2">
                                        Welcome, {user?.name || user?.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 w-full"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleNavigation(goToLogin)}
                                    className="text-gray-300 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700/50 transition-all duration-200"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => handleNavigation(goToSignup)}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all duration-200 mt-2"
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
