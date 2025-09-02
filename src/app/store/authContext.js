"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authFetch } from '../../../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize authentication state from localStorage and validate with server
    const initializeAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Check localStorage first for immediate state
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setIsLoggedIn(true);
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }

            // Validate with server
            try {
                const response = await authFetch('/api/checkloginvalidation');

                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        // Server confirms user is valid
                        setUser(data.user);
                        setIsLoggedIn(true);
                        
                        // Update localStorage with latest user data
                        localStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                        // Server says user is not valid
                        clearAuthState();
                    }
                } else {
                    // Server request failed, clear auth state
                    clearAuthState();
                }
            } catch (error) {
                console.error('Auth validation error:', error);
                // On network error, keep localStorage state but set a flag
                if (!storedToken) {
                    clearAuthState();
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            clearAuthState();
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
        }
    }, []);

    // Clear all authentication state
    const clearAuthState = useCallback(() => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    // Login function
    const login = useCallback(async (credentials) => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok && data.token && data.user) {
                // Store in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update state
                setUser(data.user);
                setIsLoggedIn(true);
                
                toast.success('Login successful!');
                return { success: true, user: data.user };
            } else {
                toast.error(data.message || 'Login failed');
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again.');
            return { success: false, message: 'Network error' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        try {
            // Call logout API to invalidate server session
            await authFetch('/api/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear state regardless of API response
            clearAuthState();
            toast.success('Logged out successfully');
        }
    }, [clearAuthState]);

    // Signup function
    const signup = useCallback(async (userData) => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok && data.token && data.user) {
                // Store in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update state
                setUser(data.user);
                setIsLoggedIn(true);
                
                toast.success('Account created successfully!');
                return { success: true, user: data.user };
            } else {
                toast.error(data.message || 'Signup failed');
                return { success: false, message: data.message || 'Signup failed' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Signup failed. Please try again.');
            return { success: false, message: 'Network error' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if user is authenticated (for route protection)
    const isAuthenticated = useCallback(() => {
        return isLoggedIn && user && !isLoading;
    }, [isLoggedIn, user, isLoading]);

    // Require authentication (check if user needs to be redirected)
    const requireAuth = useCallback(() => {
        if (isInitialized && !isLoading && !isAuthenticated()) {
            return false; // Return false to indicate auth is required
        }
        return true;
    }, [isInitialized, isLoading, isAuthenticated]);

    // Check if already authenticated (for login/signup pages)
    const redirectIfAuthenticated = useCallback(() => {
        if (isInitialized && !isLoading && isAuthenticated()) {
            return true; // Return true to indicate redirect needed
        }
        return false;
    }, [isInitialized, isLoading, isAuthenticated]);

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Listen for storage changes (for multi-tab support)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' || e.key === 'user') {
                // Re-initialize auth when storage changes
                initializeAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [initializeAuth]);

    const value = {
        // State
        user,
        isLoggedIn,
        isLoading,
        isInitialized,
        
        // Actions
        login,
        logout,
        signup,
        
        // Utilities
        isAuthenticated,
        requireAuth,
        redirectIfAuthenticated,
        initializeAuth,
        clearAuthState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
