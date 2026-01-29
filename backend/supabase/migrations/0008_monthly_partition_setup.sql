-- 0008_monthly_partition_setup.sql
-- Setup automatic partition creation for app_usage_stats

-- Function to create next month's partition
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS VOID AS $$
DECLARE
  next_month_start DATE;
  next_month_end DATE;
  partition_name TEXT;
BEGIN
  -- Calculate next month
  next_month_start := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  next_month_end := next_month_start + INTERVAL '1 month';
  partition_name := 'app_usage_stats_' || TO_CHAR(next_month_start, 'YYYY_MM');
  
  -- Create partition if it doesn't exist
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF app_usage_stats FOR VALUES FROM (%L) TO (%L)',
    partition_name, next_month_start, next_month_end
  );
  
  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Create partitions for the next 12 months
DO $$
DECLARE
  month_iter INTEGER;
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR month_iter IN 0..11 LOOP
    start_date := DATE_TRUNC('month', CURRENT_DATE) + (month_iter || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'app_usage_stats_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF app_usage_stats FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    
    RAISE NOTICE 'Created/verified partition: %', partition_name;
  END LOOP;
END $$;

-- Note: To automate partition creation, use Supabase Cron or pg_cron
-- Example cron job (run monthly on the 1st):
-- SELECT cron.schedule('create-monthly-partition', '0 0 1 * *', 'SELECT create_next_month_partition()');

COMMENT ON FUNCTION create_next_month_partition IS 'Creates next month partition for app_usage_stats. Can be scheduled via cron.';
