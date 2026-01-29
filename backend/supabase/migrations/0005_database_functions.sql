-- 0005_database_functions.sql
-- Core database functions for Reclaim app
-- Includes points system, focus sessions, app limits, stats aggregation, and AI insights

-- ============================================================
-- POINTS & GAMIFICATION FUNCTIONS
-- ============================================================

-- Function: Award points and log transaction
CREATE OR REPLACE FUNCTION award_points(
  user_uuid UUID,
  amount INTEGER,
  trans_type TEXT,
  source_uuid UUID DEFAULT NULL,
  description_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_balance INTEGER;
  transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT total_points INTO new_balance FROM profiles WHERE id = user_uuid;
  
  -- Calculate new balance
  new_balance := new_balance + amount;
  
  -- Update profile
  UPDATE profiles 
  SET total_points = new_balance, updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Log transaction
  INSERT INTO points_transactions (user_id, amount, balance_after, transaction_type, source_id, description)
  VALUES (user_uuid, amount, new_balance, trans_type, source_uuid, description_text)
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate focus streak
CREATE OR REPLACE FUNCTION calculate_streak(user_uuid UUID) 
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  had_session BOOLEAN;
BEGIN
  -- Start from today and go backwards
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM focus_sessions
      WHERE user_id = user_uuid 
        AND completed = TRUE
        AND DATE(completed_at) = check_date
    ) INTO had_session;
    
    EXIT WHEN NOT had_session;
    
    current_streak := current_streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check and update streak (called daily)
CREATE OR REPLACE FUNCTION check_and_update_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  had_session_yesterday BOOLEAN;
  current_streak_value INTEGER;
BEGIN
  -- Check if user had a focus session yesterday
  SELECT EXISTS(
    SELECT 1 FROM focus_sessions
    WHERE user_id = user_uuid 
      AND completed = TRUE
      AND DATE(completed_at) = yesterday_date
  ) INTO had_session_yesterday;
  
  IF had_session_yesterday THEN
    -- Maintain or increment streak
    current_streak_value := calculate_streak(user_uuid);
    
    UPDATE profiles
    SET 
      focus_streak = current_streak_value,
      longest_streak = GREATEST(longest_streak, current_streak_value),
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSE
    -- Check if they had a session the day before (grace period)
    SELECT EXISTS(
      SELECT 1 FROM focus_sessions
      WHERE user_id = user_uuid 
        AND completed = TRUE
        AND DATE(completed_at) = CURRENT_DATE - INTERVAL '2 days'
    ) INTO had_session_yesterday;
    
    IF NOT had_session_yesterday THEN
      -- Reset streak
      UPDATE profiles
      SET focus_streak = 0, updated_at = NOW()
      WHERE id = user_uuid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FOCUS SESSION FUNCTIONS
-- ============================================================

-- Function: Start focus session
CREATE OR REPLACE FUNCTION start_focus_session(
  user_uuid UUID,
  duration_mins INTEGER,
  blocked_apps_array TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
  existing_session UUID;
BEGIN
  -- Check for existing active session
  SELECT id INTO existing_session FROM focus_sessions
  WHERE user_id = user_uuid 
    AND completed = FALSE 
    AND canceled_at IS NULL;
  
  IF existing_session IS NOT NULL THEN
    RAISE EXCEPTION 'Active session already exists: %', existing_session;
  END IF;
  
  -- Create new session
  INSERT INTO focus_sessions (
    user_id, 
    duration_minutes, 
    blocked_apps,
    started_at,
    completed
  ) VALUES (
    user_uuid,
    duration_mins,
    blocked_apps_array,
    NOW(),
    FALSE
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete focus session
CREATE OR REPLACE FUNCTION complete_focus_session(session_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  session_record RECORD;
  points_to_award INTEGER;
  minutes_reclaimed INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO session_record FROM focus_sessions WHERE id = session_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', session_uuid;
  END IF;
  
  IF session_record.completed THEN
    RAISE EXCEPTION 'Session already completed';
  END IF;
  
  -- Calculate points (10 points per minute)
  points_to_award := session_record.duration_minutes * 10;
  minutes_reclaimed := session_record.duration_minutes;
  
  -- Mark session as completed
  UPDATE focus_sessions
  SET 
    completed = TRUE,
    completed_at = NOW(),
    points_earned = points_to_award
  WHERE id = session_uuid;
  
  -- Award points
  PERFORM award_points(
    session_record.user_id,
    points_to_award,
    'focus_session',
    session_uuid,
    format('Completed %s minute focus session', session_record.duration_minutes)
  );
  
  -- Update profile stats
  UPDATE profiles
  SET 
    daily_reclaimed_minutes = daily_reclaimed_minutes + minutes_reclaimed,
    total_reclaimed_minutes = total_reclaimed_minutes + minutes_reclaimed,
    updated_at = NOW()
  WHERE id = session_record.user_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'session_id', session_uuid,
    'points_earned', points_to_award,
    'minutes', minutes_reclaimed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel focus session
CREATE OR REPLACE FUNCTION cancel_focus_session(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE focus_sessions
  SET canceled_at = NOW()
  WHERE id = session_uuid AND completed = FALSE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or already completed: %', session_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- APP LIMITS & TRACKING FUNCTIONS
-- ============================================================

-- Function: Check if app limit exceeded
CREATE OR REPLACE FUNCTION check_app_limit_exceeded(
  user_uuid UUID,
  package TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  limit_minutes INTEGER;
  usage_minutes INTEGER;
  limit_enabled BOOLEAN;
BEGIN
  -- Get limit settings
  SELECT daily_limit_minutes, enabled INTO limit_minutes, limit_enabled
  FROM app_limits
  WHERE user_id = user_uuid AND package_name = package;
  
  IF NOT FOUND OR NOT limit_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Get today's usage
  SELECT COALESCE(total_minutes_today, 0) INTO usage_minutes
  FROM app_usage_stats
  WHERE user_id = user_uuid 
    AND package_name = package 
    AND usage_date = CURRENT_DATE;
  
  RETURN usage_minutes >= limit_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log app block event
CREATE OR REPLACE FUNCTION log_app_block(
  user_uuid UUID,
  package TEXT,
  app_name_text TEXT,
  minutes_saved INTEGER,
  redirect TEXT DEFAULT NULL,
  emergency_unlock BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  block_id UUID;
BEGIN
  INSERT INTO app_blocks (
    user_id,
    package_name,
    app_name,
    minutes_reclaimed,
    redirect_choice,
    emergency_unlocked
  ) VALUES (
    user_uuid,
    package,
    app_name_text,
    minutes_saved,
    redirect,
    emergency_unlock
  ) RETURNING id INTO block_id;
  
  -- Update daily reclaimed if not emergency unlock
  IF NOT emergency_unlock THEN
    UPDATE profiles
    SET 
      daily_reclaimed_minutes = daily_reclaimed_minutes + minutes_saved,
      total_reclaimed_minutes = total_reclaimed_minutes + minutes_saved,
      updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Award bonus points for successful block
    PERFORM award_points(
      user_uuid,
      minutes_saved * 2, -- 2 points per minute saved
      'limit_respected',
      block_id,
      format('Respected limit for %s', app_name_text)
    );
  END IF;
  
  RETURN block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update app usage stats
CREATE OR REPLACE FUNCTION update_app_usage(
  user_uuid UUID,
  package TEXT,
  app_name_text TEXT,
  foreground_ms BIGINT
) RETURNS VOID AS $$
DECLARE
  usage_minutes INTEGER;
BEGIN
  usage_minutes := CEIL(foreground_ms / 60000.0)::INTEGER;
  
  INSERT INTO app_usage_stats (
    user_id,
    package_name,
    app_name,
    usage_date,
    total_minutes_today,
    total_foreground_time_ms,
    last_used_at,
    session_count
  ) VALUES (
    user_uuid,
    package,
    app_name_text,
    CURRENT_DATE,
    usage_minutes,
    foreground_ms,
    NOW(),
    1
  )
  ON CONFLICT (user_id, package_name, usage_date)
  DO UPDATE SET
    total_minutes_today = app_usage_stats.total_minutes_today + usage_minutes,
    total_foreground_time_ms = app_usage_stats.total_foreground_time_ms + foreground_ms,
    last_used_at = NOW(),
    session_count = app_usage_stats.session_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STATISTICS & AGGREGATION FUNCTIONS
-- ============================================================

-- Function: Get optimized dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data RECORD;
  today_blocks INTEGER;
  most_blocked RECORD;
BEGIN
  -- Get profile stats
  SELECT * INTO profile_data  FROM profiles WHERE id = user_uuid;
  
  -- Get today's block count
  SELECT COUNT(*) INTO today_blocks
  FROM app_blocks
  WHERE user_id = user_uuid AND DATE(blocked_at) = CURRENT_DATE;
  
  -- Get most blocked app today
  SELECT 
    app_name,
    package_name,
    COUNT(*) as block_count,
    SUM(minutes_reclaimed) as total_saved
  INTO most_blocked
  FROM app_blocks
  WHERE user_id = user_uuid AND DATE(blocked_at) = CURRENT_DATE
  GROUP BY app_name, package_name
  ORDER BY block_count DESC
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'daily_reclaimed_minutes', profile_data.daily_reclaimed_minutes,
    'total_reclaimed_minutes', profile_data.total_reclaimed_minutes,
    'focus_streak', profile_data.focus_streak,
    'longest_streak', profile_data.longest_streak,
    'total_points', profile_data.total_points,
    'today_blocks', today_blocks,
    'most_blocked_app', CASE WHEN most_blocked.app_name IS NOT NULL THEN
      jsonb_build_object(
        'app_name', most_blocked.app_name,
        'package_name', most_blocked.package_name,
        'block_count', most_blocked.block_count,
        'total_saved', most_blocked.total_saved
      )
    ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get weekly stats
CREATE OR REPLACE FUNCTION get_weekly_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  week_start DATE := CURRENT_DATE - INTERVAL '7 days';
  stats RECORD;
BEGIN
  SELECT 
    COALESCE(SUM(total_focus_minutes), 0) as total_focus,
    COALESCE(SUM(focus_sessions_completed), 0) as sessions_completed,
    COALESCE(SUM(total_blocks), 0) as total_blocks,
    COALESCE(SUM(total_minutes_saved), 0) as total_saved,
    COALESCE(SUM(points_earned), 0) as points_earned
  INTO stats
  FROM daily_stats
  WHERE user_id = user_uuid AND stats_date >= week_start;
  
  RETURN jsonb_build_object(
    'total_focus_minutes', stats.total_focus,
    'sessions_completed', stats.sessions_completed,
    'total_blocks', stats.total_blocks,
    'total_minutes_saved', stats.total_saved,
    'points_earned', stats.points_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refresh daily stats (aggregate from raw data)
CREATE OR REPLACE FUNCTION refresh_daily_stats(
  user_uuid UUID,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  focus_data RECORD;
  block_data RECORD;
  points_data RECORD;
BEGIN
  -- Calculate focus stats
  SELECT 
    COUNT(*) FILTER (WHERE completed = TRUE) as completed_count,
    COUNT(*) FILTER (WHERE canceled_at IS NOT NULL) as canceled_count,
    COALESCE(SUM(duration_minutes) FILTER (WHERE completed = TRUE), 0) as total_minutes
  INTO focus_data
  FROM focus_sessions
  WHERE user_id = user_uuid AND DATE(created_at) = target_date;
  
  -- Calculate block stats
  SELECT 
    COUNT(*) as block_count,
    COALESCE(SUM(minutes_reclaimed), 0) as total_saved,
    COUNT(*) FILTER (WHERE emergency_unlocked = TRUE) as emergency_count
  INTO block_data
  FROM app_blocks
  WHERE user_id = user_uuid AND DATE(blocked_at) = target_date;
  
  -- Calculate points
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) as earned,
    COALESCE(ABS(SUM(amount)) FILTER (WHERE amount < 0), 0) as spent
  INTO points_data
  FROM points_transactions
  WHERE user_id = user_uuid AND DATE(created_at) = target_date;
  
  -- Upsert daily stats
  INSERT INTO daily_stats (
    user_id,
    stats_date,
    total_focus_minutes,
    focus_sessions_completed,
    focus_sessions_canceled,
    total_blocks,
    total_minutes_saved,
    emergency_unlocks,
    points_earned,
    points_spent,
    had_focus_session,
    streak_maintained
  ) VALUES (
    user_uuid,
    target_date,
    focus_data.total_minutes,
    focus_data.completed_count,
    focus_data.canceled_count,
    block_data.block_count,
    block_data.total_saved,
    block_data.emergency_count,
    points_data.earned,
    points_data.spent,
    focus_data.completed_count > 0,
    focus_data.completed_count > 0
  )
  ON CONFLICT (user_id, stats_date)
  DO UPDATE SET
    total_focus_minutes = EXCLUDED.total_focus_minutes,
    focus_sessions_completed = EXCLUDED.focus_sessions_completed,
    focus_sessions_canceled = EXCLUDED.focus_sessions_canceled,
    total_blocks = EXCLUDED.total_blocks,
    total_minutes_saved = EXCLUDED.total_minutes_saved,
    emergency_unlocks = EXCLUDED.emergency_unlocks,
    points_earned = EXCLUDED.points_earned,
    points_spent = EXCLUDED.points_spent,
    had_focus_session = EXCLUDED.had_focus_session,
    streak_maintained = EXCLUDED.streak_maintained,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- AI INSIGHTS FUNCTIONS
-- ============================================================

-- Function: Generate productivity window insight
CREATE OR REPLACE FUNCTION generate_productivity_insight(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  best_hour INTEGER;
  insight_id UUID;
BEGIN
  -- Find hour with most completed focus sessions
  SELECT EXTRACT(HOUR FROM started_at)::INTEGER INTO best_hour
  FROM focus_sessions
  WHERE user_id = user_uuid 
    AND completed = TRUE
    AND started_at >= NOW() - INTERVAL '30 days'
  GROUP BY EXTRACT(HOUR FROM started_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  IF best_hour IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO ai_insights (
    user_id,
    title,
    description,
    explanation,
    data_used,
    type,
    color_hint
  ) VALUES (
    user_uuid,
    'Peak Productivity',
    format('You focus best around %s:00', best_hour),
    'Based on your focus session history, this is when you complete sessions most consistently.',
    'Focus session timing data (last 30 days)',
    'productivity',
    'from-amber-400 to-orange-500'
  ) RETURNING id INTO insight_id;
  
  RETURN insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate risk period insight
CREATE OR REPLACE FUNCTION generate_risk_insight(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  risk_hour INTEGER;
  insight_id UUID;
BEGIN
  -- Find hour with most emergency unlocks
  SELECT EXTRACT(HOUR FROM blocked_at)::INTEGER INTO risk_hour
  FROM app_blocks
  WHERE user_id = user_uuid 
    AND emergency_unlocked = TRUE
    AND blocked_at >= NOW() - INTERVAL '30 days'
  GROUP BY EXTRACT(HOUR FROM blocked_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  IF risk_hour IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO ai_insights (
    user_id,
    title,
    description,
    explanation,
    data_used,
    type,
    color_hint
  ) VALUES (
    user_uuid,
    'Scroll Risk Alert',
    format('High risk detected around %s:00', risk_hour),
    'You tend to override blocks during this time. Consider a focus session beforehand.',
    'Block and emergency unlock patterns (last 30 days)',
    'risk',
    'from-red-400 to-orange-500'
  ) RETURNING id INTO insight_id;
  
  RETURN insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REWARDS FUNCTIONS
-- ============================================================

-- Function: Redeem reward
CREATE OR REPLACE FUNCTION redeem_reward(
  user_uuid UUID,
  reward_uuid UUID
) RETURNS JSONB AS $$
DECLARE
  reward_record RECORD;
  current_points INTEGER;
  redemption_id UUID;
BEGIN
  -- Get reward details
  SELECT * INTO reward_record FROM rewards_catalog WHERE id = reward_uuid AND enabled = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or disabled';
  END IF;
  
  -- Check stock
  IF NOT reward_record.stock_unlimited THEN
    IF reward_record.stock_remaining <= 0 THEN
      RAISE EXCEPTION 'Reward out of stock';
    END IF;
  END IF;
  
  -- Get user points
  SELECT total_points INTO current_points FROM profiles WHERE id = user_uuid;
  
  IF current_points < reward_record.cost_points THEN
    RAISE EXCEPTION 'Insufficient points. Need % but have %', reward_record.cost_points, current_points;
  END IF;
  
  -- Deduct points
  PERFORM award_points(
    user_uuid,
    -reward_record.cost_points,
    'reward_redeemed',
    reward_uuid,
    format('Redeemed: %s', reward_record.name)
  );
  
  -- Create redemption record
  INSERT INTO user_rewards (
    user_id,
    reward_id,
    points_spent,
    status
  ) VALUES (
    user_uuid,
    reward_uuid,
    reward_record.cost_points,
    'redeemed'
  ) RETURNING id INTO redemption_id;
  
  -- Update stock if not unlimited
  IF NOT reward_record.stock_unlimited THEN
    UPDATE rewards_catalog
    SET stock_remaining = stock_remaining - 1
    WHERE id = reward_uuid;
  END IF;
  
  RETURN jsonb_build_object(
    'redemption_id', redemption_id,
    'reward_name', reward_record.name,
    'points_spent', reward_record.cost_points,
    'new_balance', current_points - reward_record.cost_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Function: Reset daily data (called by cron)
CREATE OR REPLACE FUNCTION reset_daily_data(user_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF user_uuid IS NOT NULL THEN
    -- Reset specific user
    UPDATE profiles
    SET daily_reclaimed_minutes = 0, updated_at = NOW()
    WHERE id = user_uuid;
  ELSE
    -- Reset all users
    UPDATE profiles
    SET daily_reclaimed_minutes = 0, updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
