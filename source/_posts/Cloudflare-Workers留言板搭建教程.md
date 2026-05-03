---
title: Cloudflare Workers 留言板搭建教程
date: 2026-05-03 10:00:00
tags: [Cloudflare, Workers, KV, R2, 留言板, 前端]
categories: 技术教程
summary: 基于 Cloudflare Workers + KV + R2 从零搭建一个支持表情和图片上传的留言板应用，包含完整代码和部署流程。
---

## 目录

- [项目简介](#项目简介)
- [环境准备](#环境准备)
- [项目结构](#项目结构)
- [第一步：创建 Worker 项目](#第一步创建-worker-项目)
- [第二步：创建 KV 命名空间](#第二步创建-kv-命名空间)
- [第三步：创建 R2 存储桶](#第三步创建-r2-存储桶)
- [第四步：配置 wrangler.toml](#第四步配置-wranglertoml)
- [第五步：编写 worker.js](#第五步编写-workerjs)
- [第六步：部署](#第六步部署)
- [常见问题](#常见问题)

---

## 项目简介

基于 Cloudflare Workers + KV + R2 搭建的留言板应用：

- **Workers** — 运行后端 API 和前端页面（边缘计算，全球加速）
- **KV** — 存储留言数据（键值对数据库）
- **R2** — 存储上传的图片（对象存储）

功能：发表留言、表情选择、图片上传、图片预览

在线地址：[https://message-board-api.manle.workers.dev/](https://message-board-api.manle.workers.dev/)

---

## 环境准备

### 1. 注册 Cloudflare 账号

前往 [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 注册。

### 2. 安装 Node.js

前往 [https://nodejs.org](https://nodejs.org) 下载安装 LTS 版本。

### 3. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 4. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，确认授权即可。

验证登录：

```bash
wrangler whoami
```

---

## 项目结构

```
message-board/
├── wrangler.toml    # Cloudflare 配置文件
└── worker.js        # Worker 代码（API + 前端页面）
```

---

## 第一步：创建 Worker 项目

创建项目目录并进入：

```bash
mkdir message-board
cd message-board
```

---

## 第二步：创建 KV 命名空间

KV 用于存储留言数据。

```bash
wrangler kv namespace create "MESSAGE_BOARD"
```

输出示例：

```
✨ Success!
{
  "kv_namespaces": [
    {
      "binding": "MESSAGE_BOARD",
      "id": "a37480645370460f838dafaacc15ecc7"  ← 记下这个 ID
    }
  ]
}
```

> **重要**：记下输出的 `id`，下一步配置要用。

---

## 第三步：创建 R2 存储桶

R2 用于存储上传的图片。

```bash
wrangler r2 bucket create message-board-images
```

输出：

```
✅ Created bucket 'message-board-images'
```

---

## 第四步：配置 wrangler.toml

在项目根目录创建 `wrangler.toml`：

```toml
name = "message-board-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "MESSAGE_BOARD"
id = "你的 KV 命名空间 ID"           # ← 替换为第二步获取的 ID

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "message-board-images"
```

### 配置说明

| 字段 | 作用 |
|------|------|
| `name` | Worker 名称，也是域名前缀（`name.workers.dev`） |
| `main` | 入口文件 |
| `compatibility_date` | 运行时兼容性日期 |
| `binding` | 在代码中通过 `env.XXX` 访问资源的变量名 |
| `id` / `bucket_name` | 实际绑定的资源标识 |

---

## 第五步：编写 worker.js

### 5.1 后端 API

```javascript
const KV_NAMESPACE = 'MESSAGE_BOARD';  // 与 wrangler.toml 中的 binding 一致
const R2_BINDING = 'IMAGES';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const kv = env[KV_NAMESPACE];      // KV 命名空间
    const r2 = env[R2_BINDING];        // R2 存储桶

    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/messages - 获取所有留言
    if (request.method === 'GET' && url.pathname === '/api/messages') {
      const data = await kv.get('messages', { type: 'json' });
      return Response.json({ success: true, messages: data || [] }, { headers: corsHeaders });
    }

    // POST /api/messages - 发表留言
    if (request.method === 'POST' && url.pathname === '/api/messages') {
      const { name, content, imageKey } = await request.json();
      if (!content?.trim()) {
        return Response.json({ success: false, error: '留言内容不能为空' }, { status: 400 });
      }

      const messages = (await kv.get('messages', { type: 'json' })) || [];
      const newMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: (name || '匿名').trim().slice(0, 20),
        content: content.trim().slice(0, 500),
        imageKey: imageKey || null,
        createdAt: new Date().toISOString(),
      };

      messages.unshift(newMessage);
      if (messages.length > 1000) messages.pop();
      await kv.put('messages', JSON.stringify(messages));

      return Response.json({ success: true, message: newMessage }, { headers: corsHeaders });
    }

    // POST /api/upload - 图片上传
    if (request.method === 'POST' && url.pathname === '/api/upload') {
      const formData = await request.formData();
      const file = formData.get('image');
      if (!file || typeof file === 'string') {
        return Response.json({ success: false, error: '请选择图片' }, { status: 400 });
      }

      const ext = file.name?.split('.').pop() || 'jpg';
      const key = `img/${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}.${ext}`;

      await r2.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });

      return Response.json({ success: true, key }, { headers: corsHeaders });
    }

    // GET /api/image/:key - 图片访问
    if (request.method === 'GET' && url.pathname.startsWith('/api/image/')) {
      const key = url.pathname.slice('/api/image/'.length);
      const object = await r2.get(key);
      if (!object) return new Response('Not Found', { status: 404 });

      const headers = new Headers(corsHeaders);
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // GET / - 返回 HTML 页面
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(getHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

### 5.2 前端页面

`getHtml()` 函数返回完整的 HTML 页面，包含以下功能：

#### 表情选择器

```javascript
// 使用 Unicode 字符而非 HTML 实体（HTML 实体存入 textarea 会变成纯文本）
const EMOJIS = [
  '\u{1F60A}','\u{1F602}','\u{1F605}','\u{1F609}',  // 😊😂😄😉
  // ... 更多表情
];

// 插入到 textarea 光标位置
function insertEmoji(emoji) {
  const textarea = document.getElementById('content');
  const start = textarea.selectionStart;
  const text = textarea.value;
  textarea.value = text.slice(0, start) + emoji + text.slice(start);
}
```

#### 图片上传（前端压缩）

```javascript
async function handleFileSelect(event) {
  const file = event.target.files[0];
  // 压缩到最大 800px 宽，JPEG 质量 0.7
  const compressed = await compressImage(file, 800, 0.7);

  // 上传到 /api/upload
  const formData = new FormData();
  formData.append('image', compressed, file.name);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  // data.key 就是图片的访问路径
}

function compressImage(file, maxW, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

#### 留言展示（含图片）

```javascript
const imgHtml = msg.imageKey
  ? `<div class="message-image">
       <img src="/api/image/${msg.imageKey}" loading="lazy">
     </div>`
  : '';
```

---

## 第六步：部署

```bash
wrangler deploy
```

输出示例：

```
Your Worker has access to the following bindings:
Binding                            Resource
env.MESSAGE_BOARD (xxx)            KV Namespace
env.IMAGES (message-board-images)  R2 Bucket

Deployed message-board-api triggers
  https://message-board-api.manle.workers.dev
```

部署完成后访问 `https://你的name.workers.dev` 即可使用。

### 本地开发调试

```bash
wrangler dev
```

本地启动开发服务器，默认地址 `http://localhost:8787`。

---

## 常见问题

### 1. `kv.get is not a function`

**原因**：`wrangler.toml` 中的 `binding` 名称与代码中的不一致。

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "MESSAGE_BOARD"    # ← 必须与代码中 env["MESSAGE_BOARD"] 一致
```

```javascript
// worker.js
const KV_NAMESPACE = 'MESSAGE_BOARD';  // ← 必须与 binding 一致
const kv = env[KV_NAMESPACE];
```

### 2. `Cannot read properties of undefined (reading 'get')`

**原因**：KV 命名空间绑定未配置或绑定名称错误。检查 `wrangler.toml` 中的 `binding` 是否正确。

### 3. 表情显示为 `&#x1f60a;`

**原因**：使用了 HTML 实体而非 Unicode 字符。

```javascript
// ❌ 错误 — HTML 实体存入 textarea 变成纯文本
const emoji = '&#x1f60a;';

// ✅ 正确 — Unicode 字符
const emoji = '\u{1F60A}';
```

### 4. 部署时提示绑定冲突

本地 `wrangler.toml` 的配置会覆盖云端配置。如果云端已有绑定但名称不同，部署时会提示差异，确认即可覆盖。

### 5. R2 图片上传失败

检查 `wrangler.toml` 中 R2 配置：

```toml
[[r2_buckets]]
binding = "IMAGES"                        # 代码中 env.IMAGES
bucket_name = "message-board-images"      # 实际的桶名
```

---

## API 接口汇总

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/messages` | 获取所有留言 | — |
| POST | `/api/messages` | 发表留言 | `{ name, content, imageKey? }` |
| POST | `/api/upload` | 上传图片 | `FormData: image` |
| GET | `/api/image/:key` | 访问图片 | — |
| GET | `/` | 留言板页面 | — |

---

## 补充内容

### 留言板样式在哪里修改

样式都在 `worker.js` 的 `getHtml()` 函数里，是内嵌的 CSS。

具体位置：

| 文件 | 行号范围 | 内容 |
|------|----------|------|
| worker.js | 约第 70-170 行 | `<style>` 标签内的 CSS |

主题色修改点：

```css
/* 留言板 - 背景渐变 */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 留言板 - 按钮渐变 */
.btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 留言板 - 用户名颜色 */
.message-name { color: #667eea; }

/* 留言板 - 聚焦边框色 */
.form-group input:focus { border-color: #667eea; }
```

"今日话题"用的是粉红渐变（`#f093fb` → `#f5576c`），同样在 `worker.js` 的 `getHtml()` 中修改。

两个项目结构一样，都在各自的 `worker.js` 文件里的 `getHtml()` 函数中改 CSS。

Cloudflare 创建留言板添加表情包和上传的图片功能可以用哪些方式                 
                                                                
⏺ Cloudflare Workers 留言板实现表情和图片上传，有以下几种方式：                 
                                                                                
  表情功能                                                                      
   
  ┌──────────┬─────────────────────┬───────────────────────────────────────┐    
  │   方式   │        说明         │                优缺点                 │    
  ├──────────┼─────────────────────┼───────────────────────────────────────┤    
  │ Unicode  │ 直接用 \u{1F60A} 等 │ 最简单，无需依赖，兼容性好            │    
  │ Emoji    │  Unicode 字符       │                                       │    
  ├──────────┼─────────────────────┼───────────────────────────────────────┤    
  │ Emoji    │ 引用 emoji-mart、em │ 功能丰富（搜索、分类），但增加页面体  │
  │ Picker   │ oji-button          │ 积                                    │    
  │ 库       │ 等第三方库          │                                       │    
  ├──────────┼─────────────────────┼───────────────────────────────────────┤    
  │ 图片表情 │ 自定义表情图片存    │ 可用自定义表情（如表情包），但需额外  │    
  │ 包       │ R2，通过 URL 引用   │ 存储和加载                            │
  └──────────┴─────────────────────┴───────────────────────────────────────┘    
   
  图片上传存储                                                                  
                                                                                
  ┌──────────┬───────────────┬──────────────────────────────────────────────┐   
  │   方式   │     说明      │                    优缺点                    │   
  ├──────────┼───────────────┼──────────────────────────────────────────────┤   
  │ Cloudfla │ Worker 通过   │ 专业对象存储，免费额度大（10GB+100万次读取/  │   
  │ re R2    │ env.IMAGES.pu │ 月），推荐                                   │   
  │          │ t() 存入 R2   │                                              │   
  ├──────────┼───────────────┼──────────────────────────────────────────────┤
  │ KV 存    │ 图片转 base64 │ 实现最简单，无需额外资源，但 base64          │   
  │ Base64   │  直接存入 KV  │ 体积增大约 33%，单值上限 25MB                │   
  ├──────────┼───────────────┼──────────────────────────────────────────────┤
  │          │ 上传到        │                                              │   
  │ 外链图床 │ imgur、SM.MS  │ 不占自己的存储，但依赖第三方服务             │   
  │          │ 等图床，存    │                                              │
  │          │ URL           │                                              │   
  ├──────────┼───────────────┼──────────────────────────────────────────────┤   
  │ Cloudfla │ 使用          │                                              │
  │ re       │ Cloudflare    │ 自带裁剪/优化，但收费（$1/月/1000张）        │   
  │ Images   │ Images 服务   │                                              │
  └──────────┴───────────────┴──────────────────────────────────────────────┘   
                                                                                
  图片压缩方式                                                                  
   
  ┌──────────────────┬──────────────────────────────────────────────────────┐   
  │       方式       │                         说明                         │   
  ├──────────────────┼──────────────────────────────────────────────────────┤   
  │ 前端 Canvas 压缩 │ 用 canvas.toBlob() 在浏览器端缩放+压缩，减少上传体积 │   
  ├──────────────────┼──────────────────────────────────────────────────────┤   
  │ Worker 端压缩    │ 用 @cf/wasm/image 等在 Worker 中处理，但计算资源有限 │   
  ├──────────────────┼──────────────────────────────────────────────────────┤   
  │ 不压缩直接上传   │ 最简单，但大图会慢                                   │   
  └──────────────────┴──────────────────────────────────────────────────────┘   
                                                                                
  当前项目采用的方案                                                            
                                                                                
  - 表情：Unicode Emoji（最轻量）                                               
  - 图片存储：Cloudflare R2（最稳定）                                           
  - 图片压缩：前端 Canvas 压缩（最大 800px 宽，JPEG 质量 0.7）                  
                                                                                
  如果你想换方案或增加功能，告诉我具体需求。                                    
                                                                                
❯ 图片上传存储我用的是哪种方式                                                  
                                                                  
⏺ 用的是 Cloudflare R2。                                                        
                                                                                
  在 wrangler.toml 中配置：                                                     
   
  [[r2_buckets]]                                                                
  binding = "IMAGES"                                                            
  bucket_name = "message-board-images"                                          
                                                                                
  在 worker.js 中通过 env.IMAGES.put() 存入，env.IMAGES.get() 读取。  


https://message-board-api.manle.workers.dev 有哪些cdn加速                     
                                                                        
⏺ message-board-api.manle.workers.dev 部署在 Cloudflare Workers 上，自带        
  Cloudflare CDN 全球加速，无需额外配置。                                       
                                                                                
  已有的 CDN 加速
                                                                                
  ┌───────────────┬──────────────────────────────────────────────┬──────────┐   
  │     功能      │                     说明                     │   状态   │ 
  ├───────────────┼──────────────────────────────────────────────┼──────────┤   
  │ 全球边缘节点  │ Cloudflare 在 300+ 城市有节点，请求就近响应  │ 自动开启 │ 
  ├───────────────┼──────────────────────────────────────────────┼──────────┤   
  │ 静态资源缓存  │ HTML/JS/CSS/图片自动缓存到边缘               │ 自动开启 │   
  ├───────────────┼──────────────────────────────────────────────┼──────────┤   
  │ HTTP/2 &      │ 支持最新协议，多路复用                       │ 自动开启 │   
  │ HTTP/3        │                                              │          │   
  ├───────────────┼──────────────────────────────────────────────┼──────────┤   
  │ Brotli 压缩   │ 传输时自动压缩，比 gzip 更高效               │ 自动开启 │   
  ├───────────────┼──────────────────────────────────────────────┼──────────┤   
  │ 图片缓存      │ R2 图片设置了 Cache-Control:                 │ 已配置   │   
  │               │ max-age=31536000，浏览器和 CDN 都会缓存      │          │   
  └───────────────┴──────────────────────────────────────────────┴──────────┘   
                                                                                
  你的 Worker 代码中已做的优化                                                  
   
  // 图片访问 - 设置了 1 年缓存                                                 
  headers.set('Cache-Control', 'public, max-age=31536000');                     
                                                                                
  // CORS 头 - 允许跨域                                                         
  'Access-Control-Allow-Origin': '*'                                            
                                                                                
  如果需要更强的加速                                                            
                                                                                
  ┌─────────────────┬────────────────────────────────────────────────────────┐  
  │      方式       │                          说明                          │  
  ├─────────────────┼────────────────────────────────────────────────────────┤
  │ 自定义域名      │ 绑定自己的域名（如 msg.example.com），可开启更多       │
  │                 │ Cloudflare 功能                                        │
  ├─────────────────┼────────────────────────────────────────────────────────┤  
  │ Workers Paid    │ $5/月，CPU 时间从 10ms 提升到 30s，请求无限制          │
  │ 计划            │                                                        │  
  ├─────────────────┼────────────────────────────────────────────────────────┤  
  │ Cache API       │ 在 Worker 中用 caches.default 手动缓存动态响应         │  
  └─────────────────┴────────────────────────────────────────────────────────┘  
   
  目前免费计划已经够用，Cloudflare 的 CDN 是开箱即用的，不需要额外配置。        
                                                                        

                                                                        
### 在线地址

| 说明 | 地址 |
|------|------|
| 留言板地址 | [https://message-board-api.manle.workers.dev/](https://message-board-api.manle.workers.dev/) |
| 留言板数据 API | [https://message-board-api.manle.workers.dev/api/messages](https://message-board-api.manle.workers.dev/api/messages) |
| 今日话题地址 | [https://today-topic.manle.workers.dev/](https://today-topic.manle.workers.dev/) |
| 今日话题数据 API | [https://today-topic.manle.workers.dev/api/messages](https://today-topic.manle.workers.dev/api/messages) |

---

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [KV 文档](https://developers.cloudflare.com/kv/)
- [R2 文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
