"use client";

import { useNavigation } from '../store/navigationContext';

export default function NavigationWarningModal() {
    const { 
        showNavigationWarning, 
        confirmNavigation, 
        saveAndNavigate, 
        cancelNavigation,
        navigationConfig = {} // Add default empty object
    } = useNavigation();

    if (!showNavigationWarning) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] transform transition-all">
                <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Unsaved Changes</h2>
                </div>
                <p className="text-gray-600 mb-6">
                    You have unsaved changes that will be lost if you leave this page. What would you like to do?
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={cancelNavigation}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Stay on Page
                    </button>
                    
                    {navigationConfig?.onSave && (
                        <button
                            onClick={saveAndNavigate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Save & Continue
                        </button>
                    )}
                    
                    <button
                        onClick={confirmNavigation}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Leave Without Saving
                    </button>
                </div>
            </div>
        </div>
    );
}
