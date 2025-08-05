-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "default_roast_level": "中烘",
    "notifications": true,
    "auto_save": true,
    "language": "zh",
    "theme": "light"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create detection_records table
CREATE TABLE detection_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  agtron_value NUMERIC(5,2) NOT NULL,
  roast_level TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitor_sessions table
CREATE TABLE monitor_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  target_agtron NUMERIC(5,2) NOT NULL,
  target_roast_level TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitor_snapshots table
CREATE TABLE monitor_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES monitor_sessions(id) ON DELETE CASCADE,
  agtron_value NUMERIC(5,2) NOT NULL,
  roast_level TEXT NOT NULL,
  temperature NUMERIC(5,2),
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_detection_records_user_id ON detection_records(user_id);
CREATE INDEX idx_detection_records_created_at ON detection_records(created_at DESC);
CREATE INDEX idx_monitor_sessions_user_id ON monitor_sessions(user_id);
CREATE INDEX idx_monitor_sessions_status ON monitor_sessions(status);
CREATE INDEX idx_monitor_snapshots_session_id ON monitor_snapshots(session_id);
CREATE INDEX idx_monitor_snapshots_timestamp ON monitor_snapshots(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for detection_records
CREATE POLICY "Users can view own detection records" ON detection_records
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own detection records" ON detection_records
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own detection records" ON detection_records
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own detection records" ON detection_records
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for monitor_sessions
CREATE POLICY "Users can view own monitor sessions" ON monitor_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own monitor sessions" ON monitor_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own monitor sessions" ON monitor_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own monitor sessions" ON monitor_sessions
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for monitor_snapshots
CREATE POLICY "Users can view snapshots of own sessions" ON monitor_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monitor_sessions 
      WHERE monitor_sessions.id = monitor_snapshots.session_id 
      AND (monitor_sessions.user_id = auth.uid() OR monitor_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert snapshots to own sessions" ON monitor_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM monitor_sessions 
      WHERE monitor_sessions.id = monitor_snapshots.session_id 
      AND (monitor_sessions.user_id = auth.uid() OR monitor_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update snapshots of own sessions" ON monitor_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM monitor_sessions 
      WHERE monitor_sessions.id = monitor_snapshots.session_id 
      AND (monitor_sessions.user_id = auth.uid() OR monitor_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can delete snapshots of own sessions" ON monitor_snapshots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM monitor_sessions 
      WHERE monitor_sessions.id = monitor_snapshots.session_id 
      AND (monitor_sessions.user_id = auth.uid() OR monitor_sessions.user_id IS NULL)
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON detection_records TO authenticated;
GRANT ALL ON monitor_sessions TO authenticated;
GRANT ALL ON monitor_snapshots TO authenticated;

-- Grant permissions to anonymous users for guest functionality
GRANT SELECT, INSERT, UPDATE, DELETE ON detection_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_snapshots TO anon;