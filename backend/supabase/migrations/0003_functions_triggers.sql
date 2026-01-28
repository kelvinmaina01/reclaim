-- 0003_functions_triggers.sql
-- Database Functions and Triggers for Reclaim App

-- Function: Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Focus Master'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on profiles update
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: Calculate daily focus stats
CREATE OR REPLACE FUNCTION get_daily_focus_stats(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_minutes INTEGER,
  total_points INTEGER,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(duration_minutes), 0)::INTEGER as total_minutes,
    COALESCE(SUM(points_earned), 0)::INTEGER as total_points,
    COUNT(*)::INTEGER as session_count
  FROM focus_sessions
  WHERE user_id = user_uuid
    AND DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
