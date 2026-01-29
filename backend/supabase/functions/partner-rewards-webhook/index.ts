// Supabase Edge Function: partner-rewards-webhook
// Webhook endpoint for partner reward fulfillment callbacks
// This is a mock/stub for future partner integrations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('PARTNER_WEBHOOK_SECRET') || 'dev-secret';

interface PartnerWebhookPayload {
    redemption_id: string;
    partner_name: string;
    status: 'delivered' | 'activated' | 'failed';
    redemption_code?: string;
    fulfillment_data?: Record<string, any>;
    error_message?: string;
}

serve(async (req) => {
    try {
        // Verify webhook signature (simplified)
        const signature = req.headers.get('x-webhook-signature');
        if (signature !== WEBHOOK_SECRET) {
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { headers: { 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        // Parse payload
        const payload: PartnerWebhookPayload = await req.json();
        const { redemption_id, partner_name, status, redemption_code, fulfillment_data, error_message } = payload;

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get redemption record
        const { data: redemption, error: redemptionError } = await supabase
            .from('user_rewards')
            .select('*, reward_id(name)')
            .eq('id', redemption_id)
            .single();

        if (redemptionError) throw redemptionError;

        if (!redemption) {
            return new Response(
                JSON.stringify({ error: 'Redemption not found' }),
                { headers: { 'Content-Type': 'application/json' }, status: 404 }
            );
        }

        // Update redemption status
        const { error: updateError } = await supabase
            .from('user_rewards')
            .update({
                status,
                redemption_code,
                fulfillment_data
            })
            .eq('id', redemption_id);

        if (updateError) throw updateError;

        // Send notification to user
        const notificationTitle = status === 'delivered'
            ? 'Reward Delivered!'
            : status === 'activated'
                ? 'Reward Activated!'
                : 'Reward Issue';

        const notificationBody = status === 'delivered'
            ? `Your ${partner_name} reward is ready to use!`
            : status === 'activated'
                ? `Your ${partner_name} reward has been activated.`
                : `There was an issue with your ${partner_name} reward. Please contact support.`;

        await supabase
            .from('notifications')
            .insert({
                user_id: redemption.user_id,
                title: notificationTitle,
                body: notificationBody,
                notification_type: 'reward_update',
                action_screen: 'rewards',
                action_data: { redemption_id: redemption_id },
                status: 'pending',
                scheduled_for: new Date().toISOString()
            });

        return new Response(
            JSON.stringify({
                success: true,
                redemption_id,
                status
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error('Partner webhook error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
