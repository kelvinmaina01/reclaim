import { supabase, handleSupabaseError, callFunction, DailyStat } from './SupabaseService';

export interface DashboardStats {
    daily_reclaimed_minutes: number;
    total_reclaimed_minutes: number;
    focus_streak: number;
    longest_streak: number;
    total_points: number;
    today_blocks: number;
    most_blocked_app?: {
        app_name: string;
        package_name: string;
        block_count: number;
        total_saved: number;
    };
}

export interface WeeklyStats {
    total_focus_minutes: number;
    sessions_completed: number;
    total_blocks: number;
    total_minutes_saved: number;
    points_earned: number;
}

export const statsService = {
    /**
     * Get optimized dashboard stats (uses database function)
     */
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return {
                    daily_reclaimed_minutes: 0,
                    total_reclaimed_minutes: 0,
                    focus_streak: 0,
                    longest_streak: 0,
                    total_points: 0,
                    today_blocks: 0
                };
            }

            const stats = await callFunction<DashboardStats>('get_dashboard_stats', {
                user_uuid: user.id
            });

            return stats;
        } catch (error) {
            throw handleSupabaseError(error, 'getDashboardStats');
        }
    },

    /**
     * Get 7-day stats (uses database function)
     */
    async getWeeklyStats(): Promise<WeeklyStats> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return {
                    total_focus_minutes: 0,
                    sessions_completed: 0,
                    total_blocks: 0,
                    total_minutes_saved: 0,
                    points_earned: 0
                };
            }

            const stats = await callFunction<WeeklyStats>('get_weekly_stats', {
                user_uuid: user.id
            });

            return stats;
        } catch (error) {
            throw handleSupabaseError(error, 'getWeeklyStats');
        }
    },

    /**
     * Get 30-day stats
     */
    async getMonthlyStats(): Promise<WeeklyStats> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return {
                    total_focus_minutes: 0,
                    sessions_completed: 0,
                    total_blocks: 0,
                    total_minutes_saved: 0,
                    points_earned: 0
                };
            }

            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const monthAgoStr = monthAgo.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id)
                .gte('stats_date', monthAgoStr);

            if (error) throw error;

            const stats = (data || []).reduce((acc, day) => {
                acc.total_focus_minutes += day.total_focus_minutes;
                acc.sessions_completed += day.focus_sessions_completed;
                acc.total_blocks += day.total_blocks;
                acc.total_minutes_saved += day.total_minutes_saved;
                acc.points_earned += day.points_earned;
                return acc;
            }, {
                total_focus_minutes: 0,
                sessions_completed: 0,
                total_blocks: 0,
                total_minutes_saved: 0,
                points_earned: 0
            });

            return stats;
        } catch (error) {
            throw handleSupabaseError(error, 'getMonthlyStats');
        }
    },

    /**
     * Get today's stats (real-time)
     */
    async getTodayStats(): Promise<DailyStat | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const today = new Date().toISOString().split('T')[0];

            // Refresh today's stats first
            await callFunction('refresh_daily_stats', {
                user_uuid: user.id,
                target_date: today
            });

            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id)
                .eq('stats_date', today)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data;
        } catch (error) {
            throw handleSupabaseError(error, 'getTodayStats');
        }
    },

    /**
     * Get streak information
     */
    async getStreakInfo(): Promise<{
        currentStreak: number;
        longestStreak: number;
        streakHistory: Array<{ date: string; hadSession: boolean }>;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { currentStreak: 0, longestStreak: 0, streakHistory: [] };
            }

            // Get profile streak data
            const { data: profile } = await supabase
                .from('profiles')
                .select('focus_streak, longest_streak')
                .eq('id', user.id)
                .single();

            // Get last 30 days history
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            const monthAgoStr = monthAgo.toISOString().split('T')[0];

            const { data: stats } = await supabase
                .from('daily_stats')
                .select('stats_date, had_focus_session')
                .eq('user_id', user.id)
                .gte('stats_date', monthAgoStr)
                .order('stats_date', { ascending: false });

            const streakHistory = (stats || []).map(s => ({
                date: s.stats_date,
                hadSession: s.had_focus_session
            }));

            return {
                currentStreak: profile?.focus_streak || 0,
                longestStreak: profile?.longest_streak || 0,
                streakHistory
            };
        } catch (error) {
            throw handleSupabaseError(error, 'getStreakInfo');
        }
    },

    /**
     * Get daily stats for a date range (for charts)
     */
    async getDailyStatsRange(startDate: string, endDate: string): Promise<DailyStat[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id)
                .gte('stats_date', startDate)
                .lte('stats_date', endDate)
                .order('stats_date');

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getDailyStatsRange');
        }
    }
};
