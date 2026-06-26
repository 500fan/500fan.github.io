---
title: Vercel留言板搭建与部署完整教程（Upstash Redis持久化版）
date: 2026-05-04 01:00:00
tags:
  - Vercel
  - 留言板
  - Serverless
  - Redis
  - Upstash
categories:
  - 博客搭建
---

# Vercel 留言板搭建与部署完整教程（Upstash Redis 持久化版）

> 使用 Upstash Redis 存储留言和图片，冷启动不丢数据。支持头像上传、图片上传、表情选择。

<!-- more -->

## 一、功能特性

- ✅ 发布留言（昵称 + 内容 + 表情 + 图片 + 头像）
- ✅ 自定义头像上传（永久保留，下次留言自动使用）
- ✅ 图片上传（存 Redis，90 天过期）
- ✅ 6 大类表情选择器
- ✅ 数据持久化（冷启动不丢）
- ✅ 响应式设计（手机/电脑都能用）
- ✅ 自动刷新（30 秒轮询）
- ✅ 管理员删除留言

## 二、架构说明

```
┌─────────────────────────────────────────────┐
│  前端 (index.html + script.js + style.css)  │
│  Vercel 静态托管                              │
└──────┬──────────┬──────────┬────────────────┘
       │          │          │
  GET/POST    上传图片    读取图片
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ messages │ │  upload  │ │  image   │
│ API      │ │  API     │ │  API     │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  ▼
        ┌─────────────────┐
        │  Upstash Redis  │
        │  留言列表 + 图片  │
        └─────────────────┘
```

**为什么用 Upstash Redis 而不是 Vercel Blob？**
- Vercel KV 已迁移到 Marketplace，无法通过 API Token 创建
- Vercel Blob 的 BLOB_READ_WRITE_TOKEN 需要手动在 Dashboard 配置
- Upstash Redis 通过 Vercel Marketplace 一键安装，环境变量自动注入
- 图片以 base64 存 Redis，90 天自动过期，无需额外存储服务

## 三、项目结构

```
guestbook/
├── api/
│   ├── messages.js      # 留言 CRUD → Redis
│   ├── upload.js         # 图片上传 → Redis (base64)
│   └── image.js          # 图片读取 → 从 Redis 返回图片
├── index.html            # 主页面
├── style.css             # 样式
├── script.js             # 前端逻辑
└── package.json          # 依赖: @upstash/redis
```

## 四、Vercel 配置步骤

### 4.1 创建 Upstash Redis 数据库

1. 登录 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 进入你的项目 → **Storage** 标签
3. 找到 **Upstash** → 点 **Browse** 或 **Install**
4. 跳转到 Upstash 页面，创建 Redis 数据库：
   - 名称：`guestbook-kv`
   - 区域：选 **Asia Pacific (Tokyo)** 或最近的区域
   - 点 **Create**
5. 回到 Vercel Dashboard → **Storage** → 找到刚创建的 Redis
6. 点 **Connect to Project** → 选 guestbook → 勾选全部环境 → **Connect**

注入的环境变量：
```
KV_REST_API_URL   = https://xxx.upstash.io
KV_REST_API_TOKEN = xxx
REDIS_URL         = rediss://xxx
```

### 4.2 验证环境变量

进入 **Settings** → **Environment Variables**，确认以下变量存在：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## 五、完整源码

### 5.1 `package.json`

```json
{
  "name": "guestbook",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@upstash/redis": "^1.34.0"
  }
}
```

### 5.2 `api/messages.js`

```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
  },
};

const KV_KEY = 'guestbook:messages';
const MAX_MESSAGES = 500;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: 获取所有留言
    if (req.method === 'GET') {
      const messages = await redis.lrange(KV_KEY, 0, -1);
      return res.status(200).json(messages || []);
    }

    // POST: 发布新留言
    if (req.method === 'POST') {
      const { nickname, content, emoji, imageUrl, avatarUrl } = req.body;
      if (!nickname || !content) {
        return res.status(400).json({ error: '昵称和内容不能为空' });
      }

      const message = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        nickname,
        content,
        emoji: emoji || null,
        imageUrl: imageUrl || null,
        avatarUrl: avatarUrl || null,
        createdAt: new Date().toISOString(),
      };

      await redis.lpush(KV_KEY, message);

      const len = await redis.llen(KV_KEY);
      if (len > MAX_MESSAGES) {
        await redis.ltrim(KV_KEY, 0, MAX_MESSAGES - 1);
      }

      return res.status(201).json(message);
    }

    // DELETE: 删除留言
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: '缺少留言 ID' });

      const messages = await redis.lrange(KV_KEY, 0, -1);
      const filtered = messages.filter(m => m.id !== id);

      if (filtered.length === messages.length) {
        return res.status(404).json({ error: '留言不存在' });
      }

      await redis.del(KV_KEY);
      if (filtered.length > 0) {
        await redis.lpush(KV_KEY, ...filtered.reverse());
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: '服务器错误: ' + err.message });
  }
}
```

**Redis 操作说明**：
- `redis.lpush(key, value)` — 从左侧插入（新留言在前）
- `redis.lrange(key, 0, -1)` — 获取全部留言
- `redis.llen(key)` — 获取留言总数
- `redis.ltrim(key, 0, N-1)` — 只保留前 N 条
- `redis.del(key)` — 删除整个列表
- `redis.set(key, value, { ex: seconds })` — 设置带过期时间的键值

### 5.3 `api/upload.js`

```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

export const config = {
  api: {
    bodyParser: { sizeLimit: '2mb' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, base64, data } = req.body;
    const fileData = base64 || data;

    if (!filename || !fileData) {
      return res.status(400).json({ error: '缺少文件数据' });
    }

    // 检查大小 (base64 → 原文件约 ×0.75)
    const sizeKB = Math.round((fileData.length * 3) / 4 / 1024);
    if (sizeKB > 1024) {
      return res.status(400).json({ error: '图片不能超过 1MB' });
    }

    // 生成唯一 ID
    const ext = filename.split('.').pop().toLowerCase() || 'png';
    const imageId = `img_${Date.now().toString(36)}.${ext}`;

    // 存入 Redis，设置 90 天过期
    await redis.set(imageId, fileData, { ex: 7776000 });

    // 返回下载 API 地址
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const url = `${protocol}://${host}/api/image?id=${imageId}`;

    return res.status(200).json({ url });
  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: '上传失败: ' + err.message });
  }
}
```

### 5.4 `api/image.js`

```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '缺少图片 ID' });
  }

  try {
    const base64Data = await redis.get(id);

    if (!base64Data) {
      return res.status(404).json({ error: '图片不存在或已过期' });
    }

    // 根据扩展名判断 MIME 类型
    const ext = id.split('.').pop().toLowerCase();
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    const contentType = mimeMap[ext] || 'image/png';

    // base64 转 Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Image Error:', err);
    return res.status(500).json({ error: '服务器错误' });
  }
}
```

### 5.5 `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>留言板</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💬</text></svg>">
</head>
<body>
  <div class="container">
    <header>
      <h1>💬 留言板</h1>
      <p class="subtitle">留下你的足迹吧~</p>
    </header>

    <div class="form-card">
      <div class="form-top">
        <!-- 头像上传 -->
        <div class="avatar-upload">
          <div id="avatarPreview" class="avatar-preview">
            <span class="avatar-placeholder">📷</span>
            <img id="avatarImg" src="" alt="头像" class="hidden">
          </div>
          <label class="avatar-label" title="上传头像">
            换头像
            <input type="file" id="avatarInput" accept="image/*" hidden>
          </label>
        </div>
        <div class="form-fields">
          <input type="text" id="nickname" placeholder="你的昵称" maxlength="20">
          <textarea id="content" placeholder="说点什么..." rows="3" maxlength="500"></textarea>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <button type="button" id="emojiBtn" class="tool-btn">😊 表情</button>
        <label class="tool-btn">
          🖼️ 图片
          <input type="file" id="imageInput" accept="image/*" hidden>
        </label>
        <span id="charCount" class="char-count">0/500</span>
        <button type="button" id="submitBtn" class="submit-btn">发送 🚀</button>
      </div>

      <!-- 表情选择器 -->
      <div id="emojiPicker" class="emoji-picker hidden">
        <div class="emoji-tabs">
          <button class="emoji-tab active" data-cat="smileys">😀</button>
          <button class="emoji-tab" data-cat="gestures">👋</button>
          <button class="emoji-tab" data-cat="hearts">❤️</button>
          <button class="emoji-tab" data-cat="animals">🐱</button>
          <button class="emoji-tab" data-cat="food">🍕</button>
          <button class="emoji-tab" data-cat="objects">🎉</button>
        </div>
        <div id="emojiGrid" class="emoji-grid"></div>
      </div>

      <!-- 图片预览 -->
      <div id="imagePreview" class="image-preview hidden">
        <img id="previewImg" src="" alt="预览">
        <button id="removeImg" class="remove-img">✕</button>
      </div>
    </div>

    <div id="messages" class="messages">
      <div class="loading">加载中...</div>
    </div>
  </div>

  <script src="/script.js"></script>
</body>
</html>
```

### 5.6 `style.css` 和 `script.js`

由于篇幅较长，完整代码请参考项目源文件。关键点：

**style.css**：
- `.avatar-upload` — 头像上传区域，左侧圆形预览
- `.avatar-preview` — 64px 圆形头像，hover 变色
- `.msg-avatar img` — 留言卡片里的自定义头像

**script.js**：
- `avatarInput` 监听 change 事件，读取文件转 base64
- `selectedAvatar` 存储头像数据，提交时一起上传
- 头像上传后保留，下次留言自动使用
- 留言列表渲染时，有 `avatarUrl` 显示图片，否则显示首字母

## 六、部署

### 6.1 CLI 部署

```bash
cd guestbook
npm install
vercel --prod
```

### 6.2 关联 Git 仓库

```bash
git init
git add .
git commit -m "guestbook with Upstash Redis"
# 推送到 GitHub 后在 Vercel Dashboard 导入
```

## 七、API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages` | GET | 获取所有留言 |
| `/api/messages` | POST | 发布新留言 |
| `/api/messages` | DELETE | 删除留言（管理员） |
| `/api/upload` | POST | 上传图片/头像 |
| `/api/image?id=xxx` | GET | 读取图片 |

### POST /api/messages 请求体：

```json
{
  "nickname": "昵称",
  "content": "留言内容",
  "emoji": "😊",
  "imageUrl": "https://xxx/api/image?id=img_xxx.webp",
  "avatarUrl": "https://xxx/api/image?id=img_xxx.png"
}
```

### POST /api/upload 请求体：

```json
{
  "filename": "photo.jpg",
  "base64": "/9j/4AAQ..."
}
```

返回：`{ "url": "https://xxx/api/image?id=img_xxx.jpg" }`

## 八、免费额度

Upstash Redis Free Plan：

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| 命令数 | 10,000 次/天 | 读写都算 |
| 存储 | 256 MB | 约可存 5 万条留言 |
| 带宽 | 无限 | - |

图片以 base64 存储，一张约 100-500KB。256MB 约可存 500-2500 张图片（含留言数据）。

## 九、常见问题

### Q: 环境变量没注入？
A: 在 Vercel Dashboard → Storage → 找到 Redis 数据库 → Connect to Project → 勾选全部环境。

### Q: 图片上传报错"不能超过 1MB"？
A: Redis 存 base64 有大小限制。压缩图片后再上传，或调整 `api/upload.js` 中的 `sizeKB > 1024` 限制。

### Q: 图片过期了怎么办？
A: 默认 90 天过期。可在 `api/upload.js` 中修改 `ex: 7776000`（秒数）。

### Q: 冷启动后数据还在吗？
A: 在。数据存在 Upstash Redis 云端，不依赖本地内存。

### Q: 如何查看 Redis 中的数据？
A: Upstash Dashboard → Data Browser，可以看到所有 key 和值。

### Q: 如何清空所有留言？
A: 在 Upstash Data Browser 中删除 `guestbook:messages` key。

---

*教程作者：彭金涛 | 最后更新：2026-05-04*
