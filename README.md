# 咖啡豆烘焙度检测系统 ☕️

一个专业的咖啡烘焙辅助工具，通过AI图像识别技术帮助用户精确检测咖啡豆的Agtron烘焙度值。

## 🎯 项目简介

本应用解决咖啡烘焙师和爱好者在烘焙过程中难以准确判断烘焙度的问题，提供科学的数据支持和实时监控功能。目标用户包括专业咖啡烘焙师、咖啡店经营者和咖啡爱好者，帮助他们提升烘焙质量和一致性。

## ✨ 功能特性

### 📸 图片检测
- 支持摄像头拍照、相册选择、拖拽上传
- AI智能分析咖啡豆烘焙度
- 显示Agtron值、烘焙度等级、置信度
- 提供专业烘焙建议
- 支持JPEG、PNG、GIF、WebP、BMP格式
- 自动处理HEIC格式转换

### 📹 实时监控
- 摄像头实时预览烘焙过程
- 设置目标烘焙度和监控参数
- 定时或手动截图检测
- 实时显示当前烘焙度进度
- 达标智能提醒

### 📊 历史记录
- 检测历史时间线展示
- 烘焙度趋势图表分析
- 数据统计和导出功能
- 支持筛选和搜索

### ⚙️ 智能设置
- 检测精度调整
- 提醒方式配置
- 用户偏好管理
- 校准设置

## 🛠 技术栈

### 前端
- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 原子化CSS框架
- **Vite** - 快速构建工具
- **Zustand** - 轻量级状态管理
- **React Router** - 路由管理

### 后端服务
- **Supabase** - 后端即服务
  - 用户认证
  - PostgreSQL数据库
  - 实时订阅
  - 文件存储

### 部署
- **Vercel** - 前端部署平台
- **GitHub** - 代码版本控制

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone git@github.com:passwind/simple_agtron.git
cd simple_agtron
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **环境配置**
创建 `.env.local` 文件并配置Supabase连接：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:5173`

### 构建生产版本
```bash
npm run build
# 或
pnpm build
```

## 📁 项目结构

```
simple_agtron/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Layout.tsx      # 布局组件
│   │   └── Empty.tsx       # 空状态组件
│   ├── pages/              # 页面组件
│   │   ├── Home.tsx        # 首页
│   │   ├── Detect.tsx      # 图片检测页
│   │   ├── Monitor.tsx     # 实时监控页
│   │   ├── History.tsx     # 历史记录页
│   │   ├── Settings.tsx    # 设置页
│   │   ├── Login.tsx       # 登录页
│   │   └── Profile.tsx     # 用户资料页
│   ├── store/              # 状态管理
│   │   └── useDetectionStore.ts
│   ├── lib/                # 工具库
│   │   ├── supabase.ts     # Supabase配置
│   │   └── utils.ts        # 工具函数
│   ├── hooks/              # 自定义Hooks
│   │   └── useTheme.ts     # 主题Hook
│   └── assets/             # 静态资源
├── supabase/
│   └── migrations/         # 数据库迁移文件
├── public/                 # 公共资源
└── docs/                   # 文档
```

## 🎨 设计特色

- **咖啡主题**：深棕色和奶油色配色方案
- **响应式设计**：移动端优先，适配各种设备
- **现代化UI**：卡片式设计，圆角按钮，轻微阴影
- **直观交互**：拖拽上传，实时预览，智能提醒

## 📱 使用说明

### 图片检测流程
1. 进入首页，点击"图片检测"
2. 选择拍照或上传咖啡豆图片
3. 等待AI分析处理
4. 查看Agtron值和烘焙度等级
5. 保存记录或重新检测

### 实时监控流程
1. 进入"实时监控"页面
2. 设置目标烘焙度和监控参数
3. 开启摄像头预览
4. 开始监控烘焙过程
5. 系统自动检测并提醒达标

## 🚀 部署说明

### Vercel部署
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 手动部署
```bash
# 构建项目
npm run build

# 部署到Vercel
npx vercel --prod
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目链接: [https://github.com/passwind/simple_agtron](https://github.com/passwind/simple_agtron)
- 问题反馈: [Issues](https://github.com/passwind/simple_agtron/issues)

---

**让每一杯咖啡都有完美的烘焙度！** ☕️✨
