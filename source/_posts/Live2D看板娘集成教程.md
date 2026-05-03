---
title: Live2D看板娘集成教程
date: 2026-05-02
categories: 技术教程
tags:
  - Hexo
  - Live2D
  - 看板娘
  - 前端
---

## 问题现象

博客中已经存在 `source/live2d-w/` 目录（包含 `autoload.js`、`live2d.min.js`、`waifu-tips.js` 等文件），但页面上始终不显示 Live2D 看板娘。

## 原因分析

1. **`autoload.js` 路径错误**：`live2d_path` 指向外部 CDN `https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/`，该 CDN 资源可能与本地版本不一致或已失效。
2. **未引入脚本**：`layout.ejs` 中没有加载 `autoload.js` 的 `<script>` 标签，看板娘根本没有被初始化。

## 修复步骤

### 第一步：确认文件结构

确保 `source/live2d-w/` 目录下包含以下文件：

```
source/live2d-w/
├── autoload.js        # 自动加载脚本（入口）
├── live2d.min.js      # Live2D 核心库
├── waifu-tips.js      # 对话框和按钮逻辑
├── waifu-tips.json    # 触发条件和对话文字
├── waifu.css          # 看板娘样式表
└── assets/            # 模型资源目录
```

同时在 `_config.yml` 的 `skip_render` 中确认已排除该目录（避免 Hexo 处理这些文件）：

```yaml
skip_render:
  - 'live2d-w/**'
```

### 第二步：修改 autoload.js 的路径

**文件路径：** `source/live2d-w/autoload.js`

将 `live2d_path` 从外部 CDN 改为本地路径：

```javascript
// 修改前（指向外部 CDN）
const live2d_path = "https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/";

// 修改后（指向本地目录）
const live2d_path = "/live2d-w/";
```

**注意：** 路径末尾的 `/` 不能省略。

### 第三步：在 layout.ejs 中引入 autoload.js

**文件路径：** `themes/hexo-theme-matery/layout/layout.ejs`

在 `<body>` 区域内（建议放在回到顶部按钮之前）添加：

```html
<!-- Live2D 看板娘 -->
<script src="/live2d-w/autoload.js"></script>
```

添加位置示例：

```html
<!-- Live2D 看板娘 -->
<script src="/live2d-w/autoload.js"></script>

<!-- 回到顶部按钮已由 _partial/back-top.ejs 提供 -->
```

### 第四步：验证并生成

```bash
hexo clean && hexo g && hexo s
```

打开 `http://localhost:4000`，页面右下角应该会出现 Live2D 看板娘。

## 注意事项

### 屏幕宽度限制

`autoload.js` 中有以下判断，**仅在屏幕宽度 ≥ 768px 时加载**：

```javascript
if (screen.width >= 768) {
    // 加载看板娘
}
```

所以在手机上不会显示，这是正常行为。

### Font Awesome 依赖

Live2D 对话框中的按钮图标依赖 Font Awesome。`hexo-theme-matery` 主题已内置 Font Awesome，无需额外加载。如果使用其他主题，需要在 `<head>` 中添加：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome/css/font-awesome.min.css">
```

### 自定义对话内容

编辑 `source/live2d-w/waifu-tips.json` 可以自定义看板娘的对话内容和触发条件。该文件定义了 `selector`（CSS 选择器）和 `text`（显示文字）。

### 模型更换

`autoload.js` 中的 `cdnPath` 参数指定模型加载地址：

```javascript
cdnPath: "https://cdn.jsdelivr.net/gh/fghrsh/live2d_api/"
```

如需更换模型，可修改此地址或自行搭建 API 后端。

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `source/live2d-w/autoload.js` | `live2d_path` 从外部 CDN 改为本地 `/live2d-w/` |
| `themes/hexo-theme-matery/layout/layout.ejs` | 添加 `<script src="/live2d-w/autoload.js"></script>` |

## 效果验证

1. 生成博客后访问首页
2. 屏幕宽度 ≥ 768px 时，页面右下角出现看板娘
3. 点击看板娘可触发对话和交互
