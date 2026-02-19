-- 0009_schema_cleanup.sql
-- Refines profile schema, unifies name columns, and adds native sync helpers

-- ============================================================
-- 1. UNIFY NAME COLUMNS
-- ============================================================

-- Migrate any data from full_name to display_name if it exists
UPDATE public.profiles 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Update the handle_new_user function to populate both for compatibility
-- OR better yet, just focus on display_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_name TEXT;
BEGIN
  initial_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Focus Master');
  
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    display_name,
    avatar_type,
    avatar_value
  )
  VALUES (
    NEW.id,
    NEW.email,
    initial_name,
    initial_name,
    'emoji',
    '😊'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. NATIVE SYNC HELPERS
-- ============================================================

-- Function: Get all active limits and current usage for native sync
-- This reduces round-trips for the mobile app
CREATE OR REPLACE FUNCTION get_native_sync_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  active_limits JSONB;
  today_usage JSONB;
BEGIN
  -- Get active limits
  SELECT jsonb_agg(jsonb_build_object(
    'packageName', package_name,
    'appName', app_name,
    'limitMinutes', daily_limit_minutes
  )) INTO active_limits
  FROM app_limits
  WHERE user_id = user_uuid AND enabled = TRUE;

  -- Get today's usage for those specific apps
  SELECT jsonb_agg(jsonb_build_object(
    'packageName', package_name,
    'minutesUsed', total_minutes_today
  )) INTO today_usage
  FROM app_usage_stats
  WHERE user_id = user_uuid AND usage_date = CURRENT_DATE;

  RETURN jsonb_build_object(
    'limits', COALESCE(active_limits, '[]'::jsonb),
    'usage', COALESCE(today_usage, '[]'::jsonb),
    'serverTime', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. ADDITIONAL INDEXES
-- ============================================================

-- Index for faster lookup of today's stats during sync
CREATE INDEX IF NOT EXISTS idx_app_usage_today ON app_usage_stats (user_id, usage_date) 
WHERE usage_date = CURRENT_DATE;

-- Index for points leaderboard (future proofing)
CREATE INDEX IF NOT EXISTS idx_profiles_points_rank ON profiles (total_points DESC);

COMMENT ON FUNCTION get_native_sync_data IS 'Batch fetcher for native app to get limits and usage in one call';
