import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Video, History, Settings, User, LogOut } from 'lucide-react';
import { useDetectionStore } from '../store/useDetectionStore';
import { signOut } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useDetectionStore();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/detect', icon: Camera, label: '检测' },
    { path: '/monitor', icon: Video, label: '监控' },
    { path: '/history', icon: History, label: '历史' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream-500 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-coffee-950 text-white p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            ☕️ 咖啡豆烘焙度检测
          </h1>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 底部导航 */}
        <nav className="bg-white border-t border-coffee-200">
          {/* 用户状态栏 */}
          {user.isAuthenticated && (
            <div className="px-4 py-2 bg-coffee-50 border-b border-coffee-100">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-coffee-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={14} />
                  </div>
                  <span className="text-sm text-coffee-700 font-medium">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-coffee-500 hover:text-coffee-700 transition-colors"
                >
                  <LogOut size={14} />
                  <span>退出</span>
                </button>
              </div>
            </div>
          )}

          {/* 主导航 */}
          <div className="px-4 py-2">
            <div className="flex justify-around items-center max-w-md mx-auto">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-accent-orange bg-accent-orange/10'
                        : 'text-coffee-600 hover:text-accent-orange hover:bg-accent-orange/5'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs mt-1 font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 游客模式提示 */}
          {!user.isAuthenticated && (
            <div className="px-4 py-2 bg-cream-100 border-t border-coffee-100">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-coffee-600">
                    游客模式 - 数据仅保存在本地
                  </span>
                  <Link
                    to="/login"
                    className="text-xs text-accent-orange hover:text-accent-orange/80 font-medium"
                  >
                    登录
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
    </div>
  );
}