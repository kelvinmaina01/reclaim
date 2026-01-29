import { supabase, handleSupabaseError, callFunction, AIInsight } from './SupabaseService';

export const aiInsightsService = {
    /**
     * Get active (undismissed) insights
     */
    async getActiveInsights(): Promise<AIInsight[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('user_id', user.id)
                .is('dismissed_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getActiveInsights');
        }
    },

    /**
     * Generate new insights (triggers insight generation functions)
     */
    async generateInsights(): Promise<{ productivity?: string; risk?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const results: { productivity?: string; risk?: string } = {};

            // Generate productivity insight
            try {
                const productivityId = await callFunction<string>('generate_productivity_insight', {
                    user_uuid: user.id
                });
                if (productivityId) results.productivity = productivityId;
            } catch (err) {
                console.warn('Productivity insight generation failed:', err);
            }

            // Generate risk insight
            try {
                const riskId = await callFunction<string>('generate_risk_insight', {
                    user_uuid: user.id
                });
                if (riskId) results.risk = riskId;
            } catch (err) {
                console.warn('Risk insight generation failed:', err);
            }

            return results;
        } catch (error) {
            throw handleSupabaseError(error, 'generateInsights');
        }
    },

    /**
     * Dismiss an insight
     */
    async dismissInsight(insightId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('ai_insights')
                .update({ dismissed_at: new Date().toISOString() })
                .eq('id', insightId)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'dismissInsight');
        }
    },

    /**
     * Get all insights (including dismissed) with pagination
     */
    async getAllInsights(limit: number = 20, offset: number = 0): Promise<AIInsight[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getAllInsights');
        }
    },

    /**
     * Get weekly reflection (AI-generated summary)
     * Note: This would typically call a cloud function for more complex AI analysis
     */
    async getWeeklyReflection(): Promise<string> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return '';

            // For now, return a simple aggregation
            // In production, this would call a cloud function with AI
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_minutes, completed')
                .eq('user_id', user.id)
                .gte('created_at', weekAgo.toISOString());

            const { data: blocks } = await supabase
                .from('app_blocks')
                .select('minutes_reclaimed')
                .eq('user_id', user.id)
                .gte('blocked_at', weekAgo.toISOString());

            const totalFocusMinutes = (sessions || [])
                .filter(s => s.completed)
                .reduce((sum, s) => sum + s.duration_minutes, 0);

            const totalSavedMinutes = (blocks || [])
                .reduce((sum, b) => sum + b.minutes_reclaimed, 0);

            return `This week, you focused for ${totalFocusMinutes} minutes across ${sessions?.length || 0} sessions and reclaimed ${totalSavedMinutes} minutes by respecting your limits. ${totalFocusMinutes > 100 ? 'Excellent consistency!' : 'Keep building momentum!'}`;
        } catch (error) {
            throw handleSupabaseError(error, 'getWeeklyReflection');
        }
    }
};
