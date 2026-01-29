import { supabase, handleSupabaseError, callFunction, AppBlock } from './SupabaseService';

export const blockService = {
    /**
     * Log a block event
     */
    async logBlockEvent(
        packageName: string,
        appName: string,
        minutesReclaimed: number,
        redirectChoice?: string,
        emergencyUnlocked: boolean = false
    ): Promise<string> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const blockId = await callFunction<string>('log_app_block', {
                user_uuid: user.id,
                package: packageName,
                app_name_text: appName,
                minutes_saved: minutesReclaimed,
                redirect: redirectChoice,
                emergency_unlock: emergencyUnlocked
            });

            return blockId;
        } catch (error) {
            throw handleSupabaseError(error, 'logBlockEvent');
        }
    },

    /**
     * Get most blocked app today
     */
    async getMostBlockedApp(): Promise<{
        appName: string;
        packageName: string;
        blockCount: number;
        totalSaved: number;
    } | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('app_blocks')
                .select('app_name, package_name, minutes_reclaimed')
                .eq('user_id', user.id)
                .gte('blocked_at', today)
                .lt('blocked_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);

            if (error) throw error;

            if (!data || data.length === 0) return null;

            // Aggregate by app
            const appStats = data.reduce((acc, block) => {
                const key = block.package_name;
                if (!acc[key]) {
                    acc[key] = {
                        appName: block.app_name,
                        packageName: block.package_name,
                        blockCount: 0,
                        totalSaved: 0
                    };
                }
                acc[key].blockCount++;
                acc[key].totalSaved += block.minutes_reclaimed;
                return acc;
            }, {} as Record<string, any>);

            // Find most blocked
            const mostBlocked = Object.values(appStats).sort((a: any, b: any) => b.blockCount - a.blockCount)[0];

            return mostBlocked || null;
        } catch (error) {
            throw handleSupabaseError(error, 'getMostBlockedApp');
        }
    },

    /**
     * Get block history with pagination
     */
    async getBlockHistory(limit: number = 20, offset: number = 0): Promise<AppBlock[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('app_blocks')
                .select('*')
                .eq('user_id', user.id)
                .order('blocked_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getBlockHistory');
        }
    },

    /**
     * Get block statistics for a period
     */
    async getBlockStats(period: 'day' | 'week' | 'month' = 'day'): Promise<{
        totalBlocks: number;
        totalMinutesSaved: number;
        emergencyUnlocks: number;
        topApps: Array<{ appName: string; blockCount: number }>;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { totalBlocks: 0, totalMinutesSaved: 0, emergencyUnlocks: 0, topApps: [] };
            }

            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                default:
                    startDate = new Date(now.setHours(0, 0, 0, 0));
            }

            const { data, error } = await supabase
                .from('app_blocks')
                .select('*')
                .eq('user_id', user.id)
                .gte('blocked_at', startDate.toISOString());

            if (error) throw error;

            const stats = (data || []).reduce((acc, block) => {
                acc.totalBlocks++;
                acc.totalMinutesSaved += block.minutes_reclaimed;
                if (block.emergency_unlocked) {
                    acc.emergencyUnlocks++;
                }

                // Count app frequency
                const existing = acc.appCounts.find((a: any) => a.appName === block.app_name);
                if (existing) {
                    existing.blockCount++;
                } else {
                    acc.appCounts.push({ appName: block.app_name, blockCount: 1 });
                }

                return acc;
            }, {
                totalBlocks: 0,
                totalMinutesSaved: 0,
                emergencyUnlocks: 0,
                appCounts: [] as Array<{ appName: string; blockCount: number }>
            });

            // Sort and limit top apps
            const topApps = stats.appCounts.sort((a: { appName: string; blockCount: number }, b: { appName: string; blockCount: number }) => b.blockCount - a.blockCount).slice(0, 5);

            return {
                totalBlocks: stats.totalBlocks,
                totalMinutesSaved: stats.totalMinutesSaved,
                emergencyUnlocks: stats.emergencyUnlocks,
                topApps
            };
        } catch (error) {
            throw handleSupabaseError(error, 'getBlockStats');
        }
    },

    /**
     * Get today's block count
     */
    async getTodayBlockCount(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const today = new Date().toISOString().split('T')[0];

            const { count, error } = await supabase
                .from('app_blocks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('blocked_at', today)
                .lt('blocked_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            throw handleSupabaseError(error, 'getTodayBlockCount');
        }
    }
};
