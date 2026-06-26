---
title: Hexo zhaoo 博客完整搭建与 GitLab Pages 部署教程
date: 2026-05-08 14:30:00
tags: [Hexo, GitLab, GitLab Pages, zhaoo, 博客, 部署]
categories: 技术教程
summary: 从零开始使用 Hexo + zhaoo 主题搭建个人博客，并部署到 GitLab Pages 的完整教程，包含环境准备、项目创建、主题配置、CI/CD 部署、常见问题排查。
---

## 目录

- [项目简介](#项目简介)
- [环境准备](#环境准备)
- [第一步：安装 Hexo](#第一步安装-hexo)
- [第二步：创建 Hexo 项目](#第二步创建-hexo-项目)
- [第三步：安装 zhaoo 主题](#第三步安装-zhaoo-主题)
- [第四步：配置 zhaoo 主题](#第四步配置-zhaoo-主题)
- [第五步：创建文章与页面](#第五步创建文章与页面)
- [第六步：本地预览](#第六步本地预览)
- [第七步：推送到 GitLab](#第七步推送到-gitlab)
- [第八步：配置 GitLab CI/CD](#第八步配置-gitlab-cicd)
- [第九步：启用 GitLab Pages](#第九步启用-gitlab-pages)
- [第十步：自定义域名（可选）](#第十步自定义域名可选)
- [常见问题与排查](#常见问题与排查)
- [完整配置参考](#完整配置参考)

---

## 项目简介

本教程使用以下技术栈搭建个人博客：

- **Hexo** — 静态博客框架，快速生成网站
- **zhaoo** — 一个简洁优雅的 Hexo 主题，支持暗色模式、照片墙、一言 API
- **GitLab Pages** — 免费托管静态网站，支持自定义域名
- **GitLab CI/CD** — 自动构建和部署

最终效果：每次推送代码到 GitLab，自动构建并部署博客到 GitLab Pages。

---

## 环境准备

### 必需环境

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | v16+ | 推荐使用 LTS 版本 |
| npm | v8+ | 随 Node.js 安装 |
| Git | v2+ | 版本控制 |

### 安装 Node.js

访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装：

```bash
node -v    # 应显示 v16.x.x 或更高
npm -v     # 应显示 8.x.x 或更高
```

### 安装 Git

macOS：
```bash
brew install git
```

Windows：访问 [Git 官网](https://git-scm.com/) 下载安装包。

验证安装：
```bash
git --version
```

### 注册 GitLab 账号

访问 [GitLab](https://gitlab.com/) 注册账号。

---

## 第一步：安装 Hexo

全局安装 Hexo CLI：

```bash
npm install -g hexo-cli
```

验证安装：

```bash
hexo version
```

---

## 第二步：创建 Hexo 项目

### 2.1 初始化项目

```bash
hexo init my-blog
cd my-blog
```

这会创建以下目录结构：

```
my-blog/
├── _config.yml          # 站点配置文件
├── package.json         # 依赖管理
├── scaffolds/           # 文章模板
│   ├── draft.md
│   ├── page.md
│   └── post.md
├── source/              # 源文件目录
│   └── _posts/          # 文章存放目录
└── themes/              # 主题目录
```

### 2.2 安装依赖

```bash
npm install
```

---

## 第三步：安装 zhaoo 主题

### 3.1 通过 Git Submodule 安装（推荐）

```bash
git submodule add https://github.com/izhaoo/hexo-theme-zhaoo.git themes/zhaoo
```

> ⚠️ **重要**：必须使用 `git submodule add` 命令，而不是直接 `git clone`。这样会自动创建 `.gitmodules` 文件，确保 CI/CD 能正确初始化子模块。

### 3.2 验证安装

安装后会自动生成 `.gitmodules` 文件，内容如下：

```
[submodule "themes/zhaoo"]
	path = themes/zhaoo
	url = https://github.com/izhaoo/hexo-theme-zhaoo.git
```

确认文件存在：

```bash
cat .gitmodules
ls themes/zhaoo/
```

---

## 第四步：配置 zhaoo 主题

### 4.1 修改站点配置 `_config.yml`

编辑项目根目录的 `_config.yml`：

```yaml
# Site
title: 你的博客名称
subtitle: '你的博客副标题'
description: ''
keywords:
author: 你的名字
language: zh-CN
timezone: 'Asia/Shanghai'

# URL
url: https://yourusername.gitlab.io
permalink: :year/:month/:day/:title/
```

### 4.2 修改主题配置 `themes/zhaoo/_config.yml`

编辑 `themes/zhaoo/_config.yml`：

```yaml
# --------------------------------------------------
# Site Settings
# --------------------------------------------------

# 菜单
menu:
  home: / || 首页
  galleries: /galleries/ || 摄影
  archives: /archives/ || 归档
  tags: /tags/ || 标签
  categories: /categories/ || 分类
  about: /about/ || 关于

# 颜色配置
color:
  text: '#33333D'
  link: '#FF3B00'

# Favicon（网站图标）
favicon:
  small: /images/icons/16x16.png
  medium: /images/icons/32x32.png

# 主页预览
preview:
  enable: true
  type: wave
  background:
    type: image
    default_image:
      light: /images/theme/post-image.jpg
      dark: /images/theme/post-image-02.jpg
  motto:
    default: 在这里写一句话
    color: '#ffffff'
    typing: true
    api: https://v2.jinrishici.com/one.json
    data_contents: ['data', 'content']
```

### 4.3 主要配置项说明

| 配置项 | 说明 |
|--------|------|
| `menu` | 导航菜单，格式为 `路径 \|\| 显示名称` |
| `color` | 网站颜色配置 |
| `preview` | 主页大图/视频预览区域 |
| `preview.motto` | 主页显示的文字，支持一言 API |
| `preview.background.type` | 背景类型：`image` 或 `video` |
| `navbar` | 是否显示顶部导航栏 |
| `copyright` | 页脚版权信息 |

---

## 第五步：创建文章与页面

### 5.1 创建文章

```bash
hexo new post "文章标题"
```

这会在 `source/_posts/` 下生成 `文章标题.md` 文件。

编辑文件：

```markdown
---
title: 文章标题
date: 2026-05-08 12:00:00
tags: [标签1, 标签2]
categories: 分类
summary: 文章摘要（zhaoo 主题支持）
---

这里是文章正文内容。

支持 Markdown 语法。
```

### 5.2 创建页面

```bash
hexo new page "about"
```

这会创建 `source/about/index.md`。

### 5.3 文章置顶

在文章 Front-matter 中添加 `sticky`：

```markdown
---
title: 重要文章
sticky: 100
---
```

数值越大，置顶越靠前。

### 5.4 文章封面图

```markdown
---
title: 带封面的文章
photos:
  - /images/cover.jpg
---
```

---

## 第六步：本地预览

### 6.1 启动本地服务器

```bash
hexo clean
hexo generate
hexo server
```

或者简写：

```bash
hexo cl && hexo g && hexo s
```

### 6.2 访问预览

打开浏览器访问 `http://localhost:4000`

### 6.3 常用命令

| 命令 | 简写 | 说明 |
|------|------|------|
| `hexo clean` | `hexo cl` | 清除缓存和生成文件 |
| `hexo generate` | `hexo g` | 生成静态文件 |
| `hexo server` | `hexo s` | 启动本地服务器 |
| `hexo deploy` | `hexo d` | 部署 |
| `hexo new "标题"` | `hexo n "标题"` | 创建新文章 |

---

## 第七步：推送到 GitLab

### 7.1 创建 GitLab 仓库

1. 登录 GitLab
2. 点击 **New project**
3. 项目名称填写（如 `my-blog`）
4. 可见性选择 **Public**（GitLab Pages 免费版需要公开项目）
5. 点击 **Create project**

### 7.2 初始化本地 Git 仓库

```bash
cd my-blog

# 初始化 Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://gitlab.com/你的用户名/my-blog.git

# 推送到 GitLab
git push -u origin master
```

### 7.3 Git Submodule 的正确处理

如果你像本教程一样使用 `git submodule add` 添加主题，推送时会自动包含 `.gitmodules` 文件。

**常见错误**：如果你是手动 `git clone` 主题到 `themes/` 目录，需要额外创建 `.gitmodules` 文件：

```bash
# 在项目根目录创建 .gitmodules
cat > .gitmodules << 'EOF'
[submodule "themes/zhaoo"]
	path = themes/zhaoo
	url = https://github.com/izhaoo/hexo-theme-zhaoo.git
EOF

git add .gitmodules
git commit -m "Add .gitmodules for zhaoo theme"
git push
```

---

## 第八步：配置 GitLab CI/CD

### 8.1 创建 `.gitlab-ci.yml`

在项目根目录创建 `.gitlab-ci.yml` 文件：

```yaml
image: node:16

variables:
  GIT_SUBMODULE_STRATEGY: recursive

cache:
  paths:
    - node_modules/

pages:
  stage: deploy
  script:
    - npm install -g hexo-cli
    - npm install
    - hexo generate
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == "master"
```

### 8.2 配置说明

| 配置项 | 说明 |
|--------|------|
| `image: node:16` | 使用 Node.js 16 Docker 镜像 |
| `GIT_SUBMODULE_STRATEGY: recursive` | **关键！** 自动递归初始化 Git 子模块 |
| `cache.paths` | 缓存 `node_modules/` 加速构建 |
| `artifacts.paths: public` | 必须是 `public` 目录，GitLab Pages 从此目录部署 |
| `rules` | 仅在 master 分支触发部署 |

### 8.3 推送 CI 配置

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab CI/CD configuration"
git push
```

---

## 第九步：启用 GitLab Pages

### 9.1 查看 Pipeline 状态

1. 进入 GitLab 项目页面
2. 点击左侧菜单 **Build → Pipelines**
3. 等待 Pipeline 状态变为 **Passed**（绿色）

### 9.2 查看 Pages URL

Pipeline 通过后：

1. 进入 **Settings → Pages**
2. 你会看到访问 URL，格式为：
   - `https://你的用户名.gitlab.io/项目名`（子目录）
   - `https://你的用户名.gitlab.io`（如果项目名为 `你的用户名.gitlab.io`）

### 9.3 验证部署

等待 1-5 分钟后访问 Pages URL，应该能看到你的博客。

---

## 第十步：自定义域名（可选）

### 10.1 添加域名

1. 进入 **Settings → Pages → New Domain**
2. 输入你的域名（如 `blog.example.com`）
3. 点击 **Create New Domain**

### 10.2 配置 DNS

在你的域名管理面板添加 CNAME 记录：

```
类型: CNAME
主机记录: blog
记录值: 你的用户名.gitlab.io
```

### 10.3 配置 HTTPS

GitLab Pages 免费提供 Let's Encrypt SSL 证书：

1. 进入 **Settings → Pages → 你的域名**
2. 勾选 **Force HTTPS (with Let's Encrypt)**
3. 等待证书签发（通常几分钟）

---

## 常见问题与排查

### Q1: Pipeline 失败，报错 `fatal: No url found for submodule path 'themes/zhaoo' in .gitmodules`

**原因**：`.gitmodules` 文件缺失或内容错误。

**解决**：

```bash
# 检查 .gitmodules 是否存在
cat .gitmodules

# 如果不存在，创建它
cat > .gitmodules << 'EOF'
[submodule "themes/zhaoo"]
	path = themes/zhaoo
	url = https://github.com/izhaoo/hexo-theme-zhaoo.git
EOF

git add .gitmodules
git commit -m "fix: add .gitmodules for zhaoo theme"
git push
```

### Q2: Pipeline 通过但 Pages 显示 404

**原因**：`artifacts.paths` 配置错误。

**解决**：确保 `.gitlab-ci.yml` 中 `artifacts.paths` 是 `public`：

```yaml
artifacts:
  paths:
    - public
```

### Q3: 主题样式丢失

**原因**：子模块未正确初始化。

**解决**：

```bash
# 本地初始化子模块
git submodule init
git submodule update

# 或者重新添加
git submodule add https://github.com/izhaoo/hexo-theme-zhaoo.git themes/zhaoo
```

### Q4: Pages URL 不正确（指向旧的 Gitee 地址）

**原因**：站点配置 `_config.yml` 中的 `url` 未更新。

**解决**：修改 `_config.yml`：

```yaml
url: https://你的用户名.gitlab.io/项目名
```

然后重新推送。

### Q5: 如何查看构建日志？

1. 进入 **Build → Pipelines**
2. 点击失败的 Pipeline
3. 点击 **pages** Job 查看详细日志

### Q6: Node.js 版本不兼容

**原因**：某些 npm 包需要更高版本的 Node.js。

**解决**：修改 `.gitlab-ci.yml` 中的镜像版本：

```yaml
image: node:18  # 或 node:20
```

---

## 完整配置参考

### 站点配置 `_config.yml`

```yaml
# Site
title: 你的博客
subtitle: '副标题'
description: ''
author: 作者名
language: zh-CN
timezone: 'Asia/Shanghai'

# URL
url: https://你的用户名.gitlab.io/项目名
permalink: :year/:month/:day/:title/
```

### 主题配置 `themes/zhaoo/_config.yml`

```yaml
# 菜单
menu:
  home: / || 首页
  archives: /archives/ || 归档
  tags: /tags/ || 标签
  categories: /categories/ || 分类
  about: /about/ || 关于

# 主页预览
preview:
  enable: true
  type: wave
  background:
    type: image
  motto:
    default: 一句话介绍
    typing: true
```

### CI/CD 配置 `.gitlab-ci.yml`

```yaml
image: node:16

variables:
  GIT_SUBMODULE_STRATEGY: recursive

cache:
  paths:
    - node_modules/

pages:
  stage: deploy
  script:
    - npm install -g hexo-cli
    - npm install
    - hexo generate
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == "master"
```

---

## 项目结构总览

```
my-blog/
├── _config.yml              # 站点配置
├── .gitlab-ci.yml           # CI/CD 配置
├── .gitmodules              # Git 子模块配置
├── package.json             # 依赖管理
├── scaffolds/               # 文章模板
├── source/
│   ├── _posts/              # 文章目录
│   ├── about/               # 关于页面
│   └── images/              # 图片资源
└── themes/
    └── zhaoo/               # zhaoo 主题（Git Submodule）
        ├── _config.yml      # 主题配置
        ├── layout/          # 模板文件
        ├── scripts/         # 脚本
        └── source/          # 主题资源
```

---

## 总结

| 步骤 | 操作 | 关键点 |
|------|------|--------|
| 1 | 安装 Hexo | `npm install -g hexo-cli` |
| 2 | 创建项目 | `hexo init my-blog` |
| 3 | 安装主题 | `git submodule add ...` 必须用 submodule |
| 4 | 配置主题 | 修改 `_config.yml` 和主题配置 |
| 5 | 创建文章 | `hexo new post "标题"` |
| 6 | 本地预览 | `hexo s` 访问 localhost:4000 |
| 7 | 推送代码 | `git push -u origin master` |
| 8 | CI/CD | `.gitlab-ci.yml` 配置 `GIT_SUBMODULE_STRATEGY` |
| 9 | 启用 Pages | Pipeline 通过后自动部署 |
| 10 | 自定义域名 | Settings → Pages → New Domain |

**最重要的一点**：使用 `git submodule add` 安装主题，而不是手动 clone。这会自动创建 `.gitmodules` 文件，避免 CI/CD 构建失败。
