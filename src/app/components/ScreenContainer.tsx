import React from 'react';

interface ScreenContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
    showHeader?: boolean;
    className?: string;
    usePadding?: boolean;
    headerContent?: React.ReactNode;
}

/**
 * Standard container for all Reclaim screens.
 * Ensures consistent padding, safe areas, and hidden scrollbars.
 */
export function ScreenContainer({
    children,
    title,
    subtitle,
    headerAction,
    showHeader = true,
    className = '',
    usePadding = true,
    headerContent
}: ScreenContainerProps) {
    return (
        <div className={`h-full flex flex-col bg-slate-50 relative overflow-hidden ${className}`}>
            {/* Universal Header */}
            {showHeader && (
                <div className="px-6 pt-12 pb-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-b-[2.5rem] shadow-lg flex-shrink-0 z-10 transition-all duration-500">
                    {headerContent ? (
                        headerContent
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="animate-fade-in">
                                {subtitle && <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">{subtitle}</p>}
                                {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
                            </div>
                            {headerAction && (
                                <div className="flex gap-3">
                                    {headerAction}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto scroll-smooth ${usePadding ? 'px-6 py-6' : ''}`}>
                <div className="max-w-md mx-auto w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
