-- 0004_complete_schema.sql
-- Complete database schema for Reclaim app
-- Creates all missing tables and enhances existing ones

-- ============================================================
-- 1. ENHANCE PROFILES TABLE
-- ============================================================

-- Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'emoji',
  ADD COLUMN IF NOT EXISTS avatar_value TEXT DEFAULT '😊',
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS selected_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS problem_apps TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_reclaimed_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Rename blocked_apps to avoid confusion (it was being misused)
-- We'll keep it for backward compatibility but add proper problem_apps
UPDATE profiles SET problem_apps = blocked_apps WHERE problem_apps = '{}';

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_profiles_focus_streak ON profiles(focus_streak DESC);

-- ============================================================
-- 2. CREATE APP_LIMITS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS app_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- App Identity
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_icon TEXT,
  category TEXT,
  
  -- Limit Settings
  daily_limit_minutes INTEGER NOT NULL DEFAULT 30,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- AI Suggestions
  ai_suggested_limit INTEGER,
  ai_explanation TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, package_name)
);

-- Indexes
CREATE INDEX idx_app_limits_user ON app_limits(user_id);
CREATE INDEX idx_app_limits_enabled ON app_limits(user_id, enabled) WHERE enabled = TRUE;

-- RLS
ALTER TABLE app_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own app limits"
  ON app_limits FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. CREATE APP_USAGE_STATS TABLE (PARTITIONED)
-- ============================================================

CREATE TABLE IF NOT EXISTS app_usage_stats (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- App Identity
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  
  -- Usage Data
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes_today INTEGER DEFAULT 0,
  total_foreground_time_ms BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  session_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, package_name, usage_date),
  PRIMARY KEY (id, usage_date)
) PARTITION BY RANGE (usage_date);

-- Create partitions for current and next months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  -- Create partition for current month
  start_date := DATE_TRUNC('month', CURRENT_DATE);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'app_usage_stats_' || TO_CHAR(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF app_usage_stats FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date);
  
  -- Create partition for next month
  start_date := end_date;
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'app_usage_stats_' || TO_CHAR(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF app_usage_stats FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date);
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_usage_user_date ON app_usage_stats(user_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_app_usage_package ON app_usage_stats(user_id, package_name, usage_date);

-- RLS
ALTER TABLE app_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own usage stats"
  ON app_usage_stats FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. ENHANCE FOCUS_SESSIONS TABLE
-- ============================================================

ALTER TABLE focus_sessions
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_apps TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed ON focus_sessions(user_id, completed);

-- ============================================================
-- 5. CREATE APP_BLOCKS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS app_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Block Details
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  minutes_reclaimed INTEGER DEFAULT 0,
  
  -- User Response
  redirect_choice TEXT,
  emergency_unlocked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_blocks_user ON app_blocks(user_id, blocked_at DESC);
CREATE INDEX idx_app_blocks_app ON app_blocks(user_id, package_name, blocked_at);
CREATE INDEX idx_app_blocks_emergency ON app_blocks(user_id, emergency_unlocked) WHERE emergency_unlocked = TRUE;

-- RLS
ALTER TABLE app_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own block logs"
  ON app_blocks FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. CREATE REWARDS_CATALOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reward Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('in_app', 'partner', 'purpose')),
  
  -- Pricing
  cost_points INTEGER NOT NULL,
  
  -- Details
  icon TEXT,
  partner_name TEXT,
  cause_name TEXT,
  
  -- Availability
  enabled BOOLEAN DEFAULT TRUE,
  stock_unlimited BOOLEAN DEFAULT TRUE,
  stock_remaining INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rewards_category ON rewards_catalog(category, enabled);
CREATE INDEX idx_rewards_cost ON rewards_catalog(cost_points);

-- RLS: Read-only for all authenticated users
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rewards"
  ON rewards_catalog FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. CREATE USER_REWARDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,
  
  -- Redemption
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  points_spent INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'delivered', 'activated')),
  
  -- Fulfillment
  redemption_code TEXT,
  fulfillment_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id, redeemed_at DESC);
CREATE INDEX idx_user_rewards_reward ON user_rewards(reward_id);

-- RLS
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON user_rewards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. CREATE POINTS_TRANSACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Source
  transaction_type TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id, created_at DESC);
CREATE INDEX idx_points_transactions_type ON points_transactions(user_id, transaction_type);

-- RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 9. CREATE DAILY_STATS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date
  stats_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Focus Stats
  total_focus_minutes INTEGER DEFAULT 0,
  focus_sessions_completed INTEGER DEFAULT 0,
  focus_sessions_canceled INTEGER DEFAULT 0,
  
  -- Block Stats
  total_blocks INTEGER DEFAULT 0,
  total_minutes_saved INTEGER DEFAULT 0,
  emergency_unlocks INTEGER DEFAULT 0,
  
  -- Points Stats
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  
  -- Streak
  had_focus_session BOOLEAN DEFAULT FALSE,
  streak_maintained BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, stats_date)
);

-- Indexes
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stats_date DESC);

-- RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON daily_stats FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 10. CREATE NOTIFICATION_TOKENS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  
  -- Device Info
  device_id TEXT,
  device_name TEXT,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX idx_notification_tokens_user ON notification_tokens(user_id, active);
CREATE INDEX idx_notification_tokens_token ON notification_tokens(token);

-- RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON notification_tokens FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 11. CREATE NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  
  -- Action
  action_screen TEXT,
  action_data JSONB,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(user_id, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL AND sent_at IS NOT NULL;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS FOR CLARITY
-- ============================================================

COMMENT ON TABLE app_limits IS 'Per-app daily time limits configured by users';
COMMENT ON TABLE app_usage_stats IS 'Daily app usage tracking (partitioned by month)';
COMMENT ON TABLE app_blocks IS 'Log of app block events with user responses';
COMMENT ON TABLE rewards_catalog IS 'Available rewards (admin-managed)';
COMMENT ON TABLE user_rewards IS 'User reward redemption history';
COMMENT ON TABLE points_transactions IS 'Immutable log of all points earned/spent';
COMMENT ON TABLE daily_stats IS 'Pre-aggregated daily statistics for performance';
COMMENT ON TABLE notification_tokens IS 'FCM/APNS push notification tokens';
COMMENT ON TABLE notifications IS 'Notification history and scheduled notifications';
