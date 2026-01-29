import { supabase, handleSupabaseError, callFunction, AppUsageStat } from './SupabaseService';

export interface UsageData {
    packageName: string;
    appName: string;
    foregroundTimeMs: number;
}

export const appUsageService = {
    /**
     * Sync usage stats from native layer (batch)
     */
    async syncUsageStats(usageData: UsageData[]): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Call update function for each app
            for (const usage of usageData) {
                await callFunction('update_app_usage', {
                    user_uuid: user.id,
                    package: usage.packageName,
                    app_name_text: usage.appName,
                    foreground_ms: usage.foregroundTimeMs
                });
            }
        } catch (error) {
            throw handleSupabaseError(error, 'syncUsageStats');
        }
    },

    /**
     * Get today's usage for a specific app
     */
    async getTodayUsage(packageName: string): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('app_usage_stats')
                .select('total_minutes_today')
                .eq('user_id', user.id)
                .eq('package_name', packageName)
                .eq('usage_date', today)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return 0; // No usage yet
                throw error;
            }

            return data?.total_minutes_today || 0;
        } catch (error) {
            throw handleSupabaseError(error, 'getTodayUsage');
        }
    },

    /**
     * Get 7-day usage history for an app
     */
    async getWeeklyUsage(packageName: string): Promise<AppUsageStat[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('app_usage_stats')
                .select('*')
                .eq('user_id', user.id)
                .eq('package_name', packageName)
                .gte('usage_date', weekAgoStr)
                .order('usage_date', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getWeeklyUsage');
        }
    },

    /**
     * Get most used apps today
     */
    async getMostUsedApps(limit: number = 10): Promise<AppUsageStat[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('app_usage_stats')
                .select('*')
                .eq('user_id', user.id)
                .eq('usage_date', today)
                .order('total_minutes_today', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getMostUsedApps');
        }
    },

    /**
     * Update real-time usage for an app (incremental)
     */
    async updateRealTimeUsage(packageName: string, appName: string, additionalMs: number): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await callFunction('update_app_usage', {
                user_uuid: user.id,
                package: packageName,
                app_name_text: appName,
                foreground_ms: additionalMs
            });
        } catch (error) {
            throw handleSupabaseError(error, 'updateRealTimeUsage');
        }
    },

    /**
     * Get total screen time today (all apps)
     */
    async getTotalScreenTimeToday(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('app_usage_stats')
                .select('total_minutes_today')
                .eq('user_id', user.id)
                .eq('usage_date', today);

            if (error) throw error;

            const total = (data || []).reduce((sum, stat) => sum + stat.total_minutes_today, 0);
            return total;
        } catch (error) {
            throw handleSupabaseError(error, 'getTotalScreenTimeToday');
        }
    }
};
