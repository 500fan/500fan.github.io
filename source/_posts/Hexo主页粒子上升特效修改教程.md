---
title: Hexo Matery 主页粒子上升特效修改教程
date: 2026-04-15 12:00:00
tags: [Hexo, 前端特效, Canvas, JavaScript]
categories: 技术教程
summary: 详解 Hexo Matery 主题首页 circleMagic 粒子上升动画的参数调整，包括颜色、透明度、上升高度等。
---

## 一、特效原理

主页轮播区的粒子上升效果基于 **Canvas 2D** 实现，核心函数为 `circleMagic()`，位于：

```
themes/hexo-theme-matery/layout/index.ejs
```

工作流程：

1. 获取容器 `#smarts` 的宽高，创建一个 `<canvas>` 覆盖在上面
2. 根据 `density`（密度）生成大量 `Circle` 粒子对象
3. 每一帧（`requestAnimationFrame`）：粒子向上移动、alpha 递减、重新绘制
4. 当粒子 alpha 降到 0 时，重置到底部重新上升

---

## 二、核心参数一览

所有可调参数集中在 `settings` 对象中：

```javascript
const settings = options || {
    color: 'random',       // 粒子颜色
    radius: 10,            // 粒子最大半径（px）
    density: 0.3,          // 粒子密度（数量 = 容器宽度 * density）
    clearOffset: 0.9       // 粒子初始生命值范围
}
```

| 参数 | 作用 | 默认值 | 调大效果 | 调小效果 |
|------|------|--------|----------|----------|
| `color` | 粒子颜色 | `'rgba(255,255,255,.5)'` | — | — |
| `radius` | 粒子半径上限 | `10` | 粒子更大 | 粒子更小 |
| `density` | 粒子密度 | `0.3` | 粒子更多更密 | 粒子更少更稀 |
| `clearOffset` | 初始 alpha 浮动范围 | `0.2` | 粒子存活更久，升得更高 | 粒子消失更快 |

---

## 三、修改一：开启随机彩色粒子

### 改动位置

`settings.color` 和 `randomColor()` 函数。

### 原始代码

```javascript
// settings 中：
color: 'rgba(255,255,255,.5)',

// randomColor 函数中：
const alpha = Math.random().toPrecision(2);
```

粒子全部为白色半透明，`randomColor()` 虽然存在但未被调用。

### 修改后

```javascript
// settings 中：改为 'random' 启用随机颜色
color: 'random',

// randomColor 函数中：alpha 固定为 1（完全不透明）
const alpha = 1;
```

### 原理说明

`Circle` 的 `init()` 方法中有判断逻辑：

```javascript
if (settings.color === 'random') {
    that.color = randomColor();  // 走随机颜色分支
} else {
    that.color = settings.color; // 走固定颜色分支
}
```

`randomColor()` 函数随机生成 RGB 三个通道值（0-255），拼成 `rgba()` 字符串：

```javascript
function randomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    const alpha = 1;  // 1 = 完全不透明，0.5 = 半透明
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}
```

> **alpha 取值范围**：`0`（完全透明）到 `1`（完全不透明），`0.5` 为半透明。

---

## 四、修改二：粒子上升到最高点

### 改动位置

`settings.clearOffset` 和 `draw()` 中的 alpha 衰减值。

### 原始代码

```javascript
// settings 中：
clearOffset: 0.2

// draw 方法中：
that.alpha -= 0.0005;
```

### 修改后

```javascript
// settings 中：加大初始生命值范围
clearOffset: 0.9

// draw 方法中：降低衰减速度（原来的 1/5）
that.alpha -= 0.0001;
```

### 原理说明

粒子的"寿命"由 alpha 值控制。每个粒子初始化时：

```javascript
that.alpha = 0.1 + Math.random() * settings.clearOffset;
```

- **修改前**：`clearOffset: 0.2` -> alpha 范围 `0.1 ~ 0.3`，衰减 `0.0005/帧`
  - 最长寿命：`0.3 / 0.0005 = 600 帧`（约 10 秒 @60fps）
- **修改后**：`clearOffset: 0.9` -> alpha 范围 `0.1 ~ 1.0`，衰减 `0.0001/帧`
  - 最长寿命：`1.0 / 0.0001 = 10000 帧`（约 167 秒 @60fps）

粒子存活时间大幅增加，可以从底部上升到容器顶部。

---

## 五、完整修改后代码

```javascript
circleMagic();

function circleMagic(options) {
    let width, height, canvas, ctx;
    let animateHeader = true;
    const circles = [];

    const settings = options || {
        color: 'random',    // 'random' = 随机彩色, 'rgba(R,G,B,A)' = 固定颜色
        radius: 10,         // 粒子半径
        density: 0.3,       // 粒子密度
        clearOffset: 0.9    // 初始生命值范围（越大存活越久）
    }

    const container = document.getElementById('smarts');
    initContainer();
    addListeners();

    function initContainer() {
        width = container.offsetWidth;
        height = container.offsetHeight - 120;
        initCanvas();
        canvas = document.getElementById('homeTopCanvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.bottom = '0';
        ctx = canvas.getContext('2d');
        for (let x = 0; x < width * settings.density; x++) {
            circles.push(new Circle());
        }
        animate();
    }

    function initCanvas() {
        const el = document.createElement('canvas');
        el.id = 'homeTopCanvas';
        el.style.pointerEvents = 'none';
        container.appendChild(el);
        el.parentElement.style.overflow = 'hidden';
    }

    function addListeners() {
        window.addEventListener('scroll', scrollCheck, false);
        window.addEventListener('resize', resize, false);
    }

    function scrollCheck() {
        animateHeader = !(document.body.scrollTop > height);
    }

    function resize() {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function animate() {
        if (animateHeader) {
            ctx.clearRect(0, 0, width, height);
            for (const i in circles) circles[i].draw();
        }
        requestAnimationFrame(animate);
    }

    function randomColor() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        const alpha = 1;  // 完全不透明
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    function Circle() {
        const that = this;
        (function () { that.pos = {}; init(); })();

        function init() {
            that.pos.x = Math.random() * width;
            that.pos.y = height + Math.random() * 100;
            that.alpha = 0.1 + Math.random() * settings.clearOffset;
            that.scale = 0.1 + Math.random() * 0.3;
            that.speed = Math.random();
            that.color = settings.color === 'random'
                ? randomColor()
                : settings.color;
        }

        this.draw = function () {
            if (that.alpha <= 0) init();
            that.pos.y -= that.speed;
            that.alpha -= 0.0001;  // 衰减越小，上升越高
            ctx.beginPath();
            ctx.arc(that.pos.x, that.pos.y, that.scale * settings.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = that.color;
            ctx.fill();
            ctx.closePath();
        }
    }
}
```

---

## 六、常用调参速查

| 想要的效果 | 修改方式 |
|-----------|---------|
| 白色粒子 | `color: 'rgba(255,255,255,0.5)'` |
| 随机彩色粒子 | `color: 'random'` |
| 粒子更大 | 增大 `radius`，如 `20` |
| 粒子更多 | 增大 `density`，如 `0.6` |
| 粒子升得更高 | 增大 `clearOffset`（如 `0.9`）+ 减小 alpha 衰减（如 `0.0001`） |
| 粒子升得更快 | 在 `init()` 中改 `that.speed = Math.random() * 3` |
| 半透明粒子 | `randomColor()` 中 `alpha = 0.5` |
| 完全不透明 | `randomColor()` 中 `alpha = 1` |
| 固定某种颜色 | `color: 'rgba(255,0,0,1)'`（如红色） |
