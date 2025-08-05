import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Save, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDetectionStore } from '../store/useDetectionStore';

interface DetectionResult {
  agtron_value: number;
  roast_level: string;
  confidence: number;
  suggestions: string;
}

export default function Detect() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 调试信息
  console.log('当前selectedImage状态:', selectedImage ? '已设置' : '未设置');
  
  // 环境检测
  useEffect(() => {
    console.log('=== 环境检测开始 ===');
    
    // 检查浏览器支持
    const browserSupport = {
      FileReader: typeof FileReader !== 'undefined',
      createObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
      revokeObjectURL: typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function',
      Image: typeof Image !== 'undefined'
    };
    
    console.log('浏览器支持情况:', browserSupport);
    
    // 检查 CSP 策略
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testUrl = URL.createObjectURL(testBlob);
      console.log('CSP 测试 - 创建 Blob URL 成功:', testUrl);
      URL.revokeObjectURL(testUrl);
    } catch (error) {
      console.error('CSP 测试 - 创建 Blob URL 失败:', error);
    }
    
    // 检查用户代理
    console.log('用户代理:', navigator.userAgent);
    
    console.log('=== 环境检测完成 ===');
  }, []);

  // 模拟检测API调用
  const simulateDetection = async (): Promise<DetectionResult> => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟检测结果
    const mockResults = [
      {
        agtron_value: 65,
        roast_level: '中烘',
        confidence: 0.92,
        suggestions: '适合制作手冲咖啡，建议研磨度为中粗'
      },
      {
        agtron_value: 45,
        roast_level: '中深烘',
        confidence: 0.88,
        suggestions: '苦甜平衡，适合制作意式浓缩咖啡'
      },
      {
        agtron_value: 75,
        roast_level: '浅烘',
        confidence: 0.95,
        suggestions: '明亮的酸味，果香突出，适合手冲或虹吸壶'
      }
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  };

  // HEIC转换为JPEG的函数
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // 创建一个canvas来处理图片转换
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 设置canvas尺寸
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // 绘制图片到canvas
        ctx?.drawImage(img, 0, 0);
        
        // 转换为JPEG blob
        canvas.toBlob((blob) => {
          if (blob) {
            // 创建新的File对象
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log('HEIC转换成功:', convertedFile);
            resolve(convertedFile);
          } else {
            reject(new Error('转换失败'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      // 使用FileReader读取HEIC文件
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('=== 开始处理文件 ===');
      console.log('选择的文件:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // 检查文件大小 (限制为10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('文件过大:', file.size);
        setError('图片文件过大，请选择小于10MB的图片');
        return;
      }
      
      let processedFile = file;
      
      // 检查文件类型
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      const heicTypes = ['image/heic', 'image/heif'];
      
      if (file.type && heicTypes.includes(file.type.toLowerCase())) {
        console.log('检测到HEIC格式，开始转换...');
        setError('检测到HEIC格式，正在转换为JPEG...');
        
        try {
          processedFile = await convertHeicToJpeg(file);
          setError(null);
          console.log('HEIC转换完成:', processedFile);
        } catch (error) {
          console.error('HEIC转换失败:', error);
          setError('HEIC格式转换失败。请尝试使用其他图片编辑软件将图片转换为JPG或PNG格式后重新上传');
          return;
        }
      } else if (!file.type || !validImageTypes.includes(file.type.toLowerCase())) {
        console.error('不支持的文件类型:', file.type);
        setError(`不支持的文件类型: ${file.type || '未知'}。支持的格式：JPG、PNG、GIF、WebP、BMP。HEIC格式将自动转换为JPEG`);
        return;
      }
      
      // 尝试使用 URL.createObjectURL 作为主要方法
      try {
        console.log('尝试使用 URL.createObjectURL...');
        const objectUrl = URL.createObjectURL(processedFile);
        console.log('URL.createObjectURL 成功:', objectUrl);
        
        // 预加载图片以验证其有效性
        const testImg = new Image();
        testImg.onload = () => {
          console.log('图片预加载成功:', {
            width: testImg.naturalWidth,
            height: testImg.naturalHeight,
            url: objectUrl
          });
          setImageLoading(true);
          setImageLoadError(false);
          setSelectedImage(objectUrl);
          setDetectionResult(null);
          setError(null);
        };
        
        testImg.onerror = (e) => {
          console.error('图片预加载失败，尝试 FileReader 方法:', e);
          URL.revokeObjectURL(objectUrl);
          // 回退到 FileReader 方法
          useFileReader(processedFile);
        };
        
        testImg.src = objectUrl;
        
      } catch (error) {
        console.error('URL.createObjectURL 失败，使用 FileReader:', error);
        useFileReader(processedFile);
      }
    }
  };
  
  // FileReader 备选方法
  const useFileReader = (file: File) => {
    console.log('使用 FileReader 方法...');
    const reader = new FileReader();
    
    reader.onload = (e) => {
       const result = e.target?.result;
       if (result && typeof result === 'string') {
         console.log('FileReader成功读取图片:', {
           dataUrlLength: result.length,
           mimeType: result.split(',')[0],
           preview: result.substring(0, 100) + '...'
         });
         
         // 验证base64数据格式
         if (result.startsWith('data:image/')) {
           // 预加载验证
           const testImg = new Image();
           testImg.onload = () => {
             console.log('FileReader 图片验证成功');
             setImageLoading(true);
             setImageLoadError(false);
             setSelectedImage(result);
             setDetectionResult(null);
             setError(null);
           };
           testImg.onerror = (e) => {
             console.error('FileReader 图片验证失败:', e);
             setError('图片数据损坏或格式不支持');
           };
           testImg.src = result;
         } else {
           console.error('无效的图片数据格式:', result.substring(0, 100));
           setError('图片格式不支持，请选择JPG、PNG或其他常见格式');
         }
       } else {
         console.error('FileReader返回空结果');
         setError('图片读取失败，请重试');
       }
     };
    
    reader.onerror = (error) => {
      console.error('FileReader错误:', error);
      setError('图片读取失败，请重试');
    };
    
    reader.onabort = () => {
      console.error('FileReader被中断');
      setError('图片读取被中断，请重试');
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('启动FileReader失败:', error);
      setError('图片读取失败，请重试');
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      setError('请先选择或拍摄一张图片');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const result = await simulateDetection();
      setDetectionResult(result);
    } catch (err) {
      setError('检测失败，请重试');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleReset = () => {
    // 清理 URL.createObjectURL 创建的对象URL
    if (selectedImage && selectedImage.startsWith('blob:')) {
      console.log('清理对象URL:', selectedImage);
      URL.revokeObjectURL(selectedImage);
    }
    
    setSelectedImage(null);
    setDetectionResult(null);
    setError(null);
    setImageLoading(false);
    setImageLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    
    console.log('=== 重置完成 ===');
  };

  const addDetectionRecord = useDetectionStore((state) => state.addDetectionRecord);

  const handleSave = async () => {
    if (detectionResult && selectedImage) {
      try {
        await addDetectionRecord({
           image_url: selectedImage,
           agtron_value: detectionResult.agtron_value,
           roast_level: detectionResult.roast_level,
           confidence: detectionResult.confidence,
           suggestions: detectionResult.suggestions,
         });
        alert('检测记录已保存！');
      } catch (error) {
        console.error('保存记录失败:', error);
        alert('保存记录失败，请稍后重试');
      }
    }
  };

  const handleShare = () => {
    if (detectionResult) {
      const shareText = `咖啡豆检测结果：Agtron值 ${detectionResult.agtron_value}，烘焙度 ${detectionResult.roast_level}，置信度 ${(detectionResult.confidence * 100).toFixed(1)}%`;
      if (navigator.share) {
        navigator.share({
          title: '咖啡豆烘焙度检测结果',
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        alert('检测结果已复制到剪贴板！');
      }
    }
  };

  const getRoastLevelColor = (level: string) => {
    switch (level) {
      case '极浅烘':
      case '浅烘':
        return 'text-yellow-600';
      case '中浅烘':
      case '中烘':
        return 'text-orange-600';
      case '中深烘':
      case '深烘':
        return 'text-coffee-700';
      case '极深烘':
        return 'text-coffee-900';
      default:
        return 'text-coffee-600';
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-coffee-950 mb-6 text-center">
          📷 图片检测
        </h1>

        {/* 图片上传区域 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {!selectedImage ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-coffee-300 rounded-lg p-8 mb-4">
                <Camera className="mx-auto text-coffee-400 mb-4" size={48} />
                <p className="text-coffee-600 mb-4">选择或拍摄咖啡豆图片</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-accent-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
                  >
                    <Camera size={16} />
                    拍照
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-coffee-800 transition-colors"
                  >
                    <Upload size={16} />
                    上传
                  </button>
                </div>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/heic,image/heif"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/heic,image/heif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="text-center">
              {selectedImage ? (
                <div className="relative">
                  {imageLoading && (
                    <div className="absolute inset-0 w-full h-48 bg-coffee-100 rounded-lg mb-4 flex items-center justify-center z-10">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-coffee-600 border-t-transparent"></div>
                        <p className="text-coffee-600">图片加载中...</p>
                      </div>
                    </div>
                  )}
                  {imageLoadError ? (
                    <div className="w-full h-48 bg-red-50 border-2 border-red-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-red-600 mb-2">图片加载失败</p>
                        <button
                          onClick={() => {
                            setImageLoadError(false);
                            setImageLoading(true);
                            // 强制重新加载图片
                            const img = new Image();
                            img.onload = () => {
                              setImageLoading(false);
                              setImageLoadError(false);
                            };
                            img.onerror = () => {
                              setImageLoading(false);
                              setImageLoadError(true);
                            };
                            img.src = selectedImage;
                          }}
                          className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                        >
                          重试加载
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedImage}
                      alt="Selected coffee beans"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onLoad={(e) => {
                        console.log('=== 图片渲染成功 ===');
                        console.log('图片信息:', {
                          naturalWidth: e.currentTarget.naturalWidth,
                          naturalHeight: e.currentTarget.naturalHeight,
                          src: e.currentTarget.src.substring(0, 100) + '...',
                          complete: e.currentTarget.complete,
                          currentSrc: e.currentTarget.currentSrc.substring(0, 100) + '...'
                        });
                        setImageLoading(false);
                        setImageLoadError(false);
                      }}
                      onError={(e) => {
                        console.error('=== 图片渲染失败 ===');
                        console.error('错误详情:', {
                          src: e.currentTarget.src.substring(0, 100) + '...',
                          error: e.type,
                          target: e.currentTarget,
                          naturalWidth: e.currentTarget.naturalWidth,
                          naturalHeight: e.currentTarget.naturalHeight,
                          complete: e.currentTarget.complete
                        });
                        
                        // 检查是否是 blob URL 且已被撤销
                        if (selectedImage?.startsWith('blob:')) {
                          console.error('Blob URL 可能已被撤销或无效');
                          setError('图片链接已失效，请重新选择图片');
                        } else {
                          console.error('图片加载失败，可能是格式问题或数据损坏');
                          setError('图片显示失败，请尝试选择其他图片');
                        }
                        
                        setImageLoading(false);
                        setImageLoadError(true);
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-coffee-100 rounded-lg mb-4 flex items-center justify-center">
                  <p className="text-coffee-500">请选择图片</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDetect}
                  disabled={isDetecting}
                  className="bg-accent-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDetecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      检测中...
                    </>
                  ) : (
                    '开始检测'
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  重新选择
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 检测结果 */}
        {detectionResult && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-accent-green" size={20} />
              <h2 className="text-lg font-semibold text-coffee-950">检测结果</h2>
            </div>
            
            <div className="space-y-4">
              {/* Agtron值 */}
              <div className="text-center">
                <div className="text-4xl font-bold text-coffee-950 mb-2">
                  {detectionResult.agtron_value}
                </div>
                <div className="text-sm text-coffee-600">Agtron值</div>
              </div>

              {/* 烘焙度等级 */}
              <div className="text-center">
                <div className={`text-2xl font-semibold mb-1 ${getRoastLevelColor(detectionResult.roast_level)}`}>
                  {detectionResult.roast_level}
                </div>
                <div className="text-sm text-coffee-600">烘焙度等级</div>
              </div>

              {/* 置信度 */}
              <div className="bg-coffee-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-coffee-700">检测置信度</span>
                  <span className="text-sm font-semibold text-coffee-900">
                    {(detectionResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-coffee-200 rounded-full h-2">
                  <div
                    className="bg-accent-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${detectionResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 建议 */}
              <div className="bg-cream-100 rounded-lg p-4">
                <h3 className="font-semibold text-coffee-950 mb-2">烘焙建议</h3>
                <p className="text-coffee-700 text-sm leading-relaxed">
                  {detectionResult.suggestions}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-accent-green text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  保存记录
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-coffee-600 text-white py-2 rounded-lg hover:bg-coffee-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  分享结果
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 使用提示 */}
        <div className="bg-cream-100 rounded-lg p-4">
          <h3 className="font-semibold text-coffee-950 mb-2">使用提示</h3>
          <ul className="text-sm text-coffee-700 space-y-1">
            <li>• 确保咖啡豆图片清晰，光线充足</li>
            <li>• 建议使用白色背景拍摄</li>
            <li>• 咖啡豆应占据图片主要区域</li>
            <li>• 避免阴影和反光影响检测精度</li>
          </ul>
        </div>
        
        {/* 支持格式说明 */}
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-coffee-950 mb-2">📁 支持的文件格式</h3>
          <div className="text-sm text-coffee-700 space-y-1">
            <p>• <strong>常规格式：</strong>JPG、PNG、GIF、WebP、BMP</p>
            <p>• <strong>HEIC格式：</strong>自动转换为JPEG（iPhone拍摄的照片）</p>
            <p>• <strong>文件大小：</strong>最大支持10MB</p>
            <p className="text-blue-600 mt-2">💡 HEIC格式会自动转换，无需手动处理</p>
          </div>
        </div>
      </div>
    </div>
  );
}