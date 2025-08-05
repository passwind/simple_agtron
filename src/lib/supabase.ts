import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://planncvtdlucnxgjrqbk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYW5uY3Z0ZGx1Y254Z2pycWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTM1NDMsImV4cCI6MjA2OTg4OTU0M30.UqtAV6xEjPvHWyCs8LQJomP3F21qZ7kGJVa8uaOBxoM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DetectionRecord {
  id: string;
  user_id?: string;
  image_url: string;
  agtron_value: number;
  roast_level: string;
  confidence: number;
  suggestions: string;
  created_at: string;
}

export interface MonitorSession {
  id: string;
  user_id?: string;
  name: string;
  target_agtron: number;
  target_roast_level: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

export interface MonitorSnapshot {
  id: string;
  session_id: string;
  agtron_value: number;
  roast_level: string;
  temperature?: number;
  confidence: number;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  preferences: {
    default_roast_level: string;
    notifications: boolean;
    auto_save: boolean;
    language: string;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Database helpers
export const insertDetectionRecord = async (record: Omit<DetectionRecord, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('detection_records')
    .insert(record)
    .select()
    .single();
  return { data, error };
};

export const getDetectionRecords = async (userId?: string) => {
  let query = supabase
    .from('detection_records')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const deleteDetectionRecord = async (id: string) => {
  const { error } = await supabase
    .from('detection_records')
    .delete()
    .eq('id', id);
  return { error };
};

export const insertMonitorSession = async (session: Omit<MonitorSession, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('monitor_sessions')
    .insert(session)
    .select()
    .single();
  return { data, error };
};

export const updateMonitorSession = async (id: string, updates: Partial<MonitorSession>) => {
  const { data, error } = await supabase
    .from('monitor_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const getMonitorSessions = async (userId?: string) => {
  let query = supabase
    .from('monitor_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  return { data, error };
};

export const insertMonitorSnapshot = async (snapshot: Omit<MonitorSnapshot, 'id'>) => {
  const { data, error } = await supabase
    .from('monitor_snapshots')
    .insert(snapshot)
    .select()
    .single();
  return { data, error };
};

export const getMonitorSnapshots = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('monitor_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const createUserProfile = async (profile: Omit<UserProfile, 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();
  return { data, error };
};