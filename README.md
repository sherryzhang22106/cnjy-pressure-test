# 春节被围攻压力值测评

一款帮助 18-35 岁年轻人评估春节返乡压力的 H5 测评应用。

## 功能特点

- 🎯 25 道专业测评题目（3 个维度）
- 📊 8 级压力等级评定
- 🤖 AI 深度分析报告（DeepSeek）
- 💳 微信支付（JSAPI + Native 扫码）
- 📱 响应式设计（PC/移动端适配）

## 本地开发

**前置条件:** Node.js 18+

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 部署到 Vercel

### 1. 创建 vercel.json

在项目根目录创建 `vercel.json` 文件：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `WECHAT_APPID` | 微信公众号 AppID |
| `WECHAT_APP_SECRET` | 微信公众号密钥 |
| `WECHAT_MCHID` | 微信商户号 |
| `WECHAT_API_KEY` | 微信支付 APIv3 密钥 |
| `WECHAT_SERIAL_NO` | 微信支付证书序列号 |
| `WECHAT_PRIVATE_KEY` | 微信支付私钥（换行符用 `\n` 表示） |
| `SITE_URL` | 网站域名（如 `https://cnjy.bettermee.cn`） |
| `WECHAT_NOTIFY_URL` | 支付回调地址（如 `https://cnjy.bettermee.cn/api/payment?action=notify`） |

### 3. 微信配置

#### 微信商户平台 (pay.weixin.qq.com)

1. **产品中心 → 开发配置**
   - 支付授权目录：`https://your-domain.com/`（注意末尾斜杠）
   - Native 支付回调 URL：`https://your-domain.com/api/payment?action=notify`

#### 微信公众平台 (mp.weixin.qq.com)

1. **设置与开发 → 公众号设置 → 功能设置**
   - 网页授权域名：`your-domain.com`
   - JS 接口安全域名：`your-domain.com`

### 4. 部署

```bash
# 使用 Vercel CLI
vercel

# 或者直接在 Vercel 网站导入 Git 仓库
```

## 项目结构

```
├── api/                    # Vercel Serverless Functions
│   ├── ai.ts              # DeepSeek AI 代理
│   └── payment.ts         # 微信支付 API
├── services/
│   ├── aiService.ts       # AI 服务（前端）
│   └── paymentService.ts  # 支付服务（前端）
├── App.tsx                # 主应用组件
├── constants.ts           # 题目和等级配置
├── types.ts               # TypeScript 类型定义
└── index.html             # HTML 入口
```

## 支付流程

```
用户点击支付
    │
    ├─ 微信内？
    │   └─ 是 → 跳转授权 → 获取 openid → JSAPI 支付
    │
    └─ 否（PC/手机浏览器）
        └─ 生成二维码 → 用户扫码 → 轮询支付状态
```

## License

MIT
