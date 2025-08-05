import { Link } from 'react-router-dom';
import { Camera, Video, History, Settings, Coffee, TrendingUp, BarChart3, Clock, User } from 'lucide-react';
import { useDetectionStore, useDetectionRecords } from '../store/useDetectionStore';
import { useEffect, useMemo } from 'react';

export default function Home() {
  const { user } = useDetectionStore();
  const { loadDetectionRecords, loadMonitorSessions } = useDetectionStore();
  const detectionRecords = useDetectionRecords();
  
  const stats = useMemo(() => {
    const totalDetections = detectionRecords.length;
    
    if (totalDetections === 0) {
      return {
        totalDetections: 0,
        averageAgtron: 0,
        mostCommonRoastLevel: '',
        averageConfidence: 0,
      };
    }
    
    const averageAgtron = detectionRecords.reduce((sum, record) => sum + record.agtron_value, 0) / totalDetections;
    const averageConfidence = detectionRecords.reduce((sum, record) => sum + record.confidence, 0) / totalDetections;
    
    // 统计最常见的烘焙度
    const roastLevelCounts = detectionRecords.reduce((counts, record) => {
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
  }, [detectionRecords]);

  useEffect(() => {
    // 如果用户已登录，加载数据
    if (user.isAuthenticated) {
      loadDetectionRecords();
      loadMonitorSessions();
    }
  }, [user.isAuthenticated, loadDetectionRecords, loadMonitorSessions]);
  const features = [
    {
      title: '图片检测',
      description: '拍照或上传图片检测咖啡豆Agtron值',
      icon: Camera,
      path: '/detect',
      color: 'bg-gradient-to-br from-accent-orange to-orange-600',
    },
    {
      title: '实时监控',
      description: '摄像头实时监控烘焙过程',
      icon: Video,
      path: '/monitor',
      color: 'bg-gradient-to-br from-coffee-700 to-coffee-900',
    },
    {
      title: '历史记录',
      description: '查看检测历史和数据分析',
      icon: History,
      path: '/history',
      color: 'bg-gradient-to-br from-accent-green to-green-600',
    },
    {
      title: '设置',
      description: '配置检测参数和用户偏好',
      icon: Settings,
      path: '/settings',
      color: 'bg-gradient-to-br from-coffee-600 to-coffee-800',
    },
  ];

  return (
    <div className="p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* 应用介绍 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">☕️</div>
          <h1 className="text-2xl font-bold text-coffee-950 mb-2">
            咖啡豆烘焙度检测
          </h1>
          <p className="text-coffee-700 text-sm leading-relaxed">
            通过AI图像识别技术精确检测咖啡豆的Agtron烘焙度值，
            帮助您提升烘焙质量和一致性
          </p>
          
          {/* 用户欢迎信息 */}
          {user.isAuthenticated && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-coffee-700">
                <User size={16} />
                <span className="text-sm font-medium">欢迎回来，{user.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {user.isAuthenticated && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-coffee-950 mb-4 text-center">
              数据统计
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="text-accent-orange" size={16} />
                </div>
                <div className="text-lg font-bold text-coffee-950">{stats.totalDetections}</div>
                <div className="text-xs text-coffee-600">总检测次数</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="text-accent-green" size={16} />
                </div>
                <div className="text-lg font-bold text-coffee-950">{stats.averageAgtron}</div>
                 <div className="text-xs text-coffee-600">平均Agtron值</div>
               </div>
               <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                 <div className="flex items-center justify-center mb-1">
                   <Clock className="text-coffee-600" size={16} />
                 </div>
                 <div className="text-lg font-bold text-coffee-950">{stats.mostCommonRoastLevel}</div>
                 <div className="text-xs text-coffee-600">常见烘焙度</div>
              </div>
            </div>
          </div>
        )}

        {/* 快速检测入口 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-coffee-950 mb-4 text-center">
            快速开始
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/detect"
              className="bg-white rounded-xl p-6 shadow-lg border-2 border-accent-orange hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-accent-orange rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-coffee-950 mb-1">拍照检测</h3>
                <p className="text-xs text-coffee-600">快速检测单张图片</p>
              </div>
            </Link>
            
            <Link
              to="/monitor"
              className="bg-white rounded-xl p-6 shadow-lg border-2 border-coffee-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-coffee-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-coffee-950 mb-1">实时监控</h3>
                <p className="text-xs text-coffee-600">监控烘焙过程</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 功能模块 */}
        <div>
          <h2 className="text-lg font-semibold text-coffee-950 mb-4 text-center">
            全部功能
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.path}
                  to={feature.path}
                  className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <h3 className="font-semibold text-coffee-950 text-sm mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-coffee-600 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-coffee-500">
            专业的咖啡烘焙辅助工具 · 提升烘焙质量
          </p>
        </div>
      </div>
    </div>
  );
}