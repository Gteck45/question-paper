"use client";

import React, { createContext, useContext, useState } from 'react';

const NavigationWarningContext = createContext();

export const useNavigationWarning = () => {
    const context = useContext(NavigationWarningContext);
    if (!context) {
        return {
            hasUnsavedChanges: false,
            setHasUnsavedChanges: () => {},
            checkNavigationWarning: () => false,
            safeNavigate: (router, path) => router.push(path)
        };
    }
    return context;
};

export const NavigationWarningProvider = ({ children }) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [navigationHandler, setNavigationHandler] = useState(null);

    const checkNavigationWarning = () => hasUnsavedChanges;

    const safeNavigate = (router, path) => {
        if (hasUnsavedChanges && navigationHandler) {
            navigationHandler(path);
        } else {
            router.push(path);
        }
    };

    const value = {
        hasUnsavedChanges,
        setHasUnsavedChanges,
        checkNavigationWarning,
        safeNavigate,
        setNavigationHandler
    };

    return (
        <NavigationWarningContext.Provider value={value}>
            {children}
        </NavigationWarningContext.Provider>
    );
};
