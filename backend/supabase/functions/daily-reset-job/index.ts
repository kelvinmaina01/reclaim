// Supabase Edge Function: daily-reset-job
// Schedule: Every hour (processes users whose local midnight has passed)
// Resets daily counters at midnight (user's timezone)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get all users who were last active in the past 48 hours
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, timezone, last_active_at')
            .gte('last_active_at', twoDaysAgo.toISOString());

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active users', reset: 0 }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        let resetCount = 0;
        const errors: string[] = [];

        // Process each user
        for (const user of users) {
            try {
                // Calculate user's current time (simplified - use UTC for now)
                const now = new Date();
                const userTimezone = user.timezone || 'UTC';

                // Simple timezone handling - in production, use a proper library
                // For now, just check if it's past midnight UTC
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                const yesterdayEnd = new Date(todayStart);
                yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
                yesterdayEnd.setHours(23, 59, 59, 999);

                // Check if user has daily_reclaimed_minutes > 0 (hasn't been reset today)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('daily_reclaimed_minutes, id')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.daily_reclaimed_minutes > 0) {
                    // Aggregate yesterday's stats
                    const yesterday = yesterdayEnd.toISOString().split('T')[0];
                    await supabase.rpc('refresh_daily_stats', {
                        user_uuid: user.id,
                        target_date: yesterday
                    });

                    // Reset daily counter
                    await supabase.rpc('reset_daily_data', {
                        user_uuid: user.id
                    });

                    // Update streak
                    await supabase.rpc('check_and_update_streak', {
                        user_uuid: user.id
                    });

                    resetCount++;
                }
            } catch (error) {
                errors.push(`User ${user.id}: ${error.message}`);
                console.error(`Error resetting user ${user.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                usersProcessed: users.length,
                usersReset: resetCount,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error('Daily reset error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
