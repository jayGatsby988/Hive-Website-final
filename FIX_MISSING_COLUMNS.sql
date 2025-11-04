-- Fix missing columns in volunteer_sessions table
-- Run this in Supabase SQL Editor

-- Add created_at column if it doesn't exist
ALTER TABLE volunteer_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at column if it doesn't exist
ALTER TABLE volunteer_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set created_at for existing rows that don't have it
UPDATE volunteer_sessions 
SET created_at = started_at 
WHERE created_at IS NULL;

-- Set updated_at for existing rows that don't have it
UPDATE volunteer_sessions 
SET updated_at = COALESCE(ended_at, started_at)
WHERE updated_at IS NULL;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_volunteer_sessions_updated_at ON volunteer_sessions;

-- Create trigger
CREATE TRIGGER update_volunteer_sessions_updated_at
BEFORE UPDATE ON volunteer_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verify columns exist now
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'volunteer_sessions'
AND column_name IN ('created_at', 'updated_at', 'started_at', 'ended_at', 'status', 'user_id', 'event_id')
ORDER BY column_name;

-- Should show all 7 columns

