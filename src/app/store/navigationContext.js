"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const NavigationContext = createContext();

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

export const NavigationProvider = ({ children }) => {
    const router = useRouter();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showNavigationWarning, setShowNavigationWarning] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [navigationConfig, setNavigationConfig] = useState({
        enableWarnings: false,
        onSave: null
    });

    // Configure navigation behavior for specific pages
    const configureNavigation = useCallback((config) => {
        setNavigationConfig(prev => ({ ...prev, ...config }));
    }, []);

    // Safe navigation that checks for unsaved changes
    const navigateTo = useCallback((path, options = {}) => {
        const { force = false, showToast = true } = options;

        if (!force && hasUnsavedChanges && navigationConfig.enableWarnings) {
            setPendingNavigation({ path, options });
            setShowNavigationWarning(true);
            return;
        }

        // Perform navigation
        router.push(path);
        
        if (showToast) {
            const pathNames = {
                '/': 'Home',
                '/dashboard': 'Dashboard',
                '/login': 'Login',
                '/signup': 'Sign Up'
            };
            const destinationName = pathNames[path] || 'Page';
            toast.success(`Navigating to ${destinationName}`);
        }
    }, [router, hasUnsavedChanges, navigationConfig]);

    // Quick navigation functions
    const goToDashboard = useCallback((options) => {
        navigateTo('/dashboard', options);
    }, [navigateTo]);

    const goToHome = useCallback((options) => {
        navigateTo('/', options);
    }, [navigateTo]);

    const goToLogin = useCallback((options) => {
        navigateTo('/login', options);
    }, [navigateTo]);

    const goToSignup = useCallback((options) => {
        navigateTo('/signup', options);
    }, [navigateTo]);

    const goToProject = useCallback((projectId, options) => {
        navigateTo(`/question-paper/edit/${projectId}`, options);
    }, [navigateTo]);

    // Handle navigation confirmation
    const confirmNavigation = useCallback(async () => {
        if (pendingNavigation) {
            setHasUnsavedChanges(false);
            setShowNavigationWarning(false);
            router.push(pendingNavigation.path);
            
            const pathNames = {
                '/': 'Home',
                '/dashboard': 'Dashboard',
                '/login': 'Login',
                '/signup': 'Sign Up'
            };
            const destinationName = pathNames[pendingNavigation.path] || 'Page';
            toast.success(`Navigated to ${destinationName}`);
        }
        setPendingNavigation(null);
    }, [router, pendingNavigation]);

    // Handle save and navigate
    const saveAndNavigate = useCallback(async () => {
        if (navigationConfig?.onSave && pendingNavigation) {
            try {
                await navigationConfig.onSave();
                confirmNavigation();
            } catch (error) {
                toast.error('Failed to save. Please try again.');
                console.error('Save error:', error);
            }
        } else {
            // If no save function is available, just navigate
            confirmNavigation();
        }
    }, [navigationConfig, pendingNavigation, confirmNavigation]);

    // Cancel navigation
    const cancelNavigation = useCallback(() => {
        setShowNavigationWarning(false);
        setPendingNavigation(null);
    }, []);

    // Reset unsaved changes
    const markAsSaved = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    // Mark as having unsaved changes
    const markAsUnsaved = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    // Get current navigation state
    const getNavigationState = useCallback(() => ({
        hasUnsavedChanges,
        showNavigationWarning,
        pendingNavigation,
        navigationConfig
    }), [hasUnsavedChanges, showNavigationWarning, pendingNavigation, navigationConfig]);

    const value = {
        // Navigation functions
        navigateTo,
        goToDashboard,
        goToHome,
        goToLogin,
        goToSignup,
        goToProject,
        
        // State management
        hasUnsavedChanges,
        setHasUnsavedChanges,
        markAsSaved,
        markAsUnsaved,
        
        // Configuration
        configureNavigation,
        navigationConfig: navigationConfig || { enableWarnings: false, onSave: null },
        
        // Warning dialog
        showNavigationWarning,
        confirmNavigation,
        saveAndNavigate,
        cancelNavigation,
        
        // State getters
        getNavigationState
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};
