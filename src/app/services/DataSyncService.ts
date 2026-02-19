import { supabase, Profile, handleSupabaseError } from './SupabaseService';
import { appLimitsService } from './AppLimitsService';
import { statsService } from './StatsService';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================
// OFFLINE QUEUE TYPES
// ============================================================

interface QueuedOperation {
    id: string;
    operation: 'insert' | 'update' | 'delete';
    table: string;
    payload: any;
    timestamp: number;
}

class OfflineQueue {
    private queue: QueuedOperation[] = [];
    private storageKey = 'reclaim_offline_queue';

    constructor() {
        this.loadQueue();
    }

    private loadQueue() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
        }
    }

    private saveQueue() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    add(operation: Omit<QueuedOperation, 'id' | 'timestamp'>) {
        const item: QueuedOperation = {
            ...operation,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        this.queue.push(item);
        this.saveQueue();
    }

    async processQueue(): Promise<void> {
        const itemsToProcess = [...this.queue];

        for (const item of itemsToProcess) {
            try {
                await this.executeOperation(item);
                // Remove from queue on success
                this.queue = this.queue.filter(q => q.id !== item.id);
                this.saveQueue();
            } catch (error) {
                console.error('Failed to process queued operation:', error);
                // Keep in queue for retry
            }
        }
    }

    private async executeOperation(item: QueuedOperation): Promise<void> {
        const { operation, table, payload } = item;

        switch (operation) {
            case 'insert':
                const { error: insertError } = await supabase
                    .from(table)
                    .insert(payload);
                if (insertError) throw insertError;
                break;

            case 'update':
                const { error: updateError } = await supabase
                    .from(table)
                    .update(payload.data)
                    .eq('id', payload.id);
                if (updateError) throw updateError;
                break;

            case 'delete':
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', payload.id);
                if (deleteError) throw deleteError;
                break;
        }
    }

    clear() {
        this.queue = [];
        this.saveQueue();
    }

    get size() {
        return this.queue.length;
    }
}

// ============================================================
// DATA SYNC SERVICE
// ============================================================

class DataSyncService {
    private offlineQueue = new OfflineQueue();
    private realtimeChannels: Map<string, RealtimeChannel> = new Map();

    /**
     * Sync user profile from Supabase
     */
    async syncProfile(userId: string): Promise<Profile | null> {
        return this.fetchProfile(userId);
    }

    /**
     * Alias for syncProfile used by App.tsx
     */
    async fetchProfile(userId: string): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Profile doesn't exist yet
                throw error;
            }

            return data;
        } catch (error) {
            throw handleSupabaseError(error, 'fetchProfile');
        }
    }

    /**
     * Batch fetcher for native app to get limits and usage in one call
     */
    async getNativeSyncData(userId: string): Promise<{
        limits: any[];
        usage: any[];
        serverTime: string;
    }> {
        try {
            const { data, error } = await supabase.rpc('get_native_sync_data', {
                user_uuid: userId
            });

            if (error) throw error;

            return data;
        } catch (error) {
            throw handleSupabaseError(error, 'getNativeSyncData');
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                // Queue for offline retry
                this.offlineQueue.add({
                    operation: 'update',
                    table: 'profiles',
                    payload: { id: userId, data: updates }
                });
                throw error;
            }
        } catch (error) {
            throw handleSupabaseError(error, 'updateProfile');
        }
    }

    /**
     * Complete onboarding
     */
    async completeOnboarding(userId: string, goals: string[], problemApps: string[]): Promise<void> {
        try {
            await this.updateProfile(userId, {
                onboarded_at: new Date().toISOString(),
                selected_goals: goals,
                problem_apps: problemApps
            } as Partial<Profile>);
        } catch (error) {
            throw handleSupabaseError(error, 'completeOnboarding');
        }
    }

    /**
     * Sync app limits from backend
     */
    async syncAppLimits(): Promise<void> {
        try {
            // This is now handled by AppLimitsService
            await appLimitsService.getUserLimits();
        } catch (error) {
            throw handleSupabaseError(error, 'syncAppLimits');
        }
    }

    /**
     * Full data sync (called on app startup)
     */
    async fullSync(userId: string): Promise<{
        profile: Profile | null;
        dashboardStats: any;
        unreadNotifications: number;
    }> {
        try {
            // Process offline queue first
            await this.offlineQueue.processQueue();

            // Fetch all critical data in parallel
            const [profile, dashboardStats] = await Promise.all([
                this.syncProfile(userId),
                statsService.getDashboardStats()
            ]);

            return {
                profile,
                dashboardStats,
                unreadNotifications: 0 // Will be fetched by NotificationService
            };
        } catch (error) {
            throw handleSupabaseError(error, 'fullSync');
        }
    }

    /**
     * Setup real-time subscriptions
     */
    setupRealtimeSubscriptions(
        userId: string,
        callbacks: {
            onProfileUpdate?: (profile: Profile) => void;
            onPointsUpdate?: (transaction: any) => void;
            onNewInsight?: (insight: any) => void;
            onNotification?: (notification: any) => void;
        }
    ): void {
        // Profile updates
        if (callbacks.onProfileUpdate) {
            const profileChannel = supabase
                .channel(`profile-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${userId}`
                    },
                    (payload) => {
                        callbacks.onProfileUpdate!(payload.new as Profile);
                    }
                )
                .subscribe();

            this.realtimeChannels.set('profile', profileChannel);
        }

        // Points transactions
        if (callbacks.onPointsUpdate) {
            const pointsChannel = supabase
                .channel(`points-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'points_transactions',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        callbacks.onPointsUpdate!(payload.new);
                    }
                )
                .subscribe();

            this.realtimeChannels.set('points', pointsChannel);
        }

        // AI Insights
        if (callbacks.onNewInsight) {
            const insightsChannel = supabase
                .channel(`insights-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'ai_insights',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        callbacks.onNewInsight!(payload.new);
                    }
                )
                .subscribe();

            this.realtimeChannels.set('insights', insightsChannel);
        }

        // Notifications
        if (callbacks.onNotification) {
            const notificationsChannel = supabase
                .channel(`notifications-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        callbacks.onNotification!(payload.new);
                    }
                )
                .subscribe();

            this.realtimeChannels.set('notifications', notificationsChannel);
        }
    }

    /**
     * Cleanup real-time subscriptions
     */
    cleanupRealtimeSubscriptions(): void {
        this.realtimeChannels.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        this.realtimeChannels.clear();
    }

    /**
     * Get offline queue size
     */
    getOfflineQueueSize(): number {
        return this.offlineQueue.size;
    }

    /**
     * Clear offline queue
     */
    clearOfflineQueue(): void {
        this.offlineQueue.clear();
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(userId: string): Promise<void> {
        try {
            await supabase
                .from('profiles')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            // Silently fail - this is not critical
            console.warn('Failed to update last active:', error);
        }
    }
}

export const dataSyncService = new DataSyncService();
