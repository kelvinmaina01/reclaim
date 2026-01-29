import { supabase, handleSupabaseError, callFunction, AppLimit } from './SupabaseService';

export const appLimitsService = {
    /**
     * Get all app limits for current user
     */
    async getUserLimits(): Promise<AppLimit[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('app_limits')
                .select('*')
                .eq('user_id', user.id)
                .order('app_name');

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getUserLimits');
        }
    },

    /**
     * Set or update an app limit
     */
    async setAppLimit(
        packageName: string,
        appName: string,
        limitMinutes: number,
        appIcon?: string,
        category?: string
    ): Promise<AppLimit> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('app_limits')
                .upsert({
                    user_id: user.id,
                    package_name: packageName,
                    app_name: appName,
                    daily_limit_minutes: limitMinutes,
                    app_icon: appIcon,
                    category: category,
                    enabled: true,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,package_name'
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            throw handleSupabaseError(error, 'setAppLimit');
        }
    },

    /**
     * Toggle an app limit on/off
     */
    async toggleApp(packageName: string, enabled: boolean): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('app_limits')
                .update({ enabled, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('package_name', packageName);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'toggleApp');
        }
    },

    /**
     * Check if a specific app's limit is exceeded
     */
    async checkLimitExceeded(packageName: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const exceeded = await callFunction<boolean>('check_app_limit_exceeded', {
                user_uuid: user.id,
                package: packageName
            });

            return exceeded;
        } catch (error) {
            throw handleSupabaseError(error, 'checkLimitExceeded');
        }
    },

    /**
     * Apply an AI-suggested limit
     */
    async applyAISuggestion(packageName: string, suggestedLimit: number): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('app_limits')
                .update({
                    daily_limit_minutes: suggestedLimit,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('package_name', packageName);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'applyAISuggestion');
        }
    },

    /**
     * Get limit status for a specific app (usage vs limit)
     */
    async getLimitStatus(packageName: string): Promise<{
        limitMinutes: number;
        usageMinutes: number;
        exceeded: boolean;
        enabled: boolean;
    }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { limitMinutes: 0, usageMinutes: 0, exceeded: false, enabled: false };
            }

            // Get limit
            const { data: limitData } = await supabase
                .from('app_limits')
                .select('daily_limit_minutes, enabled')
                .eq('user_id', user.id)
                .eq('package_name', packageName)
                .single();

            if (!limitData || !limitData.enabled) {
                return { limitMinutes: 0, usageMinutes: 0, exceeded: false, enabled: false };
            }

            // Get today's usage
            const today = new Date().toISOString().split('T')[0];
            const { data: usageData } = await supabase
                .from('app_usage_stats')
                .select('total_minutes_today')
                .eq('user_id', user.id)
                .eq('package_name', packageName)
                .eq('usage_date', today)
                .single();

            const usageMinutes = usageData?.total_minutes_today || 0;

            return {
                limitMinutes: limitData.daily_limit_minutes,
                usageMinutes,
                exceeded: usageMinutes >= limitData.daily_limit_minutes,
                enabled: true
            };
        } catch (error) {
            throw handleSupabaseError(error, 'getLimitStatus');
        }
    },

    /**
     * Delete an app limit
     */
    async deleteLimit(packageName: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('app_limits')
                .delete()
                .eq('user_id', user.id)
                .eq('package_name', packageName);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'deleteLimit');
        }
    }
};
