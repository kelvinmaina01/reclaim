import { supabase, handleSupabaseError, callFunction, FocusSession } from './SupabaseService';

export interface StartSessionResult {
    session_id: string;
}

export interface CompleteSessionResult {
    session_id: string;
    points_earned: number;
    minutes: number;
}

export const focusSessionService = {
    /**
     * Start a new focus session
     */
    async startSession(durationMinutes: number, blockedApps: string[] = []): Promise<string> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const sessionId = await callFunction<string>('start_focus_session', {
                user_uuid: user.id,
                duration_mins: durationMinutes,
                blocked_apps_array: blockedApps
            });

            return sessionId;
        } catch (error) {
            throw handleSupabaseError(error, 'startSession');
        }
    },

    /**
     * Complete an active focus session
     */
    async completeSession(sessionId: string): Promise<CompleteSessionResult> {
        try {
            const result = await callFunction<CompleteSessionResult>('complete_focus_session', {
                session_uuid: sessionId
            });

            return result;
        } catch (error) {
            throw handleSupabaseError(error, 'completeSession');
        }
    },

    /**
     * Cancel a focus session early
     */
    async cancelSession(sessionId: string): Promise<void> {
        try {
            await callFunction('cancel_focus_session', {
                session_uuid: sessionId
            });
        } catch (error) {
            throw handleSupabaseError(error, 'cancelSession');
        }
    },

    /**
     * Get the current active session (if any)
     */
    async getActiveSession(): Promise<FocusSession | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', false)
                .is('canceled_at', null)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No active session
                throw error;
            }

            return data;
        } catch (error) {
            throw handleSupabaseError(error, 'getActiveSession');
        }
    },

    /**
     * Get session history with pagination
     */
    async getSessionHistory(limit: number = 20, offset: number = 0): Promise<FocusSession[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('focus_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getSessionHistory');
        }
    },

    /**
     * Get today's session stats
     */
    async getTodayStats(): Promise<{ completed: number; canceled: number; totalMinutes: number }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { completed: 0, canceled: 0, totalMinutes: 0 };

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('focus_sessions')
                .select('completed, canceled_at, duration_minutes')
                .eq('user_id', user.id)
                .gte('created_at', today)
                .lt('created_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]);

            if (error) throw error;

            const stats = (data || []).reduce((acc, session) => {
                if (session.completed) {
                    acc.completed++;
                    acc.totalMinutes += session.duration_minutes;
                } else if (session.canceled_at) {
                    acc.canceled++;
                }
                return acc;
            }, { completed: 0, canceled: 0, totalMinutes: 0 });

            return stats;
        } catch (error) {
            throw handleSupabaseError(error, 'getTodayStats');
        }
    }
};
