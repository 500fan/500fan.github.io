---
title: Zeabur 留言板部署教程（Express + Redis，国内可访问）
date: 2026-05-04 00:30:00
tags:
  - zeabur
  - 留言板
  - express
  - redis
  - 国内部署
categories:
  - 教程
description: 使用 Zeabur 部署留言板，Express + Redis，中国大陆直接访问
---

# Zeabur 留言板部署教程（Express + Redis，国内可访问）

## 一、为什么用 Zeabur？

| 平台 | 国内访问 | 免费额度 | 特点 |
|------|----------|----------|------|
| Vercel | 不稳定 | 有 | Serverless，功能强 |
| Cloudflare Workers | `*.workers.dev` 被墙 | 无限 | 需要自定义域名 |
| **Zeabur** | **快** | **有** | **中国平台，国内直连** |

Zeabur 是中国平台，`*.zeabur.app` 域名国内可以直接访问，不需要自定义域名。

## 二、技术栈

- **后端**：Express.js（Node.js）
- **数据库**：Redis（Zeabur 内置）
- **图片存储**：Redis（base64，90 天过期）
- **部署平台**：Zeabur（中国区域）

## 三、项目结构

```
guestbook-zeabur/
├── public/
│   ├── index.html      # 主页面
│   ├── style.css       # 样式
│   └── script.js       # 前端逻辑
├── server.js           # Express 后端
├── package.json        # 依赖
└── README.md           # 说明
```

## 四、核心代码

### 4.1 `server.js`

```javascript
const express = require('express');
const Redis = require('ioredis');
const path = require('path');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Redis 连接
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const KV_KEY = 'guestbook:messages';
const MAX_MESSAGES = 500;

// GET: 获取所有留言
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await redis.lrange(KV_KEY, 0, -1);
    const parsed = messages.map(m => JSON.parse(m));
    res.json(parsed);
  } catch (err) {
    console.error('GET Error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST: 发布新留言
app.post('/api/messages', async (req, res) => {
  try {
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

    await redis.lpush(KV_KEY, JSON.stringify(message));
    const len = await redis.llen(KV_KEY);
    if (len > MAX_MESSAGES) {
      await redis.ltrim(KV_KEY, 0, MAX_MESSAGES - 1);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('POST Error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// DELETE: 删除留言
app.delete('/api/messages', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: '缺少留言 ID' });

    const messages = await redis.lrange(KV_KEY, 0, -1);
    const filtered = messages.filter(m => JSON.parse(m).id !== id);

    if (filtered.length === messages.length) {
      return res.status(404).json({ error: '留言不存在' });
    }

    await redis.del(KV_KEY);
    if (filtered.length > 0) {
      await redis.lpush(KV_KEY, ...filtered.reverse());
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE Error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST: 上传图片（存 Redis，base64）
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, base64, data } = req.body;
    const fileData = base64 || data;

    if (!filename || !fileData) {
      return res.status(400).json({ error: '缺少文件数据' });
    }

    const sizeKB = Math.round((fileData.length * 3) / 4 / 1024);
    if (sizeKB > 1024) {
      return res.status(400).json({ error: '图片不能超过 1MB' });
    }

    const ext = filename.split('.').pop().toLowerCase() || 'png';
    const imageId = `img_${Date.now().toString(36)}.${ext}`;

    // 存入 Redis，90 天过期
    await redis.set(imageId, fileData, 'EX', 7776000);

    const protocol = req.secure ? 'https' : 'http';
    const url = `${protocol}://${req.headers.host}/api/image?id=${imageId}`;

    res.json({ url });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: '上传失败' });
  }
});

// GET: 读取图片（强制 inline 显示）
app.get('/api/image', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '缺少图片 ID' });

    const base64Data = await redis.get(id);
    if (!base64Data) {
      return res.status(404).json({ error: '图片不存在或已过期' });
    }

    const ext = id.split('.').pop().toLowerCase();
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const contentType = mimeMap[ext] || 'image/png';

    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Image Error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**关键点**：
- `express.static` 提供前端静态文件
- `ioredis` 连接 Zeabur 的 Redis
- 图片存 Redis（base64），通过 `/api/image` 读取
- `Content-Disposition: inline` 强制图片在浏览器显示，不下载

### 4.2 `package.json`

```json
{
  "name": "guestbook-zeabur",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ioredis": "^5.3.2"
  }
}
```

### 4.3 `public/index.html`

前端页面，与 Vercel 版本相同。

### 4.4 `public/script.js`

前端逻辑，与 Vercel 版本相同。图片 URL 直接使用 `/api/image?id=xxx` 格式。

### 4.5 `public/style.css`

样式文件，与 Vercel 版本相同。

## 五、部署步骤

### 5.1 注册 Zeabur 账号

1. 打开 https://zeabur.com
2. 点 **Sign Up**
3. 用 **GitHub 账号** 登录

### 5.2 创建项目

1. 登录后点 **Create Project**
2. 名称：`guestbook`
3. 区域：选择 **China**（国内最快）

### 5.3 添加 Redis 数据库

1. 在项目页面点 **Add Service**
2. 选择 **Database** → **Redis**
3. 等待创建完成（约 1 分钟）

### 5.4 部署后端

1. 在项目页面点 **Add Service**
2. 选择 **Git**
3. 连接你的 GitHub 账号
4. 选择 `guestbook-zeabur` 仓库
5. 点 **Deploy**

### 5.5 配置环境变量

1. 在服务页面点 **Environment**
2. 添加变量：
   - `REDIS_URL` = Redis 连接地址

**获取 Redis 连接地址**：
1. 点击 Redis 服务
2. 点 **Connect** 标签
3. 复制 `REDIS_URL` 的值

### 5.6 绑定域名（可选）

1. 在服务页面点 **Networking**
2. 点 **Generate Domain** 生成免费域名（如 `guestbook-xxx.zeabur.app`）
3. 或绑定自定义域名

## 六、API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages` | GET | 获取所有留言 |
| `/api/messages` | POST | 发布新留言 |
| `/api/messages` | DELETE | 删除留言 |
| `/api/upload` | POST | 上传图片 |
| `/api/image?id=xxx` | GET | 读取图片（inline 显示） |

## 七、免费额度

Zeabur Free Plan：
- 512MB 内存
- 1GB 磁盘
- 100GB 流量/月
- Redis：256MB

留言板完全免费。

## 八、与 Vercel 版本的区别

| 功能 | Vercel 版 | Zeabur 版 |
|------|-----------|-----------|
| 后端 | Serverless Function | Express 服务器 |
| 数据库 | Upstash Redis | Zeabur Redis |
| 图片存储 | Vercel Blob CDN | Redis（base64） |
| 图片代理 | 需要 `/api/image?url=xxx` | 直接 `/api/image?id=xxx` |
| 国内访问 | 不稳定 | 快 |
| 免费额度 | 有 | 有 |

## 九、常见问题

### Q: 部署后访问报错？
A: 检查环境变量 `REDIS_URL` 是否正确配置。

### Q: 图片上传失败？
A: 图片大小限制 1MB（Redis 存储限制）。压缩图片后再上传。

### Q: 国内访问速度如何？
A: Zeabur 中国区域国内访问很快，比 Vercel 稳定。

### Q: 可以绑定自定义域名吗？
A: 可以。在服务页面点 **Networking** → **Custom Domain**。

### Q: 数据会丢失吗？
A: Redis 数据持久化，不会丢失。图片 90 天过期。

## 十、项目地址

- 源码：https://github.com/你的用户名/guestbook-zeabur
- 演示：https://guestbook-xxx.zeabur.app

---

*教程完成于 2026 年 5 月*
