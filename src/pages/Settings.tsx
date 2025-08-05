import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Palette, 
  Globe, 
  Camera, 
  Target, 
  Clock, 
  Download, 
  Upload,
  Trash2,
  RefreshCw,
  User,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react';
import { useDetectionStore, useSettings, useUser } from '../store/useDetectionStore';
import { signOut } from '../lib/supabase';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const settings = useSettings();
  const user = useUser();
  const { updateSettings, logout, clearDetectionRecords } = useDetectionStore();
  const { loadDetectionRecords } = useDetectionStore();

  useEffect(() => {
    // 如果用户已登录，加载数据
    if (user.isAuthenticated) {
      loadDetectionRecords();
    }
  }, [user.isAuthenticated, loadDetectionRecords]);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleExportData = () => {
    const data = {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `咖啡检测设置_${new Date().toLocaleDateString('zh-CN')}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          updateSettings(data.settings);
          alert('设置导入成功！');
        } else {
          alert('无效的设置文件格式');
        }
      } catch (error) {
        alert('设置文件解析失败');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      updateSettings({
        language: 'zh',
        theme: 'light',
        autoSave: true,
        notifications: true,
        defaultRoastLevel: '中烘',
      });
      alert('设置已重置为默认值');
    }
  };

  const handleClearAllData = () => {
    if (confirm('确定要清空所有检测记录吗？此操作不可恢复。')) {
      clearDetectionRecords();
      alert('所有检测记录已清空');
    }
  };

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      try {
        await signOut();
        logout();
        alert('已退出登录');
      } catch (error) {
        console.error('退出登录失败:', error);
        alert('退出登录失败，请稍后重试');
      }
    }
  };

  const SettingSection = ({ 
    title, 
    icon: Icon, 
    children, 
    sectionKey 
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
    sectionKey: string;
  }) => {
    const isActive = activeSection === sectionKey;
    
    return (
      <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
        <button
          onClick={() => setActiveSection(isActive ? null : sectionKey)}
          className="w-full p-4 flex items-center justify-between hover:bg-coffee-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="text-coffee-600" size={20} />
            <span className="font-semibold text-coffee-950">{title}</span>
          </div>
          <ChevronRight 
            className={`text-coffee-400 transition-transform ${
              isActive ? 'rotate-90' : ''
            }`} 
            size={20} 
          />
        </button>
        
        {isActive && (
          <div className="px-4 pb-4 border-t border-coffee-100">
            {children}
          </div>
        )}
      </div>
    );
  };

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium text-coffee-950">{label}</div>
        {description && (
          <div className="text-sm text-coffee-600 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-accent-green' : 'bg-coffee-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-coffee-950 mb-6 text-center">
          ⚙️ 设置
        </h1>

        {/* 用户信息 */}
        {user.isAuthenticated && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-coffee-100 rounded-full flex items-center justify-center">
                <User className="text-coffee-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-coffee-950">
                  {user.name || user.email || '用户'}
                </div>
                <div className="text-sm text-coffee-600">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        )}

        {/* 检测参数设置 */}
        <SettingSection title="检测参数" icon={Target} sectionKey="detection">
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                默认目标烘焙度
              </label>
              <select
                value={settings.defaultRoastLevel}
                onChange={(e) => handleSettingChange('defaultRoastLevel', e.target.value)}
                className="w-full px-3 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
              >
                <option value="极浅烘">极浅烘</option>
                <option value="浅烘">浅烘</option>
                <option value="中浅烘">中浅烘</option>
                <option value="中烘">中烘</option>
                <option value="中深烘">中深烘</option>
                <option value="深烘">深烘</option>
                <option value="极深烘">极深烘</option>
              </select>
            </div>
            
            <ToggleSwitch
              checked={settings.autoSave}
              onChange={(checked) => handleSettingChange('autoSave', checked)}
              label="自动保存检测结果"
              description="检测完成后自动保存到历史记录"
            />
          </div>
        </SettingSection>

        {/* 通知设置 */}
        <SettingSection title="通知设置" icon={Bell} sectionKey="notifications">
          <div className="space-y-4 pt-4">
            <ToggleSwitch
              checked={settings.notifications}
              onChange={(checked) => handleSettingChange('notifications', checked)}
              label="推送通知"
              description="接收检测完成和监控提醒"
            />
            
            <div className="bg-cream-100 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="text-coffee-600 mt-0.5" size={16} />
                <div className="text-sm text-coffee-700">
                  <div className="font-medium mb-1">通知权限</div>
                  <div>需要在浏览器设置中允许通知权限才能接收推送消息。</div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* 界面设置 */}
        <SettingSection title="界面设置" icon={Palette} sectionKey="interface">
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                主题模式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSettingChange('theme', 'light')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'light'
                      ? 'border-accent-orange bg-orange-50'
                      : 'border-coffee-200 hover:border-coffee-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-coffee-950">浅色模式</div>
                    <div className="text-xs text-coffee-600 mt-1">默认主题</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-accent-orange bg-orange-50'
                      : 'border-coffee-200 hover:border-coffee-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-coffee-950">深色模式</div>
                    <div className="text-xs text-coffee-600 mt-1">即将推出</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                语言设置
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
              >
                <option value="zh">中文</option>
                <option value="en">English (即将推出)</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* 数据管理 */}
        <SettingSection title="数据管理" icon={Download} sectionKey="data">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="bg-coffee-600 text-white py-2 px-3 rounded-lg hover:bg-coffee-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                导出设置
              </button>
              
              <label className="bg-accent-green text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer">
                <Upload size={16} />
                导入设置
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="border-t border-coffee-100 pt-4">
              <button
                onClick={handleResetSettings}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <RefreshCw size={16} />
                重置设置
              </button>
              
              <button
                onClick={handleClearAllData}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                清空所有数据
              </button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="text-yellow-600 mt-0.5" size={16} />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">数据安全提醒</div>
                  <div>清空数据操作不可恢复，建议在操作前先导出备份。</div>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* 关于应用 */}
        <SettingSection title="关于应用" icon={Info} sectionKey="about">
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <div className="text-6xl mb-4">☕</div>
              <div className="text-lg font-semibold text-coffee-950 mb-2">
                咖啡豆烘焙度检测
              </div>
              <div className="text-sm text-coffee-600 mb-4">
                版本 1.0.0
              </div>
            </div>
            
            <div className="bg-cream-100 rounded-lg p-4">
              <h3 className="font-semibold text-coffee-950 mb-2">功能特色</h3>
              <ul className="text-sm text-coffee-700 space-y-1">
                <li>• 智能图像识别检测咖啡豆烘焙度</li>
                <li>• 实时监控烘焙过程</li>
                <li>• 详细的历史记录和数据分析</li>
                <li>• 个性化设置和偏好管理</li>
                <li>• 数据导出和备份功能</li>
              </ul>
            </div>
            
            <div className="bg-coffee-50 rounded-lg p-4">
              <h3 className="font-semibold text-coffee-950 mb-2">技术支持</h3>
              <div className="text-sm text-coffee-700 space-y-1">
                <div>基于先进的机器学习算法</div>
                <div>支持多种咖啡豆品种识别</div>
                <div>持续优化检测精度</div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* 版权信息 */}
        <div className="text-center text-xs text-coffee-500 mt-8 pb-4">
          <div>© 2024 咖啡豆烘焙度检测应用</div>
          <div className="mt-1">专业的咖啡烘焙检测解决方案</div>
        </div>
      </div>
    </div>
  );
}