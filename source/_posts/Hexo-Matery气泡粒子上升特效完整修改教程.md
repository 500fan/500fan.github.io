---
title: Hexo Matery 气泡粒子上升特效完整修改教程
date: 2026-04-15 14:00:00
tags: [Hexo, 前端特效, CSS动画, Canvas, JavaScript]
categories: 技术教程
summary: 完整记录 Hexo Matery 主题中两套粒子上升特效的修改过程，涵盖主页 Canvas 粒子、文章封面/正文/通用页面的 CSS 气泡动画，包括颜色、透明度、上升高度的参数调整。
---

本教程涵盖 Hexo Matery 主题中 **两套不同的粒子上升特效** 的完整修改过程。

---

## 一、两套特效的区别

| 对比项 | 主页 Canvas 粒子 | 文章/页面 CSS 气泡 |
|--------|-----------------|-------------------|
| 技术方案 | Canvas 2D + JS `requestAnimationFrame` | CSS `@keyframes` + jQuery 生成 DOM |
| 文件位置 | `layout/index.ejs` | `layout/post.ejs`、`layout/_partial/post-cover.ejs`、`layout/_partial/bg-cover.ejs`、`layout/page.ejs` |
| 适用范围 | 仅主页 `#smarts` 区域 | 文章封面、文章正文、通用 page 页面 |
| 控制上升高度 | `clearOffset` + `alpha衰减` | CSS `transform: translate(0, -N%)` + `animation` 时长 |
| 控制颜色 | `settings.color` + `randomColor()` | CSS `background-color` |

---

## 二、主页 Canvas 粒子修改（index.ejs）

### 2.1 文件路径

```
themes/hexo-theme-matery/layout/index.ejs
```

### 2.2 核心参数

```javascript
const settings = options || {
    color: 'random',       // 'random' 启用随机彩色
    radius: 10,            // 粒子半径上限（px）
    density: 0.3,          // 粒子密度 = 容器宽度 * density
    clearOffset: 0.9       // 初始 alpha 浮动范围（越大粒子活越久）
}
```

### 2.3 修改详情

#### 修改一：开启随机彩色 + 完全不透明

```javascript
// 修改前
color: 'rgba(255,255,255,.5)',   // 白色半透明
const alpha = Math.random().toPrecision(2);  // 随机透明度

// 修改后
color: 'random',                 // 启用随机颜色分支
const alpha = 1;                 // 完全不透明
```

**原理**：`Circle.init()` 中判断 `settings.color === 'random'` 时调用 `randomColor()`，生成随机 RGB 值。

#### 修改二：上升到最高值

```javascript
// 修改前
clearOffset: 0.2          // alpha 范围 0.1~0.3
that.alpha -= 0.0005;     // 每帧衰减 0.0005

// 修改后
clearOffset: 0.9          // alpha 范围 0.1~1.0
that.alpha -= 0.0001;     // 每帧衰减 0.0001（原来的 1/5）
```

**寿命计算**：

| 状态 | alpha 范围 | 衰减速率 | 最长寿命 | 约等于 |
|------|-----------|---------|---------|--------|
| 修改前 | 0.1~0.3 | 0.0005/帧 | 600 帧 | 10 秒 @60fps |
| 修改后 | 0.1~1.0 | 0.0001/帧 | 10000 帧 | 167 秒 @60fps |

粒子存活时间提升约 **16 倍**，足以从底部升到容器顶部。

### 2.4 参数速查表

| 效果 | 修改方式 |
|------|---------|
| 白色粒子 | `color: 'rgba(255,255,255,0.5)'` |
| 随机彩色 | `color: 'random'` |
| 固定红色 | `color: 'rgba(255,0,0,1)'` |
| 粒子更大 | `radius: 20` |
| 粒子更多更密 | `density: 0.6` |
| 升得更高 | 加大 `clearOffset` + 减小 alpha 衰减 |
| 升得更快 | `that.speed = Math.random() * 3` |
| 半透明 | `randomColor()` 中 `alpha = 0.5` |
| 完全不透明 | `randomColor()` 中 `alpha = 1` |

---

## 三、文章封面 CSS 气泡修改（post-cover.ejs）

### 3.1 文件路径

```
themes/hexo-theme-matery/layout/_partial/post-cover.ejs
```

### 3.2 特效原理

CSS 气泡与 Canvas 粒子不同，它通过：
1. **jQuery** 动态生成多个 `<span class="particle">` 元素
2. **CSS `@keyframes`** 控制上升动画（`transform: translate(0, -N%)`）
3. **`animation-delay`** 随机延迟让气泡交错出现

### 3.3 修改详情：上升到最高值

控制气泡上升高度的是两个 CSS 属性：

```css
/* 修改前 */
animation: bubblesCover 18s ease-in infinite;
transform: translate(0, -8000%);

/* 修改后 */
animation: bubblesCover 60s ease-in infinite;    /* 动画时长 18s → 60s */
transform: translate(0, -80000%);                /* 位移 -8000% → -80000% */
```

#### 参数说明

| CSS 属性 | 作用 | 修改前 | 修改后 | 效果 |
|----------|------|--------|--------|------|
| `animation` 时长 | 一次完整上升动画的持续时间 | `18s` | `60s` | 上升过程更久，视觉更平滑 |
| `translate(0, -N%)` | 气泡最终上升的距离（相对自身大小的百分比） | `-8000%` | `-80000%` | 上升距离提升 10 倍 |

#### 完整 CSS 关键帧

```css
@keyframes bubblesCover {
    0% { opacity: 0; }
    5% { opacity: 1; transform: translate(0, -20%); }
    100% { opacity: 0; transform: translate(0, -80000%); }  /* 最高值 */
}
```

### 3.4 封面容器关键样式

封面 div 必须设置以下样式才能正确显示气泡：

```html
<div class="post-cover" style="position: relative; overflow: hidden;">
    <!-- 气泡容器，绝对定位铺满封面 -->
    <div style="width:100%; height:100%; position:absolute; bottom:0; left:0;"
         class="particletext bubbles-cover"></div>
</div>
```

- `position: relative` — 让气泡容器的 `absolute` 定位相对于封面
- `overflow: hidden` — 防止气泡溢出封面区域

---

## 四、文章正文 CSS 气泡修改（post.ejs）

### 4.1 文件路径

```
themes/hexo-theme-matery/layout/post.ejs
```

### 4.2 修改详情

与封面气泡相同的参数调整：

```css
/* 修改前 */
animation: bubbles 18s ease-in infinite;
transform: translate(0, -8000%);

/* 修改后 */
animation: bubbles 60s ease-in infinite;
transform: translate(0, -80000%);
```

### 4.3 正文气泡容器

```html
<div style="width:100%; height:100%; position:relative; bottom:0px;"
     class="particletext bubbles"></div>
```

正文区域使用 `position: relative` 而非 `absolute`，气泡跟随文档流排列在文章内容下方。

---

## 五、通用 page 页面气泡（page.ejs + bg-cover.ejs）

### 5.1 适用页面

所有 `layout: "page"` 类型的页面，例如 `/text/`。

### 5.2 涉及文件

| 文件 | 作用 |
|------|------|
| `layout/page.ejs` | 页面正文区域气泡 |
| `layout/_partial/bg-cover.ejs` | 页面封面顶部气泡 |

### 5.3 page.ejs 添加的气泡代码

```html
<style>
.page-bubbles > .particle {
    opacity: 0;
    position: absolute;
    background-color: rgba(128,255,0,0.7);       /* 荧光绿 */
    animation: pageBubbles 60s ease-in infinite;  /* 60秒完整上升 */
    border-radius: 100%;
}
@keyframes pageBubbles {
    0% { opacity: 0; }
    5% { opacity: 1; transform: translate(0, -20%); }
    100% { opacity: 0; transform: translate(0, -80000%); }  /* 最高值 */
}
</style>
<div style="width:100%; height:100%; position:relative; bottom:0px;"
     class="particletext page-bubbles"></div>
```

### 5.4 bg-cover.ejs 封面气泡

```html
<div class="bg-cover about-cover" style="position:relative; overflow:hidden;">
    <!-- 原有内容 -->
    <style>
    .about-cover .bubbles-bg > .particle {
        opacity: 0;
        position: absolute;
        background-color: rgba(128,255,0,0.7);
        animation: bubblesBg 60s ease-in infinite;
        border-radius: 100%;
    }
    @keyframes bubblesBg {
        0% { opacity: 0; }
        5% { opacity: 1; transform: translate(0, -20%); }
        100% { opacity: 0; transform: translate(0, -80000%); }
    }
    </style>
    <div style="width:100%; height:100%; position:absolute; bottom:0; left:0;"
         class="particletext bubbles-bg"></div>
</div>
```

---

## 六、CSS 气泡 JS 生成逻辑详解

所有页面的气泡均由 jQuery 动态生成：

```javascript
$.each($(".particletext.bubbles"), function(){
    // 气泡数量 = 容器宽度 / 50 * 10
    var bubblecount = ($(this).width() / 50) * 10;

    for(var i = 0; i <= bubblecount; i++) {
        // 气泡大小：4px ~ 8px
        var size = ($.rnd(40, 80) / 10);

        // 随机位置 + 随机延迟
        $(this).append(
            '<span class="particle" style="'
            + 'top:' + $.rnd(20, 80) + '%;'      // 垂直起始位置 20%~80%
            + 'left:' + $.rnd(0, 95) + '%;'       // 水平位置 0%~95%
            + 'width:' + size + 'px;'
            + 'height:' + size + 'px;'
            + 'animation-delay:' + ($.rnd(0, 180) / 10) + 's;'  // 延迟 0~18秒
            + '"></span>'
        );
    }
});
```

### 关键参数调整

| 参数 | 当前值 | 作用 | 调整建议 |
|------|--------|------|---------|
| `bubblecount` 公式中的 `50` | `50` | 每 50px 宽度产生 10 个气泡 | 改小 = 更密，改大 = 更稀 |
| `$.rnd(40, 80) / 10` | 4~8px | 气泡直径 | `$.rnd(60, 120) / 10` = 更大 |
| `$.rnd(0, 180) / 10` | 0~18s | 动画延迟 | 必须与 CSS `animation` 时长配合 |
| CSS `background-color` | `rgba(128,255,0,0.7)` | 荧光绿 | 改为任意颜色 |

> **注意**：`animation-delay` 的最大值应与 CSS 动画时长匹配。当前动画时长为 60s，延迟为 0~18s，所以气泡在前 18 秒内陆续启动，保证视觉连续性。如需更均匀分布，可改为 `$.rnd(0, 600) / 10`（0~60s）。

---

## 七、所有修改文件汇总

| 文件 | 修改内容 |
|------|---------|
| `layout/index.ejs` | 主页 Canvas 粒子：`color:'random'`、`alpha=1`、`clearOffset:0.9`、衰减 `0.0001` |
| `layout/post.ejs` | 文章正文气泡：动画时长 `60s`、位移 `-80000%` |
| `layout/_partial/post-cover.ejs` | 文章封面气泡：动画时长 `60s`、位移 `-80000%` |
| `layout/_partial/bg-cover.ejs` | 通用页面封面气泡：新增完整气泡代码 |
| `layout/page.ejs` | 通用页面正文气泡：新增完整气泡代码 |

---

## 八、CSS 气泡上升高度速查

| `animation` 时长 | `translate` 值 | 效果 |
|-----------------|---------------|------|
| `18s` | `-8000%` | 默认高度（较低） |
| `30s` | `-20000%` | 中等高度 |
| `60s` | `-80000%` | 最高值（当前设置） |

**公式**：上升高度 = 气泡尺寸 * translate百分比 / 100。一个 6px 的气泡，`-80000%` 意味着上升 `6 * 80000 / 100 = 4800px`，远超任何页面高度。
