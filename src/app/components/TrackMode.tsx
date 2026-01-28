import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { AppUsagePlugin, InstalledApp, AppUsageStats } from '../plugins/AppUsagePlugin';

interface TrackModeProps {
    onBack: () => void;
    onSaveSettings: (settings: AppTrackingSettings) => void;
    initialSettings?: AppTrackingSettings;
}

export interface AppTrackingSettings {
    apps: TrackedApp[];
}

export interface TrackedApp {
    packageName: string;
    appName: string;
    icon: string;
    dailyLimitMinutes: number;
    enabled: boolean;
    todayUsageMinutes: number;
}

const DEFAULT_LIMIT = 30; // 30 minutes default

export function TrackMode({ onBack, onSaveSettings, initialSettings }: TrackModeProps) {
    const [hasPermission, setHasPermission] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [socialApps, setSocialApps] = useState<InstalledApp[]>([]);
    const [trackedApps, setTrackedApps] = useState<TrackedApp[]>(initialSettings?.apps || []);
    const [usageStats, setUsageStats] = useState<AppUsageStats[]>([]);
    const [loading, setLoading] = useState(true);

    // Check permission on mount
    useEffect(() => {
        checkPermission();
    }, []);

    // Load apps when permission granted
    useEffect(() => {
        if (hasPermission) {
            loadAppsAndUsage();
        }
    }, [hasPermission]);

    const checkPermission = async () => {
        setCheckingPermission(true);
        try {
            const { granted } = await AppUsagePlugin.hasPermission();
            setHasPermission(granted);
        } catch (e) {
            console.error('Error checking permission:', e);
            // For web, assume granted
            setHasPermission(true);
        }
        setCheckingPermission(false);
    };

    const requestPermission = async () => {
        try {
            const { granted } = await AppUsagePlugin.requestPermission();
            setHasPermission(granted);
        } catch (e) {
            console.error('Error requesting permission:', e);
        }
    };

    const loadAppsAndUsage = async () => {
        setLoading(true);
        try {
            // Get social media apps
            const { apps } = await AppUsagePlugin.getSocialMediaApps();
            setSocialApps(apps);

            // Get today's usage stats
            const now = Date.now();
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { stats } = await AppUsagePlugin.getUsageStats({
                startTime: startOfDay.getTime(),
                endTime: now
            });
            setUsageStats(stats);

            // Merge with existing tracked apps or create new
            if (trackedApps.length === 0) {
                const initialTracked: TrackedApp[] = apps.map(app => {
                    const usage = stats.find(s => s.packageName === app.packageName);
                    return {
                        packageName: app.packageName,
                        appName: app.appName,
                        icon: getAppLogo(app.appName),
                        dailyLimitMinutes: DEFAULT_LIMIT,
                        enabled: false,
                        todayUsageMinutes: usage ? Math.round(usage.totalTimeInForeground / 60000) : 0
                    };
                });
                setTrackedApps(initialTracked);
            } else {
                // Update usage for existing tracked apps
                setTrackedApps(prev => prev.map(app => {
                    const usage = stats.find(s => s.packageName === app.packageName);
                    return {
                        ...app,
                        todayUsageMinutes: usage ? Math.round(usage.totalTimeInForeground / 60000) : 0
                    };
                }));
            }
        } catch (e) {
            console.error('Error loading apps:', e);
        }
        setLoading(false);
    };

    const getAppLogo = (appName: string): string => {
        const logoMap: Record<string, string> = {
            'Instagram': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
            'Threads': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Threads_%28app%29_logo.svg',
            'TikTok': 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
            'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
            'Snapchat': 'https://upload.wikimedia.org/wikipedia/en/c/c4/Snapchat_logo.svg',
            'X (Twitter)': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
            'Twitter': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
            'Facebook': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
            'WhatsApp': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
            'Reddit': 'https://upload.wikimedia.org/wikipedia/en/b/bd/Reddit_Logo_Icon.svg',
            'LinkedIn': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
            'Pinterest': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png',
            'Discord': 'https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg',
            'Telegram': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
            'Slack': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
            'Messenger': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg',
            'BeReal': 'https://upload.wikimedia.org/wikipedia/en/4/40/BeReal_logo.png',
            'Tumblr': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Tumblr_logotype_2018.svg'
        };
        return logoMap[appName] || '📱';
    };

    const toggleApp = (packageName: string) => {
        setTrackedApps(prev => prev.map(app =>
            app.packageName === packageName
                ? { ...app, enabled: !app.enabled }
                : app
        ));
    };

    const adjustLimit = (packageName: string, delta: number) => {
        setTrackedApps(prev => prev.map(app => {
            if (app.packageName === packageName) {
                const newLimit = Math.max(5, Math.min(240, app.dailyLimitMinutes + delta));
                return { ...app, dailyLimitMinutes: newLimit };
            }
            return app;
        }));
    };

    const handleSave = () => {
        onSaveSettings({ apps: trackedApps });
        onBack();
    };

    const enabledCount = trackedApps.filter(a => a.enabled).length;

    // Permission request screen
    if (!hasPermission && !checkingPermission) {
        return (
            <div className="h-full flex flex-col bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <div className="px-6 pt-8 pb-6 flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Track Mode</h1>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
                        <AlertTriangle className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Permission Required</h2>
                    <p className="text-lg text-amber-100 mb-8">
                        To track your app usage and help you stay focused, Reclaim needs access to your usage statistics.
                    </p>
                    <button
                        onClick={requestPermission}
                        className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all"
                    >
                        Grant Permission
                    </button>
                    <p className="text-sm text-amber-100/70 mt-4">
                        This opens your device settings
                    </p>
                </div>
            </div>
        );
    }

    // Loading screen
    if (loading || checkingPermission) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6" />
                <p className="text-lg">Loading your apps...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-xl font-semibold"
                    >
                        <Check className="w-4 h-4" />
                        Save
                    </button>
                </div>
                <h1 className="text-2xl font-bold mb-1">Track Mode</h1>
                <p className="text-purple-100">Select apps to monitor and set time limits</p>

                {enabledCount > 0 && (
                    <div className="mt-4 bg-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                        <Clock className="w-5 h-5" />
                        <span>{enabledCount} app{enabledCount !== 1 ? 's' : ''} being tracked</span>
                    </div>
                )}
            </div>

            {/* Apps List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
                <div className="space-y-3">
                    {trackedApps.map(app => {
                        const isOverLimit = app.todayUsageMinutes > app.dailyLimitMinutes;
                        const usagePercent = Math.min(100, (app.todayUsageMinutes / app.dailyLimitMinutes) * 100);

                        return (
                            <div
                                key={app.packageName}
                                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${app.enabled ? 'border-purple-200' : 'border-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 p-2 overflow-hidden">
                                        {app.icon.startsWith('http') ? (
                                            <img src={app.icon} alt={app.appName} className="w-full h-full object-contain" />
                                        ) : (
                                            <span>{app.icon}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-800">{app.appName}</div>
                                        <div className="text-sm text-gray-500">
                                            {app.todayUsageMinutes} min today
                                            {isOverLimit && app.enabled && (
                                                <span className="text-red-500 ml-2">• Over limit!</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleApp(app.packageName)}
                                        className={`w-12 h-7 rounded-full transition-all relative ${app.enabled ? 'bg-purple-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${app.enabled ? 'right-1' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {app.enabled && (
                                    <>
                                        {/* Usage bar */}
                                        <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${isOverLimit
                                                    ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                                    }`}
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>

                                        {/* Limit controls */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                            <span className="text-sm text-gray-600">Daily limit</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => adjustLimit(app.packageName, -5)}
                                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200"
                                                >
                                                    <Minus className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <span className="text-lg font-bold text-gray-800 min-w-[60px] text-center">
                                                    {app.dailyLimitMinutes >= 60
                                                        ? `${Math.floor(app.dailyLimitMinutes / 60)}h ${app.dailyLimitMinutes % 60}m`
                                                        : `${app.dailyLimitMinutes}m`
                                                    }
                                                </span>
                                                <button
                                                    onClick={() => adjustLimit(app.packageName, 5)}
                                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200"
                                                >
                                                    <Plus className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {trackedApps.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📱</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No apps found</h3>
                        <p className="text-gray-500">Social media apps will appear here once detected</p>
                    </div>
                )}
            </div>
        </div>
    );
}
