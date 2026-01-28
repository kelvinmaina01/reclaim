import { Capacitor, registerPlugin } from '@capacitor/core';

export interface InstalledApp {
    packageName: string;
    appName: string;
    icon?: string;  // Base64 encoded
    category?: string;
}

export interface AppUsageStats {
    packageName: string;
    appName: string;
    totalTimeInForeground: number;  // milliseconds
    lastTimeUsed: number;  // timestamp
}

export interface AppUsagePluginInterface {
    hasPermission(): Promise<{ granted: boolean }>;
    requestPermission(): Promise<{ granted: boolean }>;
    getInstalledApps(): Promise<{ apps: InstalledApp[] }>;
    getUsageStats(options: {
        startTime: number;
        endTime: number
    }): Promise<{ stats: AppUsageStats[] }>;
    getSocialMediaApps(): Promise<{ apps: InstalledApp[] }>;
}

// Default web implementation (for development/testing)
class AppUsagePluginWeb implements AppUsagePluginInterface {
    async hasPermission(): Promise<{ granted: boolean }> {
        // Web always returns true for development
        return { granted: true };
    }

    async requestPermission(): Promise<{ granted: boolean }> {
        console.warn('AppUsagePlugin: requestPermission is not available on web');
        return { granted: true };
    }

    async getInstalledApps(): Promise<{ apps: InstalledApp[] }> {
        // Return mock social media apps for web testing
        return {
            apps: [
                { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social' },
                { packageName: 'com.instagram.barcelona', appName: 'Threads', category: 'Social' },
                { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'Entertainment' },
                { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Entertainment' },
                { packageName: 'com.snapchat.android', appName: 'Snapchat', category: 'Social' },
                { packageName: 'com.twitter.android', appName: 'X (Twitter)', category: 'Social' },
                { packageName: 'com.facebook.katana', appName: 'Facebook', category: 'Social' },
                { packageName: 'com.facebook.orca', appName: 'Messenger', category: 'Communication' },
                { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication' },
                { packageName: 'org.telegram.messenger', appName: 'Telegram', category: 'Communication' },
                { packageName: 'com.discord', appName: 'Discord', category: 'Social' },
                { packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'Social' },
                { packageName: 'com.linkedin.android', appName: 'LinkedIn', category: 'Social' },
                { packageName: 'com.pinterest', appName: 'Pinterest', category: 'Social' },
                { packageName: 'com.bereal.ft', appName: 'BeReal', category: 'Social' },
                { packageName: 'com.tumblr', appName: 'Tumblr', category: 'Social' },
            ]
        };
    }

    async getUsageStats(options: { startTime: number; endTime: number }): Promise<{ stats: AppUsageStats[] }> {
        // Return mock usage stats for web testing
        const now = Date.now();
        return {
            stats: [
                { packageName: 'com.instagram.android', appName: 'Instagram', totalTimeInForeground: 1440000, lastTimeUsed: now - 300000 },
                { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', totalTimeInForeground: 480000, lastTimeUsed: now - 600000 },
                { packageName: 'com.google.android.youtube', appName: 'YouTube', totalTimeInForeground: 720000, lastTimeUsed: now - 1800000 },
                { packageName: 'com.snapchat.android', appName: 'Snapchat', totalTimeInForeground: 1080000, lastTimeUsed: now - 3600000 },
            ]
        };
    }

    async getSocialMediaApps(): Promise<{ apps: InstalledApp[] }> {
        const allApps = await this.getInstalledApps();
        return {
            apps: allApps.apps.filter(app =>
                app.category === 'Social' || app.category === 'Entertainment'
            )
        };
    }
}

// Register the plugin
const AppUsagePlugin = Capacitor.isNativePlatform()
    ? registerPlugin<AppUsagePluginInterface>('AppUsagePlugin')
    : new AppUsagePluginWeb();

export { AppUsagePlugin };
