---
title: Vercel留言板搭建与部署完整教程（Vercel Blob + Redis版）
date: 2026-05-04 02:00:00
tags:
  - Vercel
  - 留言板
  - Serverless
  - Redis
  - Upstash
  - Blob
  - CDN
categories:
  - 博客搭建
---

# Vercel 留言板搭建与部署完整教程（Vercel Blob + Redis 版）

> 图片存 Vercel Blob CDN，永久保存、全球加速；留言存 Upstash Redis，冷启动不丢数据。

<!-- more -->

## 一、功能特性

- ✅ 发布留言（昵称 + 内容 + 表情 + 图片 + 头像）
- ✅ 自定义头像上传（永久保留，下次留言自动使用）
- ✅ 图片上传 → Vercel Blob CDN（永久保存，全球加速读取）
- ✅ 留言存储 → Upstash Redis（冷启动不丢数据）
- ✅ 6 大类表情选择器（300+ 表情）
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
│ messages │ │  upload  │ │  (直接)  │
│ API      │ │  API     │ │  CDN URL │
│  ↓Redis  │ │  ↓Blob   │ │          │
└──────────┘ └──────────┘ └──────────┘
     │             │             │
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Upstash  │ │  Vercel  │ │  Vercel  │
│ Redis    │ │  Blob    │ │  Blob    │
│ (留言)    │ │ (上传)   │ │ (读取)   │
└──────────┘ └──────────┘ └──────────┘
```

**为什么用 Vercel Blob 存图片？**
- 图片存 CDN，全球边缘节点加速，加载速度快
- 永久保存，不设过期时间
- 免费 1GB 存储空间
- 图片大小限制 4MB（比 Redis 方案的 1MB 更大）

**为什么需要图片代理 `/api/image`？**
- Vercel Blob 默认返回 `Content-Disposition: attachment`，浏览器会下载而不是显示
- 加一个代理接口，强制返回 `Content-Disposition: inline`，图片直接在浏览器显示
- 代理接口缓存 1 天，不影响性能

**为什么用 Upstash Redis 存留言？**
- Vercel KV 已迁移到 Marketplace，无法通过 API Token 创建
- Upstash Redis 通过 Vercel Marketplace 一键安装，环境变量自动注入
- 免费额度：每天 10,000 次命令，256MB 存储
- 留言数据量小，完全够用

## 三、项目结构

```
guestbook-blob/
├── api/
│   ├── messages.js      # 留言 CRUD → Upstash Redis
│   ├── upload.js         # 图片上传 → Vercel Blob CDN
│   └── image.js          # 图片代理 → 强制 inline 显示
├── index.html            # 主页面
├── style.css             # 样式
├── script.js             # 前端逻辑
└── package.json          # 依赖: @upstash/redis + @vercel/blob
```

**与 Redis 方案的区别**：
- Redis 方案：`api/upload.js` + `api/image.js`（图片存 Redis，通过 API 读取）
- Blob 方案：`api/upload.js` + `api/image.js`（图片存 Blob，通过代理读取，强制 inline 显示）

## 四、Vercel 配置步骤（详细图文）

### 4.1 创建 Vercel 项目

1. 登录 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 点击 **Add New...** → **Project**
3. 导入 Git 仓库（或后续用 CLI 部署）

### 4.2 创建 Upstash Redis 数据库

1. 进入项目 → **Storage** 标签
2. 找到 **Upstash** → 点 **Browse**
3. 跳转到 Upstash 页面，选择 **Upstash for Redis**
4. 选择安装计划：
   - **Pay As You Go** — 有免费额度（每天 10,000 次命令，256MB 存储）
   - 不需要付款，留言板完全免费
5. 创建 Redis 数据库：
   - 名称：`guestbook-kv`
   - 区域：选 **Asia Pacific (Tokyo)** 或最近的区域
   - 点 **Create**
6. 回到 Vercel Dashboard → **Storage** → 找到刚创建的 Redis
7. 点 **Connect to Project** → 选你的项目 → 勾选全部环境 → **Connect**

注入的环境变量：
```
KV_REST_API_URL              = https://xxx.upstash.io
KV_REST_API_TOKEN            = xxx
KV_REST_API_READ_ONLY_TOKEN  = xxx
KV_URL                       = rediss://xxx
REDIS_URL                    = rediss://xxx
```

### 4.3 创建 Vercel Blob 存储

1. 回到项目 → **Storage** 标签
2. 找到 **Blob** → 点 **Create Database**
3. 名称：`guestbook-blob-store`
4. 点 **Create**
5. 创建后 → **Connect to Project** → 选你的项目 → 勾选全部环境 → **Connect**

注入的环境变量：
```
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_xxx
```

### 4.4 验证环境变量

进入 **Settings** → **Environment Variables**，确认以下 6 个变量存在：

| 变量名 | 用途 |
|--------|------|
| `KV_REST_API_URL` | Redis REST API 地址 |
| `KV_REST_API_TOKEN` | Redis REST API 令牌 |
| `KV_REST_API_READ_ONLY_TOKEN` | Redis 只读令牌 |
| `KV_URL` | Redis 连接地址 |
| `REDIS_URL` | Redis 连接地址 |
| `BLOB_READ_WRITE_TOKEN` | Blob 读写令牌 |

## 五、完整源码

### 5.1 `package.json`

```json
{
  "name": "guestbook-blob",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@upstash/redis": "^1.34.0",
    "@vercel/blob": "^0.15.0"
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

const KV_KEY = 'guestbook-blob:messages';
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

### 5.3 `api/upload.js`

```javascript
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
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

    // base64 转 Buffer
    const buffer = Buffer.from(fileData, 'base64');

    // 判断 MIME 类型
    const ext = filename.split('.').pop().toLowerCase();
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    const contentType = mimeMap[ext] || 'image/png';

    // 生成唯一文件名
    const blobName = `guestbook/${Date.now().toString(36)}.${ext}`;

    // 上传到 Vercel Blob
    const blob = await put(blobName, buffer, {
      contentType,
      access: 'public',
    });

    // blob.url 就是 CDN 地址，直接可用
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: '上传失败: ' + err.message });
  }
}
```

**关键点**：
- `put()` 是 `@vercel/blob` 的上传函数
- `access: 'public'` 设置为公开访问
- `blob.url` 返回的是 CDN 地址，但默认是 `attachment`（下载），需要通过代理显示

### 5.4 `api/image.js`

```javascript
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: '缺少 url 参数' });
  }

  try {
    // 从 Blob 获取图片内容
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // 强制 inline 显示，不下载
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Image proxy error:', err);
    return res.status(500).json({ error: '服务器错误' });
  }
}
```

**为什么需要这个代理？**
- Vercel Blob 默认返回 `Content-Disposition: attachment`，浏览器会下载
- 代理接口强制返回 `Content-Disposition: inline`，图片直接在浏览器显示
- 代理接口缓存 1 天（`max-age=86400`），不影响性能
- 前端图片 URL 格式：`/api/image?url=${encodeURIComponent(blobUrl)}`

### 5.5 `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>留言板 (Blob版)</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💬</text></svg>">
</head>
<body>
  <div class="container">
    <header>
      <h1>💬 留言板</h1>
      <p class="subtitle">Vercel Blob + Redis 持久化版</p>
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

### 5.6 `style.css`

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container { max-width: 600px; margin: 0 auto; }

header { text-align: center; padding: 30px 0; color: white; }
header h1 { font-size: 2em; margin-bottom: 8px; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
.subtitle { opacity: 0.9; font-size: 1em; }

.form-card {
  background: white; border-radius: 16px; padding: 24px;
  margin-bottom: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.form-top { display: flex; gap: 16px; margin-bottom: 12px; }

/* 头像上传 */
.avatar-upload { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.avatar-preview {
  width: 64px; height: 64px; border-radius: 50%; overflow: hidden;
  border: 3px solid #e8e8e8; display: flex; align-items: center; justify-content: center;
  background: #f5f5f5; cursor: pointer; transition: border-color 0.3s;
}
.avatar-preview:hover { border-color: #667eea; }
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 28px; }
.avatar-label {
  font-size: 12px; color: #667eea; cursor: pointer; text-align: center;
}
.avatar-label:hover { text-decoration: underline; }

.form-fields { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.form-fields input, .form-fields textarea {
  width: 100%; padding: 12px 16px; border: 2px solid #e8e8e8;
  border-radius: 10px; font-size: 15px; transition: border-color 0.3s;
  outline: none; font-family: inherit; resize: vertical;
}
.form-fields input:focus, .form-fields textarea:focus { border-color: #667eea; }

.toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tool-btn {
  padding: 8px 14px; border: 2px solid #e8e8e8; border-radius: 20px;
  background: white; cursor: pointer; font-size: 14px; transition: all 0.2s;
}
.tool-btn:hover { border-color: #667eea; background: #f0f2ff; }
.char-count { color: #999; font-size: 13px; margin-left: auto; }
.submit-btn {
  padding: 10px 24px; background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; border: none; border-radius: 20px; cursor: pointer;
  font-size: 15px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s;
}
.submit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(102,126,234,0.4); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.emoji-picker { margin-top: 12px; border: 2px solid #e8e8e8; border-radius: 12px; overflow: hidden; }
.emoji-tabs { display: flex; border-bottom: 1px solid #e8e8e8; background: #fafafa; }
.emoji-tab { flex: 1; padding: 8px; border: none; background: none; cursor: pointer; font-size: 18px; transition: background 0.2s; }
.emoji-tab.active { background: white; border-bottom: 2px solid #667eea; }
.emoji-tab:hover:not(.active) { background: #f0f0f0; }
.emoji-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 4px; padding: 12px; max-height: 200px; overflow-y: auto; }
.emoji-item { display: flex; align-items: center; justify-content: center; padding: 6px; cursor: pointer; border-radius: 8px; font-size: 20px; transition: background 0.2s; }
.emoji-item:hover { background: #f0f2ff; transform: scale(1.2); }

.image-preview { margin-top: 12px; position: relative; display: inline-block; }
.image-preview img { max-width: 200px; max-height: 150px; border-radius: 10px; border: 2px solid #e8e8e8; }
.remove-img {
  position: absolute; top: -8px; right: -8px; width: 24px; height: 24px;
  background: #ff4757; color: white; border: 2px solid white; border-radius: 50%;
  cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
}

.messages { display: flex; flex-direction: column; gap: 16px; }
.msg-card {
  background: white; border-radius: 16px; padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1); transition: transform 0.2s;
}
.msg-card:hover { transform: translateY(-2px); }
.msg-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.msg-avatar {
  width: 42px; height: 42px; background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0;
  overflow: hidden;
}
.msg-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.msg-nickname { font-weight: 600; font-size: 15px; color: #333; }
.msg-time { font-size: 12px; color: #999; }
.msg-content { font-size: 15px; line-height: 1.6; color: #444; word-break: break-word; }
.msg-emoji { margin-top: 8px; font-size: 28px; }
.msg-image { margin-top: 10px; }
.msg-image img { max-width: 100%; max-height: 300px; border-radius: 10px; cursor: pointer; transition: transform 0.2s; }
.msg-image img:hover { transform: scale(1.02); }
.msg-id { margin-top: 10px; font-size: 11px; color: #bbb; text-align: right; }

.empty, .loading { text-align: center; padding: 40px; color: white; font-size: 16px; opacity: 0.8; }
.hidden { display: none !important; }

@media (max-width: 480px) {
  body { padding: 12px; }
  header h1 { font-size: 1.5em; }
  .form-card { padding: 16px; }
  .form-top { flex-direction: column; align-items: center; }
  .form-fields { width: 100%; }
  .toolbar { gap: 6px; }
  .tool-btn { padding: 6px 10px; font-size: 12px; }
  .submit-btn { padding: 8px 18px; font-size: 14px; }
}
```

### 5.7 `script.js`

```javascript
// ========== 表情数据 ==========
const EMOJIS = {
  smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩',
            '😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨',
            '😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥','😌','😔','😪','🤤','😴',
            '😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
  gestures: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈',
             '👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐',
             '🤲','🤝','🙏'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓',
            '💗','💖','💘','💝','💟','♥️','🫶'],
  animals: ['🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷',
            '🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅',
            '🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞'],
  food: ['🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇','🥞','🧈','🍞','🥐',
         '🥖','🫓','🥨','🥯','🥝','🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎',
         '🍏','🍐','🍑','🍒','🍓','🫐','☕','🍵','🧃','🥤','🍺','🍻','🥂','🍷',
         '🍸','🍹'],
  objects: ['🎉','🎊','🎈','🎁','🎀','🏆','🥇','⚡','🔥','✨','🌟','💫','💥','💢',
            '💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💤','🎵','🎶','🎸','🎹','🥁',
            '🎷','🎺','🪗','🎮','🕹️','🎯','🎲','🧩','📱','💻','⌨️','🖥️','📷',
            '📸','🎬','🎤','🎧'],
};

let selectedEmoji = null;
let selectedImage = null;
let selectedAvatar = null;

const nicknameInput = document.getElementById('nickname');
const contentInput = document.getElementById('content');
const charCount = document.getElementById('charCount');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiGrid = document.getElementById('emojiGrid');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImg = document.getElementById('removeImg');
const submitBtn = document.getElementById('submitBtn');
const messagesDiv = document.getElementById('messages');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const avatarImg = document.getElementById('avatarImg');

// ========== 头像上传 ==========
avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 512 * 1024) { alert('头像不能超过 512KB'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    avatarImg.src = reader.result;
    avatarImg.classList.remove('hidden');
    document.querySelector('.avatar-placeholder').classList.add('hidden');
    selectedAvatar = { filename: file.name, base64: reader.result.split(',')[1] };
  };
  reader.readAsDataURL(file);
});

// ========== 内容输入 ==========
contentInput.addEventListener('input', () => {
  charCount.textContent = `${contentInput.value.length}/500`;
});

// ========== 表情 ==========
emojiBtn.addEventListener('click', () => {
  emojiPicker.classList.toggle('hidden');
  if (!emojiPicker.classList.contains('hidden')) loadEmojis('smileys');
});

document.querySelectorAll('.emoji-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadEmojis(tab.dataset.cat);
  });
});

function loadEmojis(category) {
  const emojis = EMOJIS[category] || [];
  emojiGrid.innerHTML = emojis.map(e =>
    `<span class="emoji-item" data-emoji="${e}">${e}</span>`
  ).join('');
  emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedEmoji = item.dataset.emoji;
      contentInput.value += selectedEmoji;
      charCount.textContent = `${contentInput.value.length}/500`;
      emojiPicker.classList.add('hidden');
    });
  });
}

// ========== 图片上传 ==========
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) { alert('图片不能超过 4MB'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    imagePreview.classList.remove('hidden');
    selectedImage = { filename: file.name, base64: reader.result.split(',')[1] };
  };
  reader.readAsDataURL(file);
});

removeImg.addEventListener('click', () => {
  selectedImage = null;
  imageInput.value = '';
  imagePreview.classList.add('hidden');
});

// ========== 提交 ==========
submitBtn.addEventListener('click', submitMessage);
contentInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitMessage();
});

async function uploadFile(fileData, endpoint) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '上传失败');
  }
  return res.json();
}

async function submitMessage() {
  const nickname = nicknameInput.value.trim();
  const content = contentInput.value.trim();
  if (!nickname) { alert('请输入昵称'); nicknameInput.focus(); return; }
  if (!content) { alert('请输入内容'); contentInput.focus(); return; }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;

  try {
    let avatarUrl = null;
    let imageUrl = null;

    // 上传头像
    if (selectedAvatar) {
      submitBtn.textContent = '上传头像中...';
      const data = await uploadFile(selectedAvatar, '/api/upload');
      avatarUrl = data.url;
    }

    // 上传图片
    if (selectedImage) {
      submitBtn.textContent = '上传图片中...';
      const data = await uploadFile(selectedImage, '/api/upload');
      imageUrl = data.url;
    }

    // 发送留言
    submitBtn.textContent = '发送中...';
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, content, emoji: selectedEmoji, imageUrl, avatarUrl }),
    });

    if (res.ok) {
      contentInput.value = '';
      charCount.textContent = '0/500';
      selectedEmoji = null;
      selectedImage = null;
      imageInput.value = '';
      imagePreview.classList.add('hidden');
      emojiPicker.classList.add('hidden');
      loadMessages();
    } else {
      const err = await res.json();
      alert('发送失败: ' + err.error);
    }
  } catch (err) {
    alert('网络错误: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ========== 加载留言 ==========
async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    if (!res.ok) throw new Error('加载失败');
    const messages = await res.json();

    if (messages.length === 0) {
      messagesDiv.innerHTML = '<div class="empty">还没有留言，来抢沙发吧~ 🛋️</div>';
      return;
    }

    messagesDiv.innerHTML = messages.map(m => {
      const initial = m.nickname.charAt(0).toUpperCase();
      const time = formatTime(m.createdAt);

      const avatarHtml = m.avatarUrl
        ? `<img src="${m.avatarUrl}" alt="${initial}">`
        : initial;

      // 图片通过代理显示，强制 inline 不下载
      const imgHtml = m.imageUrl
        ? `<div class="msg-image"><img src="/api/image?url=${encodeURIComponent(m.imageUrl)}" alt="图片" loading="lazy" onclick="window.open(this.src)"></div>`
        : '';
      const emojiHtml = m.emoji ? `<div class="msg-emoji">${m.emoji}</div>` : '';

      return `
        <div class="msg-card">
          <div class="msg-header">
            <div class="msg-avatar">${avatarHtml}</div>
            <div class="msg-info">
              <div class="msg-nickname">${escapeHtml(m.nickname)}</div>
              <div class="msg-time">${time}</div>
            </div>
          </div>
          <div class="msg-content">${escapeHtml(m.content)}</div>
          ${emojiHtml}
          ${imgHtml}
          <div class="msg-id">#${m.id}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    messagesDiv.innerHTML = `<div class="empty">加载失败: ${err.message}</div>`;
  }
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
  return d.toLocaleDateString('zh-CN');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

loadMessages();
setInterval(loadMessages, 30000);
```

## 六、部署

### 6.1 CLI 部署

```bash
cd guestbook-blob
npm install
vercel --prod
```

### 6.2 关联 Git 仓库

```bash
git init
git add .
git commit -m "guestbook with Vercel Blob + Redis"
# 推送到 GitHub 后在 Vercel Dashboard 导入
```

## 七、API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages` | GET | 获取所有留言 |
| `/api/messages` | POST | 发布新留言 |
| `/api/messages` | DELETE | 删除留言（管理员） |
| `/api/upload` | POST | 上传图片/头像 → Vercel Blob |
| `/api/image?url=xxx` | GET | 图片代理 → 强制 inline 显示 |

### POST /api/messages 请求体：

```json
{
  "nickname": "昵称",
  "content": "留言内容",
  "emoji": "😊",
  "imageUrl": "https://xxx.public.blob.vercel-storage.com/guestbook/xxx.webp",
  "avatarUrl": "https://xxx.public.blob.vercel-storage.com/guestbook/xxx.png"
}
```

### POST /api/upload 请求体：

```json
{
  "filename": "photo.jpg",
  "base64": "/9j/4AAQ..."
}
```

返回：`{ "url": "https://xxx.public.blob.vercel-storage.com/guestbook/xxx.jpg" }`

**注意**：Blob 返回的 URL 是 CDN 地址，前端直接用 `<img src="url">` 显示，无需额外的读取接口。

## 八、免费额度

| 服务 | 免费额度 | 说明 |
|------|----------|------|
| Upstash Redis | 10,000 次/天 | 读写都算 |
| Upstash Redis | 256MB 存储 | 约可存 5 万条留言 |
| Vercel Blob | 1GB 存储 | 约可存 2000-10000 张图片 |
| Vercel Blob | 无限带宽 | CDN 全球加速 |

## 九、常见问题

### Q: Blob 上传报错 "No token found"？
A: 确认 BLOB_READ_WRITE_TOKEN 已注入。在 Vercel Dashboard → Storage → Blob → Connect to Project。

### Q: Redis 连接失败？
A: 确认 KV_REST_API_URL 和 KV_REST_API_TOKEN 已注入。在 Vercel Dashboard → Storage → Upstash → Connect to Project。

### Q: 图片上传报错 "不能超过 4MB"？
A: Vercel Blob 限制单文件 4MB。压缩图片后再上传。

### Q: 点击图片为什么是下载而不是显示？
A: Vercel Blob 默认返回 `Content-Disposition: attachment`（下载）。解决方法：
1. 创建 `api/image.js` 代理接口，强制返回 `Content-Disposition: inline`
2. 前端图片 URL 格式：`/api/image?url=${encodeURIComponent(blobUrl)}`
3. 代理接口缓存 1 天，不影响性能

### Q: 图片会过期吗？
A: 不会。Vercel Blob 图片永久保存（除非手动删除）。

### Q: 冷启动后数据还在吗？
A: 在。留言存在 Upstash Redis 云端，图片存在 Vercel Blob CDN。

### Q: 如何查看 Redis 中的数据？
A: Upstash Dashboard → Data Browser。

### Q: 如何查看 Blob 中的图片？
A: Vercel Dashboard → Storage → Blob → 文件列表。

### Q: 如何清空所有留言？
A: 在 Upstash Data Browser 中删除 `guestbook-blob:messages` key。

### Q: 两个版本有什么区别？

| | Redis 版 | Blob 版 |
|---|---|---|
| 图片存储 | Redis (base64) | Vercel Blob (CDN) |
| 图片大小 | 1MB | 4MB |
| 图片过期 | 90 天 | 永久 |
| 读取速度 | 经过 API | CDN 直读 |
| 依赖 | @upstash/redis | @upstash/redis + @vercel/blob |
| 配置 | 1 个数据库 | 1 个数据库 + 1 个 Blob |
留言的文本，图片保存在哪个路径

────────────────────────────────────────


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
这个项目的文本和图片都**没有保存到磁盘**。

具体来说：

- **留言文本**：保存在 `api/messages.js` 的内存变量 `let messages = []` 里，Vercel 函数冷启动后会清空
- **图片**：在 `api/upload.js` 里转成 base64 data URL，直接嵌入留言对象中，也在内存里

这是 Serverless 架构的特点——没有持久化文件系统。

如果需要持久保存，有两个方案：

**方案一：接入 Vercel KV（Redis）**
- Vercel Dashboard → Storage → Create KV Database
- 文本用 `kv.lpush()` 存，图片用 Vercel Blob 存

**方案二：接入 Supabase（免费 PostgreSQL）**
- 创建 messages 表存文本
- 用 Supabase Storage 存图片文件

需要我帮你改成带数据库的版本吗？

代码已更新部署完成。现在需要你在 Vercel Dashboard 配置 Upstash Redis：

1. 打开 https://vercel.com/5fans-projects/guestbook/storage
2. 找到 **Upstash** → 点 **Browse** 或 **Install**
3. 会跳转到 Upstash 页面，创建一个 **Redis** 数据库：
   - 名称：`guestbook-kv`
   - 区域：选 **Asia Pacific (Tokyo)** 或最近的区域
   - 点 **Create**
4. 创建完后回到 Vercel Dashboard → Storage → 找到刚创建的 Redis 数据库
5. 点 **Connect to Project** → 选 guestbook → 勾选全部环境 → **Connect**

完成后告诉我，环境变量会自动注入。


换个方案。放弃 Vercel Blob，图片直接存 Redis（base64），不需要额外配置：



总结详细的创建编辑部署教程并制作成.md文件放在/Users/apple/Downloads/blog/8video\
,music\ box，Gitalk\ ，genxiangce，spring，guajian/source/_posts位置


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
图片接口正常，200 OK，返回 293KB 的 webp 图片。

完整地址：
https://guestbook-phi-lilac.vercel.app/api/image?id=img_moq5xs6y.webp

这是前端留言列表里自动显示的，不需要你手动拼。用户上传图片后，`script.js` 会自动用这个 URL 显示图片。

你可以打开 https://guestbook-phi-lilac.vercel.app 看看效果，那条"小白"的留言应该能看到图片。
● 文字的完整地址有吗
────────────────────────────────────────


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
有：

https://guestbook-phi-lilac.vercel.app/api/messages

，
Vercel Blob和Redis 存储图片的区别

────────────────────────────────────────


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
**Vercel Blob**：
- 专门存文件的 CDN，图片直接 URL 访问，速度快
- 1GB 免费存储，无限带宽
- 文件永久保存（除非手动删）
- 缺点：BLOB_READ_WRITE_TOKEN 需手动在 Dashboard 配置，API Token 无法自动创建

**Redis (Upstash)**：
- 通用键值数据库，存 base64 字符串，需要通过 `/api/image` 接口读取
- 256MB 免费存储，10,000 次/天
- 可设过期时间（我设了 90 天）
- 缺点：每次读图片都要经过 Serverless Function，比 CDN 慢；base64 编码比原文件大 33%

**简单说**：
- Blob = 专门存图片，快，省空间
- Redis = 通用数据库存图片，方便但慢一点

对留言板这种小场景，Redis 完全够用。图片少、访问量小，体验差别不大。

● 帮我再新建一个留言板，要求用Vercel Blob


第二个留言板
https://guestbook-blob.vercel.app

项目已创建并部署：https://guestbook-blob.vercel.app

现在需要连接数据库。让我检查现有的 Upstash Redis：
环境变量是加密的，不能直接复制。需要在 Dashboard 操作：

1. 打开 https://vercel.com/5fans-projects/guestbook-blob/storage
2. 找到 **Upstash** → 点 **Browse**
3. 找到你之前创建的 Redis 数据库 → 点 **Connect to Project**
4. 选 **guestbook-blob** → 勾选全部环境 → **Connect**

然后还需要配置 **Vercel Blob**：
1. 回到 Storage 页面
2. 找到 **Blob** → 点 **Create Database**
3. 名称：`guestbook-blob-store`
4. 点 **Create**
5. 创建后 → **Connect to Project** → 选 guestbook-blob → 全部环境 → **Connect**

完成后告诉我，我帮你重新部署。


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
看到 `BLOB_READ_WRITE_TOKEN` 已经注入了。但 Upstash Redis 的环境变量还没有。让我先重新部署让 Blob 生效：
╰────────────────────────

Blob 已经连上了，但 **Upstash Redis 还没连**。

你需要在 Dashboard 操作：
1. 打开 https://vercel.com/5fans-projects/guestbook-blob/storage
2. 找到 **Upstash** → 点 **Browse**
3. 找到你之前创建的 Redis 数据库（guestbook-kv）→ 点 **Connect to Project**
4. 选 **guestbook-blob** → 勾选全部环境 → **Connect**

完成后告诉我。

╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
点 **Upstash for Redis**。

然后会跳转到 Upstash 页面，找到你之前创建的那个 Redis 数据库（guestbook-kv），点 **Manage** → **Connect to Project** → 选 **guestbook-blob** → 勾选全部环境 → **Connect**。



选 **Pay As You Go**，不需要付款。

这个有免费额度：每天 10,000 次命令，留言板够用了。超出才收费。


就是 **Pay As You Go**。

它有免费额度：每天 10,000 次命令，256MB 存储。留言板完全免费。



/guestbook/moq7s9gl-X8MvPJ8B7s2BR2Fzn3tF610sKzn8Oq.png

https://ejndelrzy8sjglav.public.blob.vercel-storage.com/guestbook/moq7s9gl-X8MvP
J8B7s2BR2Fzn3tF610sKzn8Oq.png 点击了显示要下载吗？点击了可以打开图片吗
────────────────────────────────────────

  ┊ 💻 preparing terminal…

╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
找到原因了！Vercel Blob 默认返回 `Content-Disposition: attachment`，浏览器会下载而不是显示。

修改 `api/upload.js`，上传时加 `contentDisposition: 'inline'`：

之前上传的图片还是 `attachment`，需要重新上传一次才会变成 `inline`。你可以去留言板 https://guestbook-blob.vercel.app 重新上传一张图片测试。

旧图片还是 `attachment`。需要重新上传一张新图测试。让我直接用 API 上传测试：
╰────────────────────────────────────────────────────────────
`contentDisposition: 'inline'` 对 Vercel Blob 不起作用。换个思路——加个代理接口，强制返回 `inline`： 这个就可以了，

╰─────────────────────
╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
代理生效了。现在打开图片会直接在浏览器显示，不会下载。

测试地址：
https://guestbook-blob.vercel.app/api/image?url=https%3A%2F%2Fejndelrzy8sjglav.public.blob.vercel-storage.com%2Fguestbook%2Fmoq7s9gl-X8MvPJ8B7s2BR2Fzn3tF610sKzn8Oq.png

打开看看，应该直接显示图片了。
https://console.upstash.com/vercel/kv/d29d53b6-6fc3-4c4d-9976-436b1703cb82/data-
browser 这里的图片，打开 "imageUrl": 
"https://ejndelrzy8sjglav.public.blob.vercel-storage.com/guestbook/moq7s9gl-X8Mv
PJ8B7s2BR2Fzn3tF610sKzn8Oq.png",没有直接在浏览器显示，而是跟之前的一样出现下载。
────────────────────────────────────────


╭─ ⚕ Hermes ───────────────────────────────────────────────────────────────────╮
这是正常的。

Redis 里存的是 **原始 Blob URL**，点击它直接访问 Blob，所以还是下载。

**前端显示**已经修好了——script.js 会把 URL 包一层代理：
```
/api/image?url=https://ejndelrzy8sjglav.public.blob.vercel-storage.com/...
```

所以：
- **在 Upstash Data Browser 点 URL** → 下载（原始 Blob URL）
- **在留言板页面看图片** → 直接显示（走代理）

这是两个不同的入口，代理只在前端生效。你在留言板 https://guestbook-blob.vercel.app 看图片应该是正常显示的。




在 Vercel 添加自定义域名：

1. 打开 https://vercel.com/5fans-projects/guestbook-blob/settings/domains
2. 输入你的域名（比如 `guestbook.5fan.top`）
3. 点 **Add**
4. 按提示配置 DNS：
   - **方式一**：CNAME 记录 → `cname.vercel-dns.com`
   - **方式二**：A 记录 → `76.76.21.21`

如果你用的是 Cloudflare：
- DNS → 添加 CNAME → 名称 `guestbook` → 目标 `cname.vercel-dns.com` → 代理关闭（灰色云朵）

添加后等 1-2 分钟生效，Vercel 会自动配置 SSL 证书。




---

*教程作者：彭金涛 | 最后更新：2026-05-04*
