-- 0002_rls_policies.sql
-- Row Level Security Policies for Reclaim App

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can only access their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Focus sessions policies: Users can manage their own sessions
CREATE POLICY "Users can view own focus sessions" 
  ON focus_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create focus sessions" 
  ON focus_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions" 
  ON focus_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- AI insights policies: Users can manage their own insights
CREATE POLICY "Users can view own insights" 
  ON ai_insights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create insights" 
  ON ai_insights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" 
  ON ai_insights FOR DELETE 
  USING (auth.uid() = user_id);
