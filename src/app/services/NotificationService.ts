import { supabase, handleSupabaseError, Notification } from './SupabaseService';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const notificationService = {
    /**
     * Register device for push notifications
     */
    async registerToken(token: string, platform: 'ios' | 'android' | 'web', deviceInfo?: { deviceId?: string; deviceName?: string }): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('notification_tokens')
                .upsert({
                    user_id: user.id,
                    token,
                    platform,
                    device_id: deviceInfo?.deviceId,
                    device_name: deviceInfo?.deviceName,
                    active: true,
                    last_used_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,token'
                });

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'registerToken');
        }
    },

    /**
     * Initialize push notifications (Capacitor)
     */
    async initializePushNotifications(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log('Push notifications only supported on native platforms');
            return;
        }

        try {
            // Request permission
            const permResult = await PushNotifications.requestPermissions();

            if (permResult.receive === 'granted') {
                // Register with system
                await PushNotifications.register();

                // Listen for registration success
                await PushNotifications.addListener('registration', async (token) => {
                    const platform = Capacitor.getPlatform() as 'ios' | 'android';
                    await this.registerToken(token.value, platform);
                });

                // Listen for push notifications
                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received:', notification);
                });

                await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed:', notification);
                    // Handle navigation based on notification data
                });
            }
        } catch (error) {
            console.error('Push notification initialization failed:', error);
        }
    },

    /**
     * Get notification history
     */
    async getNotifications(limit: number = 50, offset: number = 0): Promise<Notification[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getNotifications');
        }
    },

    /**
     * Get unread notifications
     */
    async getUnreadNotifications(): Promise<Notification[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .is('read_at', null)
                .not('sent_at', 'is', null)
                .order('sent_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            throw handleSupabaseError(error, 'getUnreadNotifications');
        }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'markAsRead');
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .is('read_at', null);

            if (error) throw error;
        } catch (error) {
            throw handleSupabaseError(error, 'markAllAsRead');
        }
    },

    /**
     * Schedule a notification (for admin/system use)
     */
    async scheduleNotification(
        type: string,
        scheduledFor: string,
        title: string,
        body: string,
        actionData?: { screen?: string; data?: any }
    ): Promise<string> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    title,
                    body,
                    notification_type: type,
                    action_screen: actionData?.screen,
                    action_data: actionData?.data,
                    scheduled_for: scheduledFor,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            return data.id;
        } catch (error) {
            throw handleSupabaseError(error, 'scheduleNotification');
        }
    },

    /**
     * Get unread count (for badge)
     */
    async getUnreadCount(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .is('read_at', null)
                .not('sent_at', 'is', null);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            throw handleSupabaseError(error, 'getUnreadCount');
        }
    }
};
