---
title: Hexo Matery 音乐页面添加 Twikoo 留言、后台管理与登录功能教程
date: 2026-04-16 10:00:00
tags: [Hexo, Twikoo, 评论系统, Vercel]
categories: 技术教程
summary: 在 Hexo Matery 主题的 /musics/ 页面集成 Twikoo 评论系统，实现留言、后台数据管理和管理员登录功能。
---

## 一、Twikoo 是什么

Twikoo 是一个简洁、安全的静态网站评论系统，基于 Vercel 云函数部署。它提供三大核心功能：

| 功能 | 说明 |
|------|------|
| **留言** | 访客填写昵称/邮箱即可留言，支持 Markdown、表情、图片上传 |
| **后台管理** | 管理员可登录后台面板，审核/删除/置顶/隐藏评论 |
| **登录认证** | 管理员通过密码登录评论区，获得管理权限；普通用户无需登录即可留言 |

---

## 二、项目中 Twikoo 的现有配置

本项目的 Twikoo 已经部署并配置完成，无需额外安装。

### 2.1 后端部署

Twikoo 后端部署在 Vercel，地址为：

```
https://twikoo100-tiandoo.vercel.app
```

这个地址同时也是后台管理面板的入口。

### 2.2 主题配置

文件：`themes/hexo-theme-matery/_config.yml`

```yaml
twikoo:
  enable: true
  envId: https://twikoo100-tiandoo.vercel.app
  # region: ap-guangzhou
  # path: 'window.location.pathname'
```

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `enable` | `true` | 启用 Twikoo |
| `envId` | Vercel 部署 URL | Twikoo 后端地址 |
| `region` | 留空 | 自动检测（Vercel 部署不需要） |
| `path` | 留空 | 默认使用 `window.location.pathname` 区分不同页面 |

### 2.3 JS 加载方式

```yaml
# _config.yml libs.js 部分
twikoo: https://cdn.jsdelivr.net/npm/twikoo/dist/twikoo.all.min.js
```

从 jsDelivr CDN 加载，自动获取最新版本。

### 2.4 评论模板

文件：`themes/hexo-theme-matery/layout/_partial/twikoo.ejs`

该模板包含三部分：
1. **CSS 样式**（约 245 行）：评论区排版、代码高亮、表格、引用等样式
2. **HTML 结构**：Materialize 卡片容器 + `#tcomments` 挂载点
3. **JS 初始化**：加载 Twikoo SDK 并初始化，修复 Materialize CSS 兼容问题

---

## 三、在 musics 页面集成 Twikoo

### 3.1 修改文件

文件：`themes/hexo-theme-matery/layout/musics.ejs`

### 3.2 添加代码

在 `</article>` 闭合标签之后，添加：

```ejs
<% if (theme.twikoo && theme.twikoo.enable) { %>
    <%- partial('_partial/twikoo') %>
<% } %>
```

### 3.3 完整代码上下文

```html
            </div>
        </div>
    </div>
</article>

<!-- 以下为新增的 Twikoo 留言区 -->
<% if (theme.twikoo && theme.twikoo.enable) { %>
    <%- partial('_partial/twikoo') %>
<% } %>
```

### 3.4 工作原理

1. `theme.twikoo.enable` — 检查主题配置中 Twikoo 是否启用
2. `partial('_partial/twikoo')` — 引入 Twikoo 评论模板
3. Twikoo 模板自动：
   - 加载 CSS 样式
   - 渲染评论卡片和 `#tcomments` 容器
   - 从 CDN 加载 `twikoo.all.min.js`
   - 调用 `twikoo.init()` 连接 Vercel 后端
   - 修复 Materialize 输入框兼容问题

---

## 四、Twikoo 的三大功能详解

### 4.1 留言功能

访客在评论区可以：

- 填写**昵称**（必填）、**邮箱**（可选）、**网址**（可选）
- 使用 **Markdown** 语法编写评论内容
- 插入**表情包**（内置表情面板）
- **上传图片**（如果后端配置了图床）
- 收到评论**邮件通知**（需后台配置 SMTP）

每个页面的评论独立存储，通过 `window.location.pathname`（即 `/musics/`）区分。

### 4.2 后台数据管理

访问 Twikoo 后端地址即可进入管理面板：

```
https://twikoo100-tiandoo.vercel.app
```

管理面板功能：

| 功能 | 说明 |
|------|------|
| 查看所有评论 | 按页面、时间筛选 |
| 删除评论 | 移除违规或垃圾评论 |
| 置顶评论 | 将重要评论置顶显示 |
| 隐藏评论 | 隐藏但不删除 |
| 导出数据 | 导出评论数据备份 |
| 配置通知 | 设置邮件/微信/Telegram 通知 |
| 反垃圾设置 | 配置 Akismet 等反垃圾策略 |

### 4.3 登录功能

Twikoo 的登录分两个层级：

#### 管理员登录

1. 在评论区点击**齿轮图标**（设置按钮）
2. 首次使用需**设置管理密码**
3. 输入密码登录后，评论区出现管理功能按钮
4. 可直接在评论区内删除/置顶/隐藏评论

#### 普通访客

- **无需登录**即可留言
- 填写昵称和邮箱后提交评论
- 邮箱用于接收回复通知和显示 Gravatar 头像

---

## 五、Twikoo init() 初始化参数详解

```javascript
twikoo.init({
    envId: 'https://twikoo100-tiandoo.vercel.app',  // 后端地址
    el: '#tcomments',      // 挂载的 DOM 元素
    region: undefined,     // 地区（Vercel 部署不需要）
    path: undefined        // 页面路径（默认 location.pathname）
})
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `envId` | String | Vercel 部署 URL 或腾讯云环境 ID |
| `el` | String | CSS 选择器，指定评论区挂载位置 |
| `region` | String | 腾讯云地区（Vercel 部署留空） |
| `path` | String | 页面唯一标识，默认 `location.pathname` |

`path` 参数决定了评论的归属页面。`/musics/` 页面的评论只会显示在 `/musics/` 下，不会与其他页面混淆。

---

## 六、引入模式对比

Twikoo 在不同页面的引入方式完全一致：

| 页面 | 文件 | 引入代码 |
|------|------|---------|
| 文章详情页 | `_partial/post-detail.ejs:193-195` | `<%- partial('_partial/twikoo') %>` |
| 音乐页面 | `layout/musics.ejs` | `<%- partial('_partial/twikoo') %>` |
| 其他自定义页面 | 对应 layout 文件 | 同上 |

所有页面共享同一个 `_partial/twikoo.ejs` 模板，Twikoo 通过 `path` 自动区分不同页面的评论数据。

---

## 七、如需在其他页面也添加 Twikoo

只需在对应的 EJS 模板文件末尾（`</article>` 或 `</main>` 之后）添加：

```ejs
<% if (theme.twikoo && theme.twikoo.enable) { %>
    <%- partial('_partial/twikoo') %>
<% } %>
```

例如为 `/text/` 页面添加，修改 `layout/page.ejs`；为 `/friends/` 页面添加，修改 `layout/friends.ejs`。

---

## 八、常见问题

### Q: 评论区没有显示？

检查 `_config.yml` 中 `twikoo.enable` 是否为 `true`，以及 `envId` 是否正确。

### Q: 如何重置管理员密码？

访问 Vercel 项目的环境变量设置，或通过 Twikoo 后台面板重置。

### Q: 评论数据存储在哪里？

存储在 Vercel 部署的云函数关联的数据库中（MongoDB Atlas 或 Vercel KV）。

### Q: 不同页面的评论会混在一起吗？

不会。Twikoo 通过 `path`（默认为 `window.location.pathname`）区分，`/musics/` 和 `/artitalk/` 的评论完全独立。
