---
title: Node.js 留言板部署到 Render 教程
date: 2026-05-05 14:42:00
tags:
  - 留言板
  - Render
  - Node.js
  - Express
categories:
  - 建站教程
---

# Node.js 留言板部署到 Render 教程

基于 Node.js + Express 搭建的留言板应用，免费部署到 Render 平台，支持图片上传、头像、管理员面板、背景自定义等功能。

<!-- more -->

## 目录

- [项目简介](#项目简介)
- [功能列表](#功能列表)
- [技术栈](#技术栈)
- [第一步：创建项目文件](#第一步创建项目文件)
- [第二步：本地运行测试](#第二步本地运行测试)
- [第三步：推送到 GitLab](#第三步推送到-gitlab)
- [第四步：部署到 Render](#第四步部署到-render)
- [第五步：配置管理员密码](#第五步配置管理员密码)
- [功能详解](#功能详解)
- [API 接口文档](#api-接口文档)
- [常见问题](#常见问题)

---

## 项目简介

一个轻量级留言板应用，特点：

- 🚀 **零数据库** — JSON 文件持久化存储
- 📷 **图片本地存储** — 不依赖外部图床，国内直接访问
- 🎨 **背景自定义** — 8 种预设主题 + 自定义颜色
- 🔑 **管理员面板** — 网页端编辑/删除/数据管理
- 👤 **用户头像** — 支持上传头像或自动生成首字头像
- 💰 **完全免费** — Render Free Tier，无需付费

**在线演示：** https://message-board-render.onrender.com

---

## 功能列表

| 功能 | 说明 |
|------|------|
| 发表留言 | 昵称（可选）+ 内容 + 图片 + 头像 |
| 表情选择器 | 64 个常用 emoji |
| 图片上传 | 前端自动压缩，最大 5MB |
| 用户头像 | 上传头像图片，或自动用昵称首字生成 |
| 管理员面板 | 登录后可编辑/删除任意留言 |
| 数据管理 | 导出备份 / 导入恢复 / 清空全部 |
| 背景自定义 | 8 种预设主题 + 自定义渐变/纯色 |
| 标题自定义 | 修改留言板标题（支持 emoji） |
| 分页浏览 | 每页 20 条，支持翻页 |
| 图片大图查看 | 点击图片弹出大图 |

---

## 技术栈

| 组件 | 说明 |
|------|------|
| **Runtime** | Node.js 18+ |
| **框架** | Express 4.x |
| **文件上传** | Multer（磁盘存储） |
| **数据存储** | JSON 文件（data.json） |
| **图片存储** | 服务器本地 uploads/ 目录 |
| **部署平台** | Render（Free Tier） |

---

## 第一步：创建项目文件

### 1.1 创建项目目录

```bash
mkdir message-board-render
cd message-board-render
```

### 1.2 创建 package.json

```json
{
  "name": "message-board",
  "version": "1.0.0",
  "description": "留言板 - Deployed on Render",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.21.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

### 1.3 创建 render.yaml

```yaml
services:
  - type: web
    name: message-board
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: ADMIN_KEY
        generateValue: true
```

### 1.4 创建 .gitignore

```
node_modules/
data.json
uploads/
.DS_Store
```

### 1.5 创建 server.js

完整代码较长，以下是核心结构说明：

```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ADMIN_KEY = process.env.ADMIN_KEY || '';

// 数据存储
let messages = [];
let nextId = 1;
let settings = {
  bgType: 'gradient',
  bgFrom: '#0f0f23',
  bgTo: '#1a1a3e',
  bgAngle: 135,
  cardBg: '#1a1a2e',
  accentColor: '#64ffda',
  title: '💬 留言板',
};
```

**Multer 配置（磁盘存储）：**

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只支持图片文件'));
  }
});
```

**API 路由：**

```javascript
// 获取留言列表
app.get('/api/messages', ...)

// 发表留言（支持图片+头像上传）
app.post('/api/messages', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]), ...)

// 修改留言（管理员）
app.put('/api/messages/:id', requireAdmin, ...)

// 删除留言（管理员）
app.delete('/api/messages/:id', requireAdmin, ...)

// 背景设置（公开读取，管理员修改）
app.get('/api/settings', ...)
app.put('/api/settings', requireAdmin, ...)

// 数据管理（管理员）
app.get('/api/admin/export', requireAdmin, ...)
app.post('/api/admin/import', requireAdmin, ...)
app.delete('/api/admin/clear', requireAdmin, ...)
app.get('/api/admin/stats', requireAdmin, ...)
```

**管理员验证中间件：**

```javascript
function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) return next();
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key === ADMIN_KEY) return next();
  res.status(403).json({ success: false, error: '需要管理员密码' });
}
```

**静态文件服务（图片访问）：**

```javascript
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '1d',
  immutable: true
}));
```

**前端页面：**

前端 HTML 内嵌在 `getHtml()` 函数中，包含：

- 留言表单（昵称 + 头像 + 内容 + 图片）
- 表情选择器
- 留言列表（带头像、图片、管理按钮）
- 管理员面板（外观设置 + 数据管理）
- CSS 变量支持动态主题切换

---

## 第二步：本地运行测试

### 2.1 安装依赖

```bash
cd message-board-render
npm install
```

### 2.2 启动服务

```bash
npm start
# 或
node server.js
```

输出：`留言板已启动 → http://localhost:3000`

### 2.3 测试 API

```bash
# 发表留言
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","content":"Hello World"}'

# 获取留言
curl http://localhost:3000/api/messages

# 上传图片留言
curl -X POST http://localhost:3000/api/messages \
  -F "name=小明" \
  -F "content=带图留言" \
  -F "image=@/path/to/photo.jpg"

# 上传带头像的留言
curl -X POST http://localhost:3000/api/messages \
  -F "name=小红" \
  -F "content=带头像" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "image=@/path/to/photo.jpg"
```

### 2.4 浏览器访问

打开 http://localhost:3000 查看留言板页面。

---

## 第三步：推送到 GitLab

### 3.1 初始化 Git 仓库

```bash
cd message-board-render
git init
git add -A
git commit -m "feat: 留言板初始版本"
```

### 3.2 在 GitLab 创建仓库

1. 登录 https://gitlab.com
2. 点击 **New Project** → **Create blank project**
3. 项目名：`message-board-render`
4. Visibility：Public
5. 取消勾选 "Initialize repository with a README"
6. 点 **Create project**

### 3.3 推送代码

```bash
git remote add origin https://gitlab.com/你的用户名/message-board-render.git
git branch -M main
git push -u origin main
```

如果使用 Personal Access Token：

```bash
git remote add origin https://用户名:token@gitlab.com/用户名/message-board-render.git
git push -u origin main
```

---

## 第四步：部署到 Render

### 4.1 注册 Render 账号

1. 打开 https://dashboard.render.com
2. 使用 Google 或 GitHub 账号登录
3. 创建 Workspace（随便填个名字）

### 4.2 连接 GitLab

1. 点击右上角头像 → **Connected Accounts**
2. 连接 GitLab 账号，授权 Render 访问你的仓库

### 4.3 创建服务

1. 点击 **New** → **Blueprint**
2. 选择 `fuliefu/message-board-render`（你的仓库）
3. Render 自动读取 `render.yaml` 配置
4. 点击 **Apply** 创建服务
5. 等待 2-3 分钟部署完成

### 4.4 获取部署地址

部署完成后，Render 会分配一个地址：

```
https://message-board-render.onrender.com
```
部署完成后，Render 会分配一个地址：                                           
                                                                                
```                                                                             
https://message-board-render.onrender.com                                       
那么怎样修改message-board名称更换为aishuij    



### 4.5 自动部署

之后每次 `git push` 到 GitLab，Render 会自动检测并重新部署。

也可以手动部署：进入服务页面 → **Manual Deploy** → **Deploy latest commit**。

---

## 第五步：配置管理员密码

### 5.1 设置环境变量

1. 进入 Render 服务页面 → **Environment**
2. 找到 `ADMIN_KEY`（render.yaml 中 `generateValue: true` 会自动生成）
3. 如果没有，手动添加：
   - Key: `ADMIN_KEY`
   - Value: `你的密码`（如 `1234`）
4. 点 **Save, rebuild, and deploy**

### 5.2 登录管理员

1. 打开留言板页面
2. 顶部有 **🔑 管理员密码** 输入框
3. 输入密码，点击 **登录**
4. 登录成功后显示 **✅ 已登录**

### 5.3 管理员功能

登录后每条留言下方出现操作按钮：

| 功能 | 说明 |
|------|------|
| ✏️ 编辑 | 修改留言昵称和内容 |
| 🗑️ 删除 | 删除该条留言 |
| 🎨 外观设置 | 修改标题、背景、颜色 |
| 📊 数据管理 | 导出/导入/清空数据 |

---

## 功能详解

### 留言发布

- **昵称**：可选，不填则显示"匿名"
- **头像**：可选，点击头像区域上传图片，不上传则自动用昵称首字生成渐变头像
- **内容**：必填（除非上传了图片），最长 1000 字
- **图片**：可选，前端自动压缩到 1200px 宽，最大 5MB

### 表情选择器

点击 😊 按钮打开表情面板，包含 64 个常用 emoji：

- 人脸表情：😀😂🤣😊😍😘😜🤔😎🥳😱😭
- 手势：👍👎👏🙌🤝👋✌️🤞
- 心形：❤️💔💯
- 庆祝：🎉🎊🎁⭐🌟🔥
- 食物：🍎🍕🍔🍟🍺☕🍰
- 其他：🚀✈️🎵🎮⚽🏀

### 背景自定义

管理员登录后，在 **🎨 外观设置** 面板中：

**8 种预设主题：**

| 主题 | 背景色 | 卡片色 | 强调色 |
|------|--------|--------|--------|
| 深蓝 | #0f0f23 → #1a1a3e | #1a1a2e | #64ffda |
| 暗紫 | #1a0a2e → #2d1b4e | #241540 | #e040fb |
| 森林 | #0a1f0a → #1a3a1a | #152a15 | #69f0ae |
| 日落 | #1a0a00 → #3a1a0a | #2a1508 | #ffab40 |
| 海洋 | #0a1a2e → #0a2a4a | #0c1f35 | #40c4ff |
| 玫瑰 | #2a0a1a → #4a1a2a | #351525 | #ff80ab |
| 极简白 | #f5f5f5 → #e0e0e0 | #ffffff | #1976d2 |
| 纯黑 | #000000 → #111111 | #1a1a1a | #ffffff |

**自定义选项：**

- **背景色 1 + 色 2**：渐变双色（颜色选择器）
- **渐变角度**：0-360 度
- **卡片背景色**：留言卡片的背景颜色
- **强调色**：按钮、标题、用户名等重点元素的颜色

操作流程：
1. 点预设主题即时预览
2. 或手动调整颜色和角度
3. 点 **👁️ 预览** 查看效果
4. 满意后点 **💾 保存设置**
5. 所有访客都会看到新背景

### 标题自定义

在外观设置面板顶部，可以修改留言板标题：

- 最长 30 个字符
- 支持 emoji（如 `💬 我的留言板`、`🏠 家庭公告板`）
- 保存后页面标题和浏览器标签页标题同步更新

### 数据管理

管理员登录后，在 **📊 数据管理** 面板中：

| 功能 | 说明 |
|------|------|
| 📦 导出备份 | 下载 JSON 文件到本地（含所有留言+设置） |
| 📥 导入数据 | 从备份文件恢复（覆盖当前数据） |
| 🗑️ 清空全部 | 删除所有留言和图片（需输入密码确认） |
| 📊 统计信息 | 显示留言数、图片数、占用空间 |

**备份文件格式：**

```json
{
  "messages": [
    {
      "id": 1,
      "name": "小明",
      "content": "Hello World",
      "imageUrl": "/uploads/abc123.jpg",
      "avatarUrl": "/uploads/def456.jpg",
      "createdAt": "2026-05-05T06:00:00.000Z"
    }
  ],
  "nextId": 2,
  "settings": {
    "bgType": "gradient",
    "bgFrom": "#0f0f23",
    "bgTo": "#1a1a3e",
    "bgAngle": 135,
    "cardBg": "#1a1a2e",
    "accentColor": "#64ffda",
    "title": "💬 留言板"
  },
  "exportedAt": "2026-05-05T12:00:00.000Z"
}
```

---

## API 接口文档

### 留言接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/messages` | 获取留言列表 | 无 |
| POST | `/api/messages` | 发表留言 | 无 |
| GET | `/api/messages/:id` | 获取单条留言 | 无 |
| PUT | `/api/messages/:id` | 修改留言 | 🔒 管理员 |
| DELETE | `/api/messages/:id` | 删除留言 | 🔒 管理员 |

**GET /api/messages 参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页条数 |

**POST /api/messages 请求体（FormData）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 昵称（最长 20 字） |
| content | string | 否* | 内容（最长 1000 字） |
| image | File | 否 | 图片（最大 5MB） |
| avatar | File | 否 | 头像（最大 5MB） |

*content 和 image 至少填一个

**PUT /api/messages/:id 请求体（JSON）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 新昵称 |
| content | string | 新内容 |

### 设置接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/settings` | 获取设置 | 无 |
| PUT | `/api/settings` | 修改设置 | 🔒 管理员 |

**PUT /api/settings 请求体（JSON）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| bgType | string | 背景类型（gradient/solid） |
| bgFrom | string | 渐变起始色（HEX） |
| bgTo | string | 渐变结束色（HEX） |
| bgAngle | number | 渐变角度（0-360） |
| cardBg | string | 卡片背景色（HEX） |
| accentColor | string | 强调色（HEX） |
| title | string | 留言板标题（最长 30 字） |

### 数据管理接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/admin/export` | 导出全部数据 | 🔒 管理员 |
| POST | `/api/admin/import` | 导入数据（覆盖） | 🔒 管理员 |
| DELETE | `/api/admin/clear` | 清空所有留言 | 🔒 管理员 |
| GET | `/api/admin/stats` | 统计信息 | 🔒 管理员 |

### 其他接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/uploads/:filename` | 访问上传的图片 |

### 认证方式

需要管理员权限的接口，在请求头中带上密码：

```
X-Admin-Key: 你的密码
```

或通过 URL 参数：

```
?key=你的密码
```

### 使用示例

```bash
# 管理员修改留言
curl -X PUT https://your-app.onrender.com/api/messages/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 1234" \
  -d '{"content":"修改后的内容","name":"新名字"}'

# 管理员删除留言
curl -X DELETE https://your-app.onrender.com/api/messages/1 \
  -H "X-Admin-Key: 1234"

# 管理员导出数据
curl https://your-app.onrender.com/api/admin/export \
  -H "X-Admin-Key: 1234" \
  -o backup.json

# 管理员导入数据
curl -X POST https://your-app.onrender.com/api/admin/import \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 1234" \
  -d @backup.json

# 管理员修改背景
curl -X PUT https://your-app.onrender.com/api/settings \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 1234" \
  -d '{"bgFrom":"#1a0a2e","bgTo":"#2d1b4e","accentColor":"#e040fb"}'

# 管理员修改标题
curl -X PUT https://your-app.onrender.com/api/settings \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: 1234" \
  -d '{"title":"🏠 我的留言板"}'
```

---

## 项目文件结构

```
message-board-render/
├── server.js          # Express 后端 + 内嵌前端 HTML/CSS/JS
├── package.json       # 依赖配置
├── render.yaml        # Render 部署配置
├── .gitignore         # Git 忽略文件
├── README.md          # 项目说明
├── data.json          # 数据文件（自动生成，不提交 Git）
└── uploads/           # 上传的图片目录（自动生成，不提交 Git）
    ├── abc123.jpg     # 留言图片
    └── def456.png     # 头像图片
```

---

## 常见问题

### 1. Render Free Tier 有什么限制？

- **休眠**：15 分钟无请求后休眠，首次访问需等 30 秒冷启动
- **数据持久化**：重新部署会清空 data.json 和 uploads/ 目录
- **带宽**：100 GB/月
- **构建时间**：750 分钟/月

**建议**：定期使用管理员面板的"导出备份"功能备份数据。

### 2. 如何避免数据丢失？

定期导出备份：
1. 登录管理员
2. 点击 **📦 导出备份**
3. 保存 JSON 文件到本地

恢复数据：
1. 登录管理员
2. 点击 **📥 导入数据**
3. 选择之前导出的 JSON 文件

### 3. 图片上传失败怎么办？

- 检查文件大小是否超过 5MB
- 确认文件是图片格式（jpg/png/gif/webp）
- Render Free Tier 的 uploads/ 目录在重新部署后会清空

### 4. 如何修改管理员密码？

1. 进入 Render 服务页面 → **Environment**
2. 修改 `ADMIN_KEY` 的值
3. 点 **Save, rebuild, and deploy**

### 5. 如何使用自定义域名？

1. 进入 Render 服务页面 → **Settings**
2. 找到 **Custom Domains**
3. 添加你的域名
4. 按提示配置 DNS 记录（CNAME 指向 `.onrender.com`）

### 6. 如何查看服务器日志？

1. 进入 Render 服务页面 → **Logs**
2. 可以看到实时日志和历史日志

### 7. 如何更新代码？

```bash
# 修改代码后
git add -A
git commit -m "更新说明"
git push
# Render 自动检测并重新部署
```

### 8. 数据存储在哪里？

| 数据 | 存储位置 | 持久性 |
|------|----------|--------|
| 留言文字 | 服务器 data.json | 重新部署后丢失 |
| 上传图片 | 服务器 uploads/ | 重新部署后丢失 |
| 背景设置 | 服务器 data.json | 重新部署后丢失 |

### 9. 如何迁移到其他平台？

1. 使用管理员面板导出数据
2. 在新平台部署相同的代码
3. 使用管理员面板导入数据
4. 图片需要手动复制 uploads/ 目录

附件
render留言板不收费，Free 就是免费的。

$0/月 = 免费，512MB 内存 + 0.1 CPU，够留言板用了。

你现在用的就是这个 Free Tier，不需要改。直接下一步就行。
---

## 相关资源

- [Render 官方文档](https://render.com/docs)
- [Express.js 文档](https://expressjs.com/)
- [Multer 文档](https://github.com/expressjs/multer)
- [GitLab CI/CD](https://docs.gitlab.com/ci/)

---

## 更新日志

### 2026-05-05

- 初始版本发布
- 支持留言、图片上传、头像、表情
- 管理员面板（编辑/删除/数据管理）
- 背景自定义（8 种预设 + 自定义颜色）
- 标题自定义
- 部署到 Render Free Tier
