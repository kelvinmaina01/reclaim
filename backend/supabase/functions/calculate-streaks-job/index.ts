// Supabase Edge Function: calculate-streaks-job
// Schedule: Daily at 1:00 AM
// Updates focus streaks for all users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get all active users (active in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .gte('last_active_at', weekAgo.toISOString());

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active users', updated: 0 }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        let updatedCount = 0;
        const errors: string[] = [];

        // Update streak for each user
        for (const user of users) {
            try {
                await supabase.rpc('check_and_update_streak', {
                    user_uuid: user.id
                });
                updatedCount++;
            } catch (error) {
                errors.push(`User ${user.id}: ${error.message}`);
                console.error(`Error updating streak for user ${user.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                usersProcessed: users.length,
                streaksUpdated: updatedCount,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error('Calculate streaks error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
