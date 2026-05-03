---
title: Hexo Matery 音乐页面改造教程 — 参照 artitalk 说说页结构
date: 2026-04-15 16:00:00
tags: [Hexo, 页面布局, EJS模板, 前端特效]
categories: 技术教程
summary: 将 Hexo Matery 主题的 /musics/ 音乐页面改造为与 /artitalk/ 说说页相同的布局结构，包含封面横幅、卡片容器、居中标题和气泡粒子特效。
---

## 一、改造目标

将 `/musics/` 音乐页面从旧版简陋布局，改造为与 `/artitalk/` 说说页相同的结构：

| 对比项 | 改造前（musics） | 改造后（参照 artitalk） |
|--------|-----------------|----------------------|
| 封面横幅 | 无（被注释掉） | 有 `bg-cover` 全屏封面 |
| 外层容器 | `<main>` + `about-container` | `<article>` + `chip-container` |
| 标题栏 | 无 | 居中图标 + 文字标题 |
| 卡片布局 | 单层 card | `row` > `card` > `card-content`（与 artitalk 一致） |
| 气泡特效 | 有，但上升高度低 | 保留并升级到最高值 |

---

## 二、涉及文件

| 文件 | 作用 |
|------|------|
| `themes/hexo-theme-matery/layout/musics.ejs` | 音乐页面模板（主要修改） |
| `source/musics/index.md` | 音乐页面源文件（修复 frontmatter） |
| `themes/hexo-theme-matery/layout/artitalk.ejs` | 说说页面模板（参照对象） |

---

## 三、artitalk.ejs 结构分析

先理解参照目标的 HTML 骨架：

```html
<!-- 1. 封面横幅 -->
<%- partial('_partial/bg-cover') %>

<!-- 2. 自定义样式 -->
<style>...</style>

<!-- 3. 外层容器：article + container + chip-container -->
<article id="articles11" class="container chip-container">
    <div class="row">
        <!-- 4. 卡片 -->
        <div class="card">
            <div class="card-content">
                <!-- 5. 居中标题 -->
                <div class="tag-title center-align">
                    <i class="fas fa-pen-alt"></i> 说说
                </div>
                <!-- 6. 内容区 -->
                <div id="artitalk_main"></div>
            </div>
        </div>
    </div>
</article>

<!-- 7. 初始化脚本 -->
<script>new Artitalk({...})</script>
```

关键设计模式：
- **封面** → 内容分离，`bg-cover` 独立于主体内容
- **`<article>`** 而非 `<main>` 作为外层语义标签
- **`chip-container`** 类提供统一的间距和响应式布局
- **`tag-title center-align`** 类实现居中标题样式

---

## 四、改造前的 musics.ejs

```html
<style type="text/css">
    .about-cover { height: 75vh; }
</style>

<!-- 封面被注释掉了 -->
<!-- <%- partial('_partial/bg-cover') %> -->

<main class="content">
    <div id="aboutme" class="container about-container">
        <div class="card">
            <div class="card-content">
                <div class="music-player">
                    <% if (theme.musics && theme.musics.enable) { %>
                        <%- partial('_widget/musics') %>
                        <!-- 气泡特效代码... -->
                    <% } %>
                </div>
            </div>
        </div>
    </div>
</main>
```

问题：
1. 封面 `bg-cover` 被注释，页面没有顶部横幅
2. 使用 `<main>` + `about-container`，与其他页面风格不统一
3. 没有居中标题栏
4. 气泡上升高度未优化

---

## 五、改造后的 musics.ejs

```html
<!-- 1. 封面样式 -->
<style type="text/css">
    .about-cover { height: 75vh; }
</style>

<!-- 2. 启用封面横幅（取消注释） -->
<%- partial('_partial/bg-cover') %>

<!-- 3. 外层容器：与 artitalk 保持一致 -->
<article id="articles-musics" class="container chip-container">
    <div class="row">
        <div class="card">
            <div class="card-content">

                <!-- 4. 居中标题栏（参照 artitalk 的 tag-title） -->
                <div class="tag-title center-align">
                    <i class="fa fa-music"></i>&nbsp;&nbsp;Music
                </div>

                <!-- 5. 音乐播放器 -->
                <% if (theme.musics && theme.musics.enable) { %>
                    <%- partial('_widget/musics') %>
                <% } %>

                <!-- 6. 气泡粒子特效（上升高度最高值） -->
                <style>
                .music-bubbles > .particle {
                    opacity: 0;
                    position: absolute;
                    background-color: rgba(128,255,0,0.7);
                    animation: musicBubbles 60s ease-in infinite;
                    border-radius: 100%;
                }
                @keyframes musicBubbles {
                    0% { opacity: 0; }
                    5% { opacity: 1; transform: translate(0, -20%); }
                    100% { opacity: 0; transform: translate(0, -80000%); }
                }
                </style>
                <div style="width:100%; height:100%; position:relative; bottom:0px;"
                     class="particletext music-bubbles"></div>

                <!-- 7. jQuery + 气泡生成脚本 -->
                <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
                <script>
                  $(function(){
                    if(!jQuery.rnd) {
                      jQuery.rnd = function(m,n) {
                        m = parseInt(m);
                        n = parseInt(n);
                        return Math.floor(Math.random()*(n-m+1))+m;
                      }
                    }
                    $.each($(".particletext.music-bubbles"), function(){
                      var bubblecount = ($(this).width()/50)*10;
                      for(var i = 0; i <= bubblecount; i++) {
                        var size = ($.rnd(40,80)/10);
                        $(this).append('<span class="particle" style="top:'+$.rnd(20,80)
                          +'%; left:'+$.rnd(0,95)+'%;width:'+size+'px; height:'+size
                          +'px;animation-delay:'+($.rnd(0,180)/10)+'s;"></span>');
                      }
                    });
                  });
                </script>

            </div>
        </div>
    </div>
</article>
```

---

## 六、逐项改造说明

### 6.1 启用封面横幅

```diff
- <!-- <%- partial('_partial/bg-cover') %> -->
+ <%- partial('_partial/bg-cover') %>
```

`bg-cover` 是 Matery 主题的通用封面组件，会读取主题配置中的背景图并显示页面标题。artitalk、about、friends 等页面都使用它。

### 6.2 外层容器从 main 改为 article

```diff
- <main class="content">
-     <div id="aboutme" class="container about-container">
+ <article id="articles-musics" class="container chip-container">
+     <div class="row">
```

| 属性 | `about-container` | `chip-container` |
|------|------------------|------------------|
| 用途 | 关于页专用 | 标签/说说等通用页面 |
| 间距 | 较大的上下 padding | 适中的 margin |
| 一致性 | 仅 about 页使用 | artitalk/contact 等多页使用 |

### 6.3 添加居中标题栏

```html
<div class="tag-title center-align">
    <i class="fa fa-music"></i>&nbsp;&nbsp;Music
</div>
```

`tag-title` 是 Matery 主题的通用标题样式类，提供：
- 居中对齐
- 合适的字号和间距
- 下方分隔线

artitalk 用的是 `<i class="fas fa-pen-alt"></i> 说说`，musics 对应改为 `<i class="fa fa-music"></i> Music`。

### 6.4 气泡特效升级

```diff
- animation: bubbles 18s ease-in infinite;
+ animation: musicBubbles 60s ease-in infinite;

- transform: translate(0, -8000%);
+ transform: translate(0, -80000%);
```

为避免与其他页面的气泡 CSS 冲突，类名改为独立的 `music-bubbles` / `musicBubbles`。

---

## 七、source/musics/index.md 修复

原文件有重复的 frontmatter：

```markdown
---
title: musics
type: "musics"
layout: "musics"
---


---
title: mus
---
```

修复为：

```markdown
---
title: Music
date: 2020-10-02 16:19:14
type: "musics"
layout: "musics"
---
```

`title` 会显示在 `bg-cover` 封面横幅中，所以改为可读的 "Music"。

---

## 八、Hexo 页面创建通用模式

通过这次改造，可以总结出 Matery 主题创建自定义页面的标准模式：

### 步骤一：创建源文件

```bash
mkdir source/页面名
```

`source/页面名/index.md`：

```markdown
---
title: 页面标题
date: 2026-04-15 00:00:00
type: "页面名"
layout: "页面名"
---
```

- `type` — Hexo 用于识别页面类型
- `layout` — 指定使用哪个 EJS 模板

### 步骤二：创建布局模板

`themes/hexo-theme-matery/layout/页面名.ejs`：

```html
<!-- 封面样式 -->
<style type="text/css">
    .about-cover { height: 75vh; }
</style>

<!-- 封面横幅 -->
<%- partial('_partial/bg-cover') %>

<!-- 内容区 -->
<article id="articles-xxx" class="container chip-container">
    <div class="row">
        <div class="card">
            <div class="card-content">
                <!-- 居中标题 -->
                <div class="tag-title center-align">
                    <i class="fas fa-图标名"></i>&nbsp;&nbsp;标题文字
                </div>
                <!-- 页面内容 -->
                ...
            </div>
        </div>
    </div>
</article>
```

### 步骤三：添加导航菜单（可选）

在 `_config.yml` 中的菜单配置里添加链接：

```yaml
menu:
  Music: /musics/ || fa fa-music
```

---

## 九、改造前后效果对比

| 效果 | 改造前 | 改造后 |
|------|--------|--------|
| 封面横幅 | 无，页面直接从内容开始 | 75vh 全屏封面 + 标题 |
| 页面标题 | 无 | 居中 Music 图标 + 文字 |
| 卡片布局 | about 专用容器 | 通用 chip-container |
| 气泡上升 | 18秒 / -8000% | 60秒 / -80000%（最高值） |
| 风格统一 | 与说说页不一致 | 与说说页完全一致 |
