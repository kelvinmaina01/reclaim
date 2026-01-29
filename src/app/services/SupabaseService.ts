import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Cloud features will be disabled.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Profile {
    id: string;
    email: string;
    display_name?: string;
    avatar_type?: string;
    avatar_value?: string;
    onboarded_at?: string;
    selected_goals?: string[];
    problem_apps?: string[];
    daily_reclaimed_minutes: number;
    total_reclaimed_minutes: number;
    focus_streak: number;
    longest_streak: number;
    total_points: number;
    ai_enabled: boolean;
    theme?: string;
    notifications_enabled: boolean;
    daily_goal_minutes: number;
    last_active_at?: string;
    timezone?: string;
    created_at: string;
    updated_at: string;
}

export interface AppLimit {
    id: string;
    user_id: string;
    package_name: string;
    app_name: string;
    app_icon?: string;
    category?: string;
    daily_limit_minutes: number;
    enabled: boolean;
    ai_suggested_limit?: number;
    ai_explanation?: string;
    risk_level?: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
}

export interface AppUsageStat {
    id: string;
    user_id: string;
    package_name: string;
    app_name: string;
    usage_date: string;
    total_minutes_today: number;
    total_foreground_time_ms: number;
    last_used_at?: string;
    session_count: number;
    created_at: string;
    updated_at: string;
}

export interface FocusSession {
    id: string;
    user_id: string;
    duration_minutes: number;
    completed: boolean;
    points_earned: number;
    blocked_apps?: string[];
    started_at: string;
    completed_at?: string;
    canceled_at?: string;
    created_at: string;
}

export interface AppBlock {
    id: string;
    user_id: string;
    package_name: string;
    app_name: string;
    minutes_reclaimed: number;
    redirect_choice?: string;
    emergency_unlocked: boolean;
    blocked_at: string;
}

export interface AIInsight {
    id: string;
    user_id: string;
    title: string;
    description: string;
    explanation?: string;
    data_used?: string;
    type: string;
    color_hint?: string;
    created_at: string;
    dismissed_at?: string;
}

export interface Reward {
    id: string;
    name: string;
    description?: string;
    category: 'in_app' | 'partner' | 'purpose';
    cost_points: number;
    icon?: string;
    partner_name?: string;
    cause_name?: string;
    enabled: boolean;
    stock_unlimited: boolean;
    stock_remaining?: number;
    created_at: string;
    updated_at: string;
}

export interface UserReward {
    id: string;
    user_id: string;
    reward_id: string;
    redeemed_at: string;
    points_spent: number;
    status: 'redeemed' | 'delivered' | 'activated';
    redemption_code?: string;
    fulfillment_data?: any;
    created_at: string;
}

export interface PointsTransaction {
    id: string;
    user_id: string;
    amount: number;
    balance_after: number;
    transaction_type: string;
    source_id?: string;
    description?: string;
    created_at: string;
}

export interface DailyStat {
    id: string;
    user_id: string;
    stats_date: string;
    total_focus_minutes: number;
    focus_sessions_completed: number;
    focus_sessions_canceled: number;
    total_blocks: number;
    total_minutes_saved: number;
    emergency_unlocks: number;
    points_earned: number;
    points_spent: number;
    had_focus_session: boolean;
    streak_maintained: boolean;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    notification_type: string;
    action_screen?: string;
    action_data?: any;
    scheduled_for?: string;
    sent_at?: string;
    read_at?: string;
    status: 'pending' | 'sent' | 'failed' | 'canceled';
    error_message?: string;
    created_at: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase connection failed:', e);
        return false;
    }
};

export const handleSupabaseError = (error: any, context: string): Error => {
    console.error(`[${context}] Supabase error:`, error);

    // Handle specific error types
    if (error.code === 'PGRST116') {
        return new Error('Resource not found');
    }
    if (error.code === '23505') {
        return new Error('Duplicate entry');
    }
    if (error.code === '42501') {
        return new Error('Permission denied');
    }

    return new Error(error.message || 'An error occurred');
};

export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }

    throw lastError;
};

// RPC helper with type safety
export const callFunction = async <T = any>(
    functionName: string,
    params?: Record<string, any>
): Promise<T> => {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
        throw handleSupabaseError(error, `RPC: ${functionName}`);
    }

    return data as T;
};
