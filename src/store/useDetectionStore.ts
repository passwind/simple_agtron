import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser, insertDetectionRecord, getDetectionRecords, deleteDetectionRecord, insertMonitorSession, updateMonitorSession, getMonitorSessions, insertMonitorSnapshot, getMonitorSnapshots } from '../lib/supabase';

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
  snapshots?: MonitorSnapshot[];
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

interface DetectionState {
  // 检测记录
  detectionRecords: DetectionRecord[];
  addDetectionRecord: (record: Omit<DetectionRecord, 'id' | 'created_at'>) => void;
  removeDetectionRecord: (id: string) => void;
  clearDetectionRecords: () => void;
  loadDetectionRecords: () => Promise<void>;
  
  // 监控会话
  monitorSessions: MonitorSession[];
  currentSession: MonitorSession | null;
  addMonitorSession: (session: Omit<MonitorSession, 'id' | 'start_time' | 'snapshots'>) => void;
  updateMonitorSession: (id: string, updates: Partial<MonitorSession>) => void;
  setCurrentSession: (session: MonitorSession | null) => void;
  addSnapshotToSession: (sessionId: string, snapshot: Omit<MonitorSnapshot, 'id' | 'timestamp'>) => void;
  loadMonitorSessions: () => Promise<void>;
  
  // 应用设置
  settings: {
    language: 'zh' | 'en';
    theme: 'light' | 'dark';
    autoSave: boolean;
    notifications: boolean;
    defaultRoastLevel: string;
  };
  updateSettings: (settings: Partial<DetectionState['settings']>) => void;
  
  // 用户状态
  user: {
    id?: string;
    email?: string;
    name?: string;
    isAuthenticated: boolean;
  };
  setUser: (user: DetectionState['user']) => void;
  logout: () => void;
  initializeData: () => Promise<void>;
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useDetectionStore = create<DetectionState>()(
  persist(
    (set, get) => ({
      // 初始状态
      detectionRecords: [],
      monitorSessions: [],
      currentSession: null,
      settings: {
        language: 'zh',
        theme: 'light',
        autoSave: true,
        notifications: true,
        defaultRoastLevel: '中烘',
      },
      user: {
        isAuthenticated: false,
      },

      // 检测记录操作
      addDetectionRecord: async (record) => {
        const { user } = await getCurrentUser();
        const newRecord = {
          ...record,
          user_id: user?.id,
        };
        
        const { data, error } = await insertDetectionRecord(newRecord);
        if (error) {
          console.error('Error saving detection record:', error);
          return;
        }
        
        if (data) {
           const formattedRecord: DetectionRecord = {
             id: data.id,
             user_id: data.user_id,
             image_url: data.image_url,
             agtron_value: data.agtron_value,
             roast_level: data.roast_level,
             confidence: data.confidence,
             suggestions: data.suggestions || '',
             created_at: data.created_at,
           };
           
           set((state) => ({
             detectionRecords: [formattedRecord, ...state.detectionRecords],
           }));
         }
      },

      removeDetectionRecord: async (id) => {
         const { error } = await deleteDetectionRecord(id);
         if (error) {
           console.error('Error deleting detection record:', error);
           return;
         }
         
         set((state) => ({
           detectionRecords: state.detectionRecords.filter(record => record.id !== id),
         }));
       },

       clearDetectionRecords: () => {
         set({ detectionRecords: [] });
       },

       loadDetectionRecords: async () => {
         const { user } = await getCurrentUser();
         const { data, error } = await getDetectionRecords(user?.id);
         if (error) {
           console.error('Error loading detection records:', error);
           return;
         }
         
         if (data) {
           const formattedRecords: DetectionRecord[] = data.map(record => ({
             id: record.id,
             user_id: record.user_id,
             image_url: record.image_url,
             agtron_value: record.agtron_value,
             roast_level: record.roast_level,
             confidence: record.confidence,
             suggestions: record.suggestions || '',
             created_at: record.created_at,
           }));
           
           set({ detectionRecords: formattedRecords });
         }
       },

      // 监控会话操作
      addMonitorSession: async (session) => {
        const { user } = await getCurrentUser();
        const newSession = {
          ...session,
          user_id: user?.id,
          start_time: new Date().toISOString(),
        };
        
        const { data, error } = await insertMonitorSession(newSession);
        if (error) {
          console.error('Error creating monitor session:', error);
          return;
        }
        
        if (data) {
          const formattedSession: MonitorSession = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            target_agtron: data.target_agtron,
            target_roast_level: data.target_roast_level,
            start_time: data.start_time,
            end_time: data.end_time,
            status: data.status,
            created_at: data.created_at,
            snapshots: [],
          };
          
          set((state) => ({
            monitorSessions: [formattedSession, ...state.monitorSessions],
            currentSession: formattedSession,
          }));
        }
      },

      updateMonitorSession: async (id, updates) => {
        const { data, error } = await updateMonitorSession(id, updates);
        if (error) {
          console.error('Error updating monitor session:', error);
          return;
        }
        
        if (data) {
          set((state) => ({
            monitorSessions: state.monitorSessions.map((session) =>
              session.id === id ? { ...session, ...updates } : session
            ),
            currentSession: state.currentSession?.id === id 
              ? { ...state.currentSession, ...updates }
              : state.currentSession,
          }));
        }
      },

      setCurrentSession: (session) => {
        set({ currentSession: session });
      },

      addSnapshotToSession: async (sessionId, snapshot) => {
        const newSnapshot = {
          ...snapshot,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        };
        
        const { data, error } = await insertMonitorSnapshot(newSnapshot);
        if (error) {
          console.error('Error adding snapshot to session:', error);
          return;
        }
        
        if (data) {
          const formattedSnapshot: MonitorSnapshot = {
            id: data.id,
            session_id: data.session_id,
            agtron_value: data.agtron_value,
            roast_level: data.roast_level,
            temperature: data.temperature,
            confidence: data.confidence,
            timestamp: data.timestamp,
          };
          
          set((state) => ({
            monitorSessions: state.monitorSessions.map((session) =>
              session.id === sessionId
                ? { ...session, snapshots: [...(session.snapshots || []), formattedSnapshot] }
                : session
            ),
          }));
          
          // 如果是当前会话，也更新当前会话状态
          const currentSession = get().currentSession;
          if (currentSession && currentSession.id === sessionId) {
            set({
              currentSession: {
                ...currentSession,
                snapshots: [...(currentSession.snapshots || []), formattedSnapshot],
              },
            });
          }
        }
      },

      loadMonitorSessions: async () => {
        const { user } = await getCurrentUser();
        const { data, error } = await getMonitorSessions(user?.id);
        if (error) {
          console.error('Error loading monitor sessions:', error);
          return;
        }
        
        if (data) {
          const formattedSessions: MonitorSession[] = data.map(session => ({
            id: session.id,
            user_id: session.user_id,
            name: session.name,
            target_agtron: session.target_agtron,
            target_roast_level: session.target_roast_level,
            start_time: session.start_time,
            end_time: session.end_time,
            status: session.status,
            created_at: session.created_at,
            snapshots: [],
          }));
          
          set({ monitorSessions: formattedSessions });
        }
      },

      // 设置操作
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // 用户操作
      setUser: (user) => {
        set({ user });
      },

      logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error signing out:', error);
        }
        
        set({
          user: { isAuthenticated: false },
          currentSession: null,
        });
      },

      // 初始化数据
      initializeData: async () => {
        const { user } = await getCurrentUser();
        if (user) {
          set({
            user: {
              isAuthenticated: true,
              email: user.email || '',
              name: user.user_metadata?.name || user.email || '',
              id: user.id,
            },
          });
          
          // 加载用户数据
          const store = get();
          await store.loadDetectionRecords();
          await store.loadMonitorSessions();
        }
      },
    }),
    {
      name: 'coffee-detection-store',
      partialize: (state) => ({
        detectionRecords: state.detectionRecords,
        monitorSessions: state.monitorSessions,
        settings: state.settings,
        user: state.user,
      }),
    }
  )
);

// 选择器函数
export const useDetectionRecords = () => useDetectionStore((state) => state.detectionRecords);
export const useMonitorSessions = () => useDetectionStore((state) => state.monitorSessions);
export const useCurrentSession = () => useDetectionStore((state) => state.currentSession);
export const useSettings = () => useDetectionStore((state) => state.settings);
export const useUser = () => useDetectionStore((state) => state.user);
export const useDetectionActions = () => useDetectionStore((state) => ({
  addDetectionRecord: state.addDetectionRecord,
  removeDetectionRecord: state.removeDetectionRecord,
  clearDetectionRecords: state.clearDetectionRecords,
  loadDetectionRecords: state.loadDetectionRecords,
  addMonitorSession: state.addMonitorSession,
  updateMonitorSession: state.updateMonitorSession,
  setCurrentSession: state.setCurrentSession,
  addSnapshotToSession: state.addSnapshotToSession,
  loadMonitorSessions: state.loadMonitorSessions,
  updateSettings: state.updateSettings,
  setUser: state.setUser,
  logout: state.logout,
  initializeData: state.initializeData
}));

// 计算属性
export const useDetectionStats = () => {
  const records = useDetectionStore((state) => state.detectionRecords);
  
  const totalDetections = records.length;
  
  if (totalDetections === 0) {
    return {
      totalDetections: 0,
      averageAgtron: 0,
      mostCommonRoastLevel: '',
      averageConfidence: 0,
    };
  }
  
  const averageAgtron = records.reduce((sum, record) => sum + record.agtron_value, 0) / totalDetections;
  const averageConfidence = records.reduce((sum, record) => sum + record.confidence, 0) / totalDetections;
  
  // 统计最常见的烘焙度
  const roastLevelCounts = records.reduce((counts, record) => {
    counts[record.roast_level] = (counts[record.roast_level] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const mostCommonRoastLevel = Object.entries(roastLevelCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
  
  return {
    totalDetections,
    averageAgtron: Math.round(averageAgtron * 10) / 10,
    mostCommonRoastLevel,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
  };
};