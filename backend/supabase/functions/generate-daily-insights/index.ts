// Supabase Edge Function: generate-daily-insights
// Schedule: Daily at 8:00 AM (user's timezone)
// Generates AI insights for all active users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get all users with AI enabled who have been active in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('ai_enabled', true)
            .gte('last_active_at', weekAgo.toISOString());

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active users', generated: 0 }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        let generatedCount = 0;
        const errors: string[] = [];

        // Generate insights for each user
        for (const user of users) {
            try {
                // Generate productivity insight
                const { data: productivityId, error: prodError } = await supabase
                    .rpc('generate_productivity_insight', { user_uuid: user.id });

                if (prodError) {
                    console.warn(`Productivity insight failed for ${user.id}:`, prodError);
                } else if (productivityId) {
                    generatedCount++;
                }

                // Generate risk insight
                const { data: riskId, error: riskError } = await supabase
                    .rpc('generate_risk_insight', { user_uuid: user.id });

                if (riskError) {
                    console.warn(`Risk insight failed for ${user.id}:`, riskError);
                } else if (riskId) {
                    generatedCount++;
                }

                // If insights were generated, send notification
                if (productivityId || riskId) {
                    // Queue a push notification
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: user.id,
                            title: 'New AI Insights',
                            body: 'We\'ve analyzed your patterns and have new insights for you',
                            notification_type: 'new_insight',
                            action_screen: 'ai-insights',
                            status: 'pending',
                            scheduled_for: new Date().toISOString()
                        });
                }
            } catch (error) {
                errors.push(`User ${user.id}: ${error.message}`);
                console.error(`Error generating insights for user ${user.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                usersProcessed: users.length,
                insightsGenerated: generatedCount,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error('Generate insights error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
