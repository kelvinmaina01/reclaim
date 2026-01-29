-- 0006_seed_rewards.sql
-- Seed the rewards catalog with initial rewards

-- ============================================================
-- IN-APP UNLOCKABLES
-- ============================================================

INSERT INTO rewards_catalog (name, description, category, cost_points, icon, partner_name, cause_name, enabled, stock_unlimited)
VALUES
  ('Ocean Theme', 'Transform your app with calming ocean colors and waves', 'in_app', 150, '🌊', NULL, NULL, TRUE, TRUE),
  ('Forest Theme', 'Earthy greens and nature-inspired design', 'in_app', 150, '🌲', NULL, NULL, TRUE, TRUE),
  ('Rain Sounds', 'Soothing rain ambience for focus sessions', 'in_app', 200, '🌧️', NULL, NULL, TRUE, TRUE),
  ('Café Ambience', 'Coffee shop sounds to enhance concentration', 'in_app', 200, '☕', NULL, NULL, TRUE, TRUE),
  ('Monthly AI Report', 'Detailed AI-powered productivity analysis', 'in_app', 300, '📊', NULL, NULL, TRUE, TRUE);

-- ============================================================
-- PARTNER REWARDS (MOCKED)
-- ============================================================

INSERT INTO rewards_catalog (name, description, category, cost_points, icon, partner_name, cause_name, enabled, stock_unlimited)
VALUES
  ('Coursera Course', 'Access to any Coursera course (1 month)', 'partner', 800, '🎓', 'Coursera', NULL, TRUE, TRUE),
  ('Notion Pro', 'Notion Pro subscription (1 month)', 'partner', 600, '📝', 'Notion', NULL, TRUE, TRUE),
  ('Audible Credit', 'One audiobook of your choice', 'partner', 700, '🎧', 'Audible', NULL, TRUE, TRUE),
  ('Headspace Premium', 'Headspace Premium (1 month)', 'partner', 500, '🧘', 'Headspace', NULL, TRUE, TRUE);

-- ============================================================
-- PURPOSE REWARDS (DONATIONS - MOCKED)
-- ============================================================

INSERT INTO rewards_catalog (name, description, category, cost_points, icon, partner_name, cause_name, enabled, stock_unlimited)
VALUES
  ('Support Education', 'Donate to Khan Academy to support free education', 'purpose', 500, '📚', NULL, 'Khan Academy', TRUE, TRUE),
  ('Sponsor Open Source', 'Support open source projects and developers', 'purpose', 400, '💻', NULL, 'Open Source', TRUE, TRUE),
  ('Plant Trees', 'Plant 10 trees through One Tree Planted', 'purpose', 300, '🌳', NULL, 'One Tree Planted', TRUE, TRUE);

-- Add comment
COMMENT ON TABLE rewards_catalog IS 'Seeded with 12 initial rewards: 5 in-app, 4 partner (mocked), 3 purpose (mocked)';
