// components/OptimizedContainer.js
import React, { memo } from 'react';

// Optimized container with performance enhancements
const OptimizedContainer = memo(({ 
    children, 
    className = "", 
    enableScrollOptimization = true,
    ...props 
}) => {
    const baseClasses = enableScrollOptimization 
        ? "will-change-scroll contain-layout contain-style" 
        : "";

    return (
        <div 
            className={`${baseClasses} ${className}`}
            style={{
                // Hardware acceleration for smooth scrolling
                transform: 'translateZ(0)',
                // Improve scrolling performance
                WebkitOverflowScrolling: 'touch',
                // Optimize rendering
                backfaceVisibility: 'hidden',
                // Contain layout changes
                contain: 'layout style paint',
                ...props.style
            }}
            {...props}
        >
            {children}
        </div>
    );
});

OptimizedContainer.displayName = 'OptimizedContainer';

export default OptimizedContainer;
