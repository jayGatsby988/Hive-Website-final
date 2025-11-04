-- CREATE PROFILES TABLE IF IT DOESN'T EXIST
-- Run this FIRST before the other SQL

-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

-- Backfill profiles for existing users
INSERT INTO profiles (id, email, name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read profiles (for showing user names)
CREATE POLICY "allow_all_read_profiles" 
ON profiles FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "allow_users_update_own_profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Verify
SELECT 
  'PROFILES TABLE' as status,
  COUNT(*) as total_profiles
FROM profiles;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Profiles table created and populated!';
  RAISE NOTICE 'You can now run the main fix script';
END $$;

