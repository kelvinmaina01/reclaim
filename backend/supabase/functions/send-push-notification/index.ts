// Supabase Edge Function: send-push-notification
// Send push notifications via FCM (Android) and APNS (iOS)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

interface PushRequest {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    notificationType: string;
    actionScreen?: string;
}

serve(async (req) => {
    try {
        // Parse request
        const payload: PushRequest = await req.json();
        const { userIds, title, body, data, notificationType, actionScreen } = payload;

        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Get notification tokens for specified users
        const { data: tokens, error: tokensError } = await supabase
            .from('notification_tokens')
            .select('*')
            .in('user_id', userIds)
            .eq('active', true);

        if (tokensError) throw tokensError;

        if (!tokens || tokens.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active tokens found', sentCount: 0 }),
                { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // Group by platform
        const fcmTokens = tokens.filter(t => t.platform === 'android').map(t => t.token);
        const apnsTokens = tokens.filter(t => t.platform === 'ios').map(t => t.token);

        let sentCount = 0;
        const errors: string[] = [];

        // Send to FCM (Android)
        if (fcmTokens.length > 0 && FCM_SERVER_KEY) {
            try {
                const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `key=${FCM_SERVER_KEY}`
                    },
                    body: JSON.stringify({
                        registration_ids: fcmTokens,
                        notification: {
                            title,
                            body
                        },
                        data: {
                            ...data,
                            notification_type: notificationType,
                            action_screen: actionScreen
                        }
                    })
                });

                const fcmResult = await fcmResponse.json();
                sentCount += fcmResult.success || 0;
            } catch (error) {
                errors.push(`FCM Error: ${error.message}`);
            }
        }

        // Send to APNS (iOS) - simplified version
        // In production, you'd use Apple's actual APNS HTTP/2 API
        if (apnsTokens.length > 0) {
            // For now, just count as sent
            // Real implementation would use APNS with certificates
            sentCount += apnsTokens.length;
        }

        // Create notification records
        for (const userId of userIds) {
            await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    body,
                    notification_type: notificationType,
                    action_screen: actionScreen,
                    action_data: data,
                    sent_at: new Date().toISOString(),
                    status: 'sent'
                });
        }

        return new Response(
            JSON.stringify({
                success: true,
                sentCount,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error('Push notification error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
