-- 0007_realtime_triggers.sql
-- Setup real-time triggers for Supabase Realtime

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE focus_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE app_usage_stats;

-- Note: Clients can now subscribe to real-time changes on these tables
-- Example in frontend:
-- supabase.channel('profile-changes')
--   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, handleUpdate)
--   .subscribe()

COMMENT ON PUBLICATION supabase_realtime IS 'Real-time enabled for profiles, points_transactions, ai_insights, notifications, focus_sessions, app_usage_stats';
