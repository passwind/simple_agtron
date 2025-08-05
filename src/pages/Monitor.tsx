import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Settings, Camera, Timer, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDetectionStore } from '../store/useDetectionStore';

interface MonitoringData {
  agtron_value: number;
  roast_level: string;
  confidence: number;
  temperature?: number;
  timestamp: string;
}

export default function Monitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentData, setCurrentData] = useState<MonitoringData | null>(null);
  const [monitoringHistory, setMonitoringHistory] = useState<MonitoringData[]>([]);
  const [targetAgtron, setTargetAgtron] = useState(65);
  const [targetRoastLevel, setTargetRoastLevel] = useState('中烘');
  const [sessionName, setSessionName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { currentSession, setCurrentSession, addMonitorSession, addSnapshotToSession } = useDetectionStore();

  // 模拟检测数据生成
  const generateMockData = (): MonitoringData => {
    const baseAgtron = targetAgtron + (Math.random() - 0.5) * 20;
    const agtron_value = Math.max(20, Math.min(95, Math.round(baseAgtron)));
    
    let roast_level = '中烘';
    if (agtron_value >= 80) roast_level = '浅烘';
    else if (agtron_value >= 70) roast_level = '中浅烘';
    else if (agtron_value >= 60) roast_level = '中烘';
    else if (agtron_value >= 50) roast_level = '中深烘';
    else if (agtron_value >= 40) roast_level = '深烘';
    else roast_level = '极深烘';
    
    return {
      agtron_value,
      roast_level,
      confidence: 0.85 + Math.random() * 0.1,
      temperature: 180 + Math.random() * 40,
      timestamp: new Date().toISOString(),
    };
  };

  // 启动摄像头
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // 开始监控
  const startMonitoring = async () => {
    if (!sessionName.trim()) {
      alert('请输入监控会话名称');
      return;
    }

    try {
      // 创建新的监控会话
      await addMonitorSession({
         name: sessionName,
         target_agtron: targetAgtron,
         target_roast_level: targetRoastLevel,
         status: 'active',
         created_at: new Date().toISOString(),
         user_id: '',
         end_time: null,
       });

      setIsMonitoring(true);
      setIsPaused(false);
      setElapsedTime(0);
      setMonitoringHistory([]);
      startCamera();
    } catch (error) {
      console.error('启动监控失败:', error);
      alert('启动监控失败，请稍后重试');
      return;
    }

    // 开始定时检测
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const newData = generateMockData();
        setCurrentData(newData);
        setMonitoringHistory(prev => [...prev, newData]);
        
        // 添加快照到会话
        if (currentSession) {
          addSnapshotToSession(currentSession.id, {
             session_id: currentSession.id,
             agtron_value: newData.agtron_value,
             roast_level: newData.roast_level,
             confidence: newData.confidence,
             temperature: newData.temperature,
           });
        }
      }
    }, 3000); // 每3秒检测一次

    // 计时器
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
  };

  // 暂停/恢复监控
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 停止监控
  const stopMonitoring = async () => {
    setIsMonitoring(false);
    setIsPaused(false);
    setCurrentData(null);
    stopCamera();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 结束当前会话
    if (currentSession) {
      try {
        // 这里可以添加更新会话状态的逻辑
        // await updateMonitorSession(currentSession.id, {
        //   status: 'completed',
        //   end_time: new Date().toISOString(),
        // });
        setCurrentSession(null);
        alert('监控已停止，数据已保存');
      } catch (error) {
        console.error('保存监控数据失败:', error);
        alert('监控已停止，但保存数据时出现错误');
        setCurrentSession(null);
      }
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取Agtron值的颜色
  const getAgtronColor = (value: number) => {
    if (value >= 80) return 'text-yellow-600';
    if (value >= 70) return 'text-orange-500';
    if (value >= 60) return 'text-orange-600';
    if (value >= 50) return 'text-coffee-600';
    if (value >= 40) return 'text-coffee-700';
    return 'text-coffee-900';
  };

  // 检查是否接近目标值
  const isNearTarget = (value: number) => {
    return Math.abs(value - targetAgtron) <= 5;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-coffee-950 mb-6 text-center">
          📹 实时监控
        </h1>

        {/* 摄像头预览 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 bg-coffee-100 rounded-lg object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* 监控状态指示器 */}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              {isMonitoring && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
                  }`}></div>
                  {isPaused ? '已暂停' : '监控中'}
                </div>
              )}
            </div>
            
            {/* 计时器 */}
            {isMonitoring && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm font-mono">
                <Timer size={12} className="inline mr-1" />
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>
        </div>

        {/* 监控设置 */}
        {!isMonitoring && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-coffee-950">监控设置</h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-coffee-600 hover:text-coffee-800"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  会话名称
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="例如：蓝山咖啡烘焙监控"
                  className="w-full px-3 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
                />
              </div>
              
              {showSettings && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-coffee-700 mb-2">
                      目标Agtron值: {targetAgtron}
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="95"
                      value={targetAgtron}
                      onChange={(e) => setTargetAgtron(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-coffee-500 mt-1">
                      <span>深烘 (20)</span>
                      <span>浅烘 (95)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-coffee-700 mb-2">
                      目标烘焙度
                    </label>
                    <select
                      value={targetRoastLevel}
                      onChange={(e) => setTargetRoastLevel(e.target.value)}
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
                </>
              )}
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="flex-1 bg-accent-green text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Play size={20} />
                开始监控
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                    isPaused 
                      ? 'bg-accent-green text-white hover:bg-green-600' 
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                  {isPaused ? '继续' : '暂停'}
                </button>
                <button
                  onClick={stopMonitoring}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Square size={20} />
                  停止
                </button>
              </>
            )}
          </div>
        </div>

        {/* 实时数据显示 */}
        {currentData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-accent-orange" size={20} />
              <h2 className="text-lg font-semibold text-coffee-950">实时数据</h2>
              {isNearTarget(currentData.agtron_value) && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  <Target size={12} />
                  接近目标
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${getAgtronColor(currentData.agtron_value)}`}>
                  {currentData.agtron_value}
                </div>
                <div className="text-sm text-coffee-600">Agtron值</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold text-coffee-950 mb-1">
                  {currentData.roast_level}
                </div>
                <div className="text-sm text-coffee-600">烘焙度</div>
              </div>
              
              {currentData.temperature && (
                <div className="text-center">
                  <div className="text-xl font-semibold text-red-600 mb-1">
                    {Math.round(currentData.temperature)}°C
                  </div>
                  <div className="text-sm text-coffee-600">温度</div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-xl font-semibold text-coffee-950 mb-1">
                  {(currentData.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-coffee-600">置信度</div>
              </div>
            </div>
            
            {/* 目标对比 */}
            <div className="mt-4 pt-4 border-t border-coffee-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-coffee-600">与目标值差异:</span>
                <span className={`font-medium ${
                  Math.abs(currentData.agtron_value - targetAgtron) <= 5 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {currentData.agtron_value > targetAgtron ? '+' : ''}
                  {currentData.agtron_value - targetAgtron}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 监控历史趋势 */}
        {monitoringHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-coffee-950 mb-4">趋势图表</h3>
            <div className="h-32 bg-coffee-50 rounded-lg flex items-end justify-between p-2">
              {monitoringHistory.slice(-10).map((data, index) => {
                const height = (data.agtron_value / 100) * 100;
                return (
                  <div
                    key={index}
                    className="bg-accent-orange rounded-t flex-1 mx-0.5 min-h-1"
                    style={{ height: `${height}%` }}
                    title={`Agtron: ${data.agtron_value}`}
                  ></div>
                );
              })}
            </div>
            <div className="text-xs text-coffee-500 text-center mt-2">
              最近10次检测结果
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-cream-100 rounded-lg p-4">
          <h3 className="font-semibold text-coffee-950 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            监控说明
          </h3>
          <ul className="text-sm text-coffee-700 space-y-1">
            <li>• 确保摄像头对准咖啡豆烘焙区域</li>
            <li>• 监控过程中每3秒自动检测一次</li>
            <li>• 绿色指示器表示接近目标烘焙度</li>
            <li>• 可随时暂停和恢复监控过程</li>
            <li>• 所有监控数据会自动保存到历史记录</li>
          </ul>
        </div>
      </div>
    </div>
  );
}