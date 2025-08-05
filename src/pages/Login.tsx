import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Coffee, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, signIn, signUp } from '../lib/supabase';
import { useDetectionStore } from '../store/useDetectionStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();
  const { setUser, initializeData } = useDetectionStore();

  useEffect(() => {
    // 检查用户是否已登录
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          isAuthenticated: true,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          id: session.user.id,
        });
        await initializeData();
        navigate('/');
      }
    };
    
    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser({
          isAuthenticated: true,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          id: session.user.id,
        });
        await initializeData();
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUser, initializeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (data.user) {
          setMessage({ type: 'success', text: '登录成功！' });
        }
      } else {
        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: '密码确认不匹配' });
          return;
        }
        
        const { data, error } = await signUp(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else {
          setMessage({ 
            type: 'success', 
            text: '注册成功！请检查您的邮箱以验证账户。' 
          });
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '操作失败，请稍后重试' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // 游客模式，直接跳转到首页
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-500 to-coffee-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-coffee-600 rounded-full mb-4">
            <Coffee className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-coffee-950 mb-2">
            咖啡豆烘焙度检测
          </h1>
          <p className="text-coffee-600">
            {isLogin ? '欢迎回来' : '创建您的账户'}
          </p>
        </div>

        {/* 登录/注册表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="请输入您的邮箱"
                  required
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="请输入密码"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 确认密码（仅注册时显示） */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                    placeholder="请再次输入密码"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-600 text-white py-3 rounded-lg hover:bg-coffee-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          {/* 切换登录/注册 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-coffee-600 hover:text-coffee-800 text-sm font-medium"
            >
              {isLogin ? '还没有账户？立即注册' : '已有账户？立即登录'}
            </button>
          </div>

          {/* 游客访问 */}
          <div className="mt-6 pt-6 border-t border-coffee-100">
            <button
              onClick={handleGuestAccess}
              className="w-full bg-cream-200 text-coffee-800 py-3 rounded-lg hover:bg-cream-300 transition-colors font-medium"
            >
              游客模式体验
            </button>
            <p className="text-xs text-coffee-500 text-center mt-2">
              游客模式下数据仅保存在本地
            </p>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="text-center text-xs text-coffee-500 mt-8">
          <div>© 2024 咖啡豆烘焙度检测应用</div>
          <div className="mt-1">专业的咖啡烘焙检测解决方案</div>
        </div>
      </div>
    </div>
  );
}