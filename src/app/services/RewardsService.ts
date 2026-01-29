import { supabase, handleSupabaseError, callFunction, Reward, UserReward, PointsTransaction } from './SupabaseService';

export interface RedeemResult {
    redemption_id: string;
    reward_name: string;
    points_spent: number;
    new_balance: number;
}

export const rewardsService = {
    /**
     * Get all available rewards from catalog
     */
    async getRewardsCatalog(): Promise<Reward[]> {
        try {
            const { data, error } = await supabase
                .from('rewards_catalog')
                .select('*')
                .eq('enabled', true)
                .order('cost_points');

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getRewardsCatalog');
        }
    },

    /**
     * Get rewards by category
     */
    async getRewardsByCategory(category: 'in_app' | 'partner' | 'purpose'): Promise<Reward[]> {
        try {
            const { data, error } = await supabase
                .from('rewards_catalog')
                .select('*')
                .eq('category', category)
                .eq('enabled', true)
                .order('cost_points');

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getRewardsByCategory');
        }
    },

    /**
     * Get user's redeemed rewards
     */
    async getUserRewards(): Promise<UserReward[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_rewards')
                .select('*')
                .eq('user_id', user.id)
                .order('redeemed_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getUserRewards');
        }
    },

    /**
     * Redeem a reward
     */
    async redeemReward(rewardId: string): Promise<RedeemResult> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const result = await callFunction<RedeemResult>('redeem_reward', {
                user_uuid: user.id,
                reward_uuid: rewardId
            });

            return result;
        } catch (error) {
            throw handleSupabaseError(error, 'redeemReward');
        }
    },

    /**
     * Get current points balance
     */
    async getPointsBalance(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { data, error } = await supabase
                .from('profiles')
                .select('total_points')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return data?.total_points || 0;
        } catch (error) {
            throw handleSupabaseError(error, 'getPointsBalance');
        }
    },

    /**
     * Get points transaction history
     */
    async getPointsHistory(limit: number = 50, offset: number = 0): Promise<PointsTransaction[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('points_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getPointsHistory');
        }
    },

    /**
     * Get next milestone info
     */
    async getNextMilestone(): Promise<{
        milestone: number;
        pointsNeeded: number;
        label: string;
        icon: string;
    } | null> {
        try {
            const currentPoints = await this.getPointsBalance();

            const milestones = [
                { points: 500, label: 'Focus Beginner', icon: '🌱' },
                { points: 1000, label: 'Attention Master', icon: '⭐' },
                { points: 2500, label: 'Time Warrior', icon: '🏆' },
                { points: 5000, label: 'Productivity Legend', icon: '👑' }
            ];

            const next = milestones.find(m => m.points > currentPoints);

            if (!next) return null;

            return {
                milestone: next.points,
                pointsNeeded: next.points - currentPoints,
                label: next.label,
                icon: next.icon
            };
        } catch (error) {
            throw handleSupabaseError(error, 'getNextMilestone');
        }
    },

    /**
     * Check if user has unlocked a reward
     */
    async hasUnlockedReward(rewardId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await supabase
                .from('user_rewards')
                .select('id')
                .eq('user_id', user.id)
                .eq('reward_id', rewardId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return false;
                throw error;
            }

            return !!data;
        } catch (error) {
            throw handleSupabaseError(error, 'hasUnlockedReward');
        }
    }
};
