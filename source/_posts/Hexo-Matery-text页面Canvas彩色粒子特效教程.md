---
title: Hexo Matery text 页面添加 Canvas 彩色粒子上升特效教程
date: 2026-04-16 14:00:00
tags: [Hexo, Canvas, 前端特效, JavaScript]
categories: 技术教程
summary: 在 /text/ 通用 page 页面叠加主页同款 Canvas 彩色粒子上升特效，与原有 CSS 荧光绿气泡双层共存。
---

## 一、改造前后对比

| 对比项 | 改造前 | 改造后 |
|--------|--------|--------|
| 特效层数 | 1 层（CSS 荧光绿气泡） | 2 层（CSS 气泡 + Canvas 彩色粒子） |
| 粒子颜色 | 荧光绿 `rgba(128,255,0,0.7)` | 新增随机彩色（不透明） |
| 技术方案 | CSS `@keyframes` + jQuery DOM | 新增 Canvas 2D + `requestAnimationFrame` |

改造后 `/text/` 页面拥有双层粒子效果：底层荧光绿 CSS 气泡 + 顶层 Canvas 随机彩色粒子。

---

## 二、修改文件

```
themes/hexo-theme-matery/layout/page.ejs
```

`page.ejs` 是 Hexo Matery 主题的通用页面模板，所有 `layout: "page"` 的页面都使用它（包括 `/text/`）。

---

## 三、实现思路

### 3.1 包裹容器

用 `<div id="page-canvas-wrap">` 包裹整个 `<main>` 内部内容，作为 Canvas 的定位参照：

```html
<main class="content">
    <div id="page-canvas-wrap" style="position: relative; overflow: hidden;">
        <!-- 原有内容（卡片 + CSS 气泡）全部在此内部 -->
    </div>
    <!-- Canvas 粒子脚本在包裹容器之后 -->
</main>
```

| 样式 | 作用 |
|------|------|
| `position: relative` | 让 Canvas 的 `absolute` 定位相对于内容区 |
| `overflow: hidden` | 防止粒子飞出内容区边界 |

### 3.2 Canvas 覆盖层

在包裹容器上动态创建 Canvas，绝对定位在内容之上：

```javascript
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.pointerEvents = 'none';  // 鼠标事件穿透
canvas.style.zIndex = '1';            // 在内容之上
```

`pointerEvents: none` 确保用户仍可正常点击链接、选择文本、播放视频。

---

## 四、Canvas 粒子核心代码

```javascript
(function(){
    var container = document.getElementById('page-canvas-wrap');
    if (!container) return;
    var width = container.offsetWidth;
    var height = container.offsetHeight;

    // 创建 Canvas
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var circles = [];
    var density = 0.3;       // 粒子密度
    var radius = 10;         // 粒子半径
    var clearOffset = 0.9;   // 初始生命值范围

    // 随机彩色（不透明）
    function randomColor() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return 'rgba(' + r + ',' + g + ',' + b + ',1)';
    }

    // 粒子对象
    function Circle() {
        this.init = function() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 100;
            this.alpha = 0.1 + Math.random() * clearOffset;
            this.scale = 0.1 + Math.random() * 0.3;
            this.speed = Math.random();
            this.color = randomColor();
        };
        this.draw = function() {
            if (this.alpha <= 0) this.init();
            this.y -= this.speed;
            this.alpha -= 0.0001;  // 最慢衰减 = 最高上升
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.scale * radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        };
        this.init();
    }

    for (var i = 0; i < width * density; i++) {
        circles.push(new Circle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (var j = 0; j < circles.length; j++) {
            circles[j].draw();
        }
        requestAnimationFrame(animate);
    }

    // 响应式
    window.addEventListener('resize', function() {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    });

    animate();
})();
```

---

## 五、参数与主页一致性对照

| 参数 | 主页 `index.ejs` | text 页面 `page.ejs` | 说明 |
|------|-----------------|---------------------|------|
| 颜色模式 | `'random'` | `randomColor()` | 随机 RGB |
| alpha | `1` | `1` | 完全不透明 |
| `density` | `0.3` | `0.3` | 每像素宽度生成 0.3 个粒子 |
| `radius` | `10` | `10` | 最大半径 10px |
| `clearOffset` | `0.9` | `0.9` | alpha 范围 0.1~1.0 |
| alpha 衰减 | `0.0001` | `0.0001` | 最长寿命 ~167 秒 |

---

## 六、双层特效共存原理

`/text/` 页面现在有两层粒子同时运行：

```
┌─────────────────────────────────┐
│  Canvas 彩色粒子（z-index: 1）    │  ← 随机彩色，不透明
│  pointerEvents: none             │
├─────────────────────────────────┤
│  页面内容（卡片、文本、图片、视频）  │  ← 用户可正常交互
├─────────────────────────────────┤
│  CSS 荧光绿气泡（position: relative）│  ← rgba(128,255,0,0.7)
└─────────────────────────────────┘
```

- **Canvas 层**：`position: absolute` + `zIndex: 1`，浮在最上方
- **内容层**：正常文档流，可交互（Canvas 的 `pointerEvents: none` 保证穿透）
- **CSS 气泡层**：`position: relative`，跟随文档流

两层粒子的颜色、大小、速度、方向各自独立，视觉上形成丰富的多层动态效果。

---

## 七、自定义调参

| 效果 | 修改位置 | 示例 |
|------|---------|------|
| 只要 Canvas 彩色粒子，去掉 CSS 气泡 | 删除 `page-bubbles` 相关 CSS 和 HTML | — |
| 只要 CSS 气泡，去掉 Canvas 粒子 | 删除 `page-canvas-wrap` 和对应 `<script>` | — |
| Canvas 粒子更多 | `density = 0.6` | 粒子数翻倍 |
| Canvas 粒子更大 | `radius = 20` | 最大 20px |
| Canvas 粒子半透明 | `return 'rgba('+r+','+g+','+b+',0.5)'` | 50% 透明 |
| CSS 气泡改成彩色 | `background-color: hsl(var(--hue),100%,50%)` | 需配合 JS 随机 |
| 上升更快 | `this.speed = Math.random() * 3` | 速度提升 3 倍 |

---

## 八、同一模式已应用的页面汇总

| 页面 | 文件 | Canvas 彩色粒子 | CSS 气泡 |
|------|------|----------------|---------|
| 主页轮播区 | `index.ejs` | `circleMagic()` | 无 |
| `/text/` 页面 | `page.ejs` | `page-canvas-wrap` | `page-bubbles` |
| `/musics/` 音乐区 | `musics.ejs` | 无 | `music-bubbles` |
| `/musics/` 留言区 | `musics.ejs` | `musics-twikoo-wrap` | 无 |
| 文章封面 | `post-cover.ejs` | 无 | `bubbles-cover` |
| 文章正文 | `post.ejs` | 无 | `bubbles` |
| 通用封面 | `bg-cover.ejs` | 无 | `bubbles-bg` |
