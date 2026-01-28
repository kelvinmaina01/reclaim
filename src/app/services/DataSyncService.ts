import { supabase } from './SupabaseService';
import type { AppData } from '../App';

export const dataSyncService = {
    async fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    async updateProfile(userId: string, updates: Partial<AppData>) {
        const { error } = await supabase
            .from('profiles')
            .update({
                daily_reclaimed_minutes: updates.dailyReclaimedMinutes,
                focus_streak: updates.focusStreak,
                total_points: updates.totalPoints,
                ai_enabled: updates.aiEnabled,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) console.error('Error updating profile:', error);
    },

    async syncAppLimits(userId: string, limits: string[]) {
        // Basic sync for simple raw version
        const { error } = await supabase
            .from('profiles')
            .update({ blocked_apps: limits })
            .eq('id', userId);

        if (error) console.error('Error syncing app limits:', error);
    },

    async fetchInsights(userId: string) {
        const { data, error } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching insights:', error);
            return [];
        }
        return data;
    },

    async dismissInsight(insightId: string) {
        const { error } = await supabase
            .from('ai_insights')
            .delete()
            .eq('id', insightId);

        if (error) console.error('Error dismissing insight:', error);
    }
};
