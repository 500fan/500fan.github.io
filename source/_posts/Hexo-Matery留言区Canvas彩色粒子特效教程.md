---
title: Hexo Matery 留言区添加 Canvas 彩色粒子上升特效教程
date: 2026-04-16 12:00:00
tags: [Hexo, Canvas, 前端特效, JavaScript, Twikoo]
categories: 技术教程
summary: 将主页轮播区的 Canvas 彩色粒子上升特效移植到 musics 页面的 Twikoo 留言区，不影响公共模板，不干扰留言操作。
---

## 一、需求与思路

目标：在 `/musics/` 页面的 Twikoo 留言区覆盖一层与主页轮播区相同的 **Canvas 彩色粒子上升** 特效。

### 难点

Twikoo 的模板 `_partial/twikoo.ejs` 是**公共组件**，被文章页、联系页等多个页面共用。如果直接修改该文件，所有使用 Twikoo 的页面都会受影响。

### 解决方案

不修改公共模板，而是在 `musics.ejs` 中：
1. 用一个 `<div>` 包裹 Twikoo 组件，作为粒子的容器
2. 用独立的 `<script>` 在该容器上创建 Canvas 粒子动画
3. 粒子 Canvas 设置 `pointerEvents: none`，不影响留言输入

---

## 二、完整实现代码

文件：`themes/hexo-theme-matery/layout/musics.ejs`

在 `</article>` 之后添加：

```html
<% if (theme.twikoo && theme.twikoo.enable) { %>
    <!-- 1. 包裹容器：relative 定位 + overflow hidden -->
    <div id="musics-twikoo-wrap" style="position: relative; overflow: hidden;">

    <!-- 2. 引入 Twikoo 公共模板（不做任何修改） -->
    <%- partial('_partial/twikoo') %>
    </div>

    <!-- 3. Canvas 彩色粒子脚本 -->
    <script>
    (function(){
        var container = document.getElementById('musics-twikoo-wrap');
        if (!container) return;
        var width = container.offsetWidth;
        var height = container.offsetHeight;

        // 创建 Canvas 元素
        var canvas = document.createElement('canvas');
        canvas.id = 'musicsTwikooCanvas';
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.pointerEvents = 'none';  // 不拦截鼠标事件
        canvas.style.zIndex = '1';             // 在留言内容之上
        container.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var circles = [];
        var density = 0.3;       // 粒子密度
        var radius = 10;         // 粒子半径上限
        var clearOffset = 0.9;   // 初始生命值范围

        // 随机颜色生成（完全不透明）
        function randomColor() {
            var r = Math.floor(Math.random() * 255);
            var g = Math.floor(Math.random() * 255);
            var b = Math.floor(Math.random() * 255);
            return 'rgba(' + r + ',' + g + ',' + b + ',1)';
        }

        // 粒子构造函数
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
                this.alpha -= 0.0001;   // 最慢衰减 → 最高上升
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.scale * radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();
            };
            this.init();
        }

        // 生成粒子
        for (var i = 0; i < width * density; i++) {
            circles.push(new Circle());
        }

        // 动画循环
        function animate() {
            ctx.clearRect(0, 0, width, height);
            for (var j = 0; j < circles.length; j++) {
                circles[j].draw();
            }
            requestAnimationFrame(animate);
        }

        // 响应窗口大小变化
        window.addEventListener('resize', function() {
            width = container.offsetWidth;
            height = container.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        });

        animate();
    })();
    </script>
<% } %>
```

---

## 三、代码逐层解析

### 3.1 包裹容器

```html
<div id="musics-twikoo-wrap" style="position: relative; overflow: hidden;">
```

| 样式 | 作用 |
|------|------|
| `position: relative` | 让内部 Canvas 的 `absolute` 定位相对于此容器 |
| `overflow: hidden` | 防止粒子溢出留言区边界 |

### 3.2 Canvas 创建

```javascript
var canvas = document.createElement('canvas');
canvas.style.position = 'absolute';   // 脱离文档流，覆盖在留言区上方
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.pointerEvents = 'none';  // 关键：鼠标事件穿透 Canvas
canvas.style.zIndex = '1';            // 在留言内容之上显示
```

`pointerEvents: none` 是最关键的设置——它让 Canvas 层对鼠标完全透明，用户点击、输入、选择文本等操作都能穿透到下方的 Twikoo 留言区。

### 3.3 粒子参数（与主页一致）

```javascript
var density = 0.3;       // 粒子数量 = 容器宽度 * 0.3
var radius = 10;         // 最大半径 10px
var clearOffset = 0.9;   // 初始 alpha 范围 0.1~1.0
// ...
this.alpha -= 0.0001;    // 衰减速率（最慢，上升到最高）
```

这些参数与 `index.ejs` 主页轮播区的 `circleMagic()` 完全一致：

| 参数 | 主页 index.ejs | 留言区 musics.ejs | 一致性 |
|------|---------------|------------------|--------|
| `color` | `'random'` | `randomColor()` | 相同 |
| `alpha` | `1`（不透明） | `1`（不透明） | 相同 |
| `density` | `0.3` | `0.3` | 相同 |
| `radius` | `10` | `10` | 相同 |
| `clearOffset` | `0.9` | `0.9` | 相同 |
| alpha 衰减 | `0.0001` | `0.0001` | 相同 |

### 3.4 随机颜色

```javascript
function randomColor() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return 'rgba(' + r + ',' + g + ',' + b + ',1)';
}
```

每个粒子独立生成随机 RGB 颜色，alpha 固定为 `1`（完全不透明）。

### 3.5 响应式适配

```javascript
window.addEventListener('resize', function() {
    width = container.offsetWidth;
    height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;
});
```

窗口大小变化时自动调整 Canvas 尺寸，保持粒子覆盖区域正确。

---

## 四、为什么不修改公共模板 twikoo.ejs

| 方案 | 优点 | 缺点 |
|------|------|------|
| 修改 `_partial/twikoo.ejs` | 一处修改，全局生效 | 所有页面的 Twikoo 都会有粒子效果，可能不需要 |
| **在 musics.ejs 中包裹**（当前方案） | 仅影响音乐页面，其他页面不受影响 | 代码仅在 musics.ejs 中 |

当前方案遵循"最小影响"原则：
- `_partial/twikoo.ejs` 被 `post-detail.ejs`、`contact.ejs`、`friends.ejs` 等共用
- 只在 musics 页面需要粒子效果
- 用容器包裹 + 独立脚本，零侵入

---

## 五、两套粒子特效对比

musics 页面现在有两种粒子特效并存：

| 区域 | 技术方案 | 颜色 | 上升高度 |
|------|---------|------|---------|
| 音乐播放器区（card 内） | CSS `@keyframes` + jQuery DOM | 荧光绿 `rgba(128,255,0,0.7)` | 最高值（`-80000%`，60s） |
| 留言区（Twikoo 上方） | **Canvas 2D** + `requestAnimationFrame` | **随机彩色**（不透明） | 最高值（`clearOffset:0.9`，衰减 `0.0001`） |

---

## 六、自定义调参

如需调整留言区粒子效果，修改 `musics.ejs` 中对应变量：

| 效果 | 修改 |
|------|------|
| 粒子更多 | `density = 0.6` |
| 粒子更大 | `radius = 20` |
| 粒子更快消失 | `this.alpha -= 0.001` |
| 固定白色粒子 | `return 'rgba(255,255,255,0.5)'` |
| 半透明彩色 | `return 'rgba('+r+','+g+','+b+',0.5)'` |
| 粒子升得更快 | `this.speed = Math.random() * 3` |

---

## 七、复用到其他页面的留言区

如需在其他页面（如 `/text/`、`/friends/`）的 Twikoo 留言区也添加彩色粒子，使用相同的包裹模式：

```html
<div id="页面名-twikoo-wrap" style="position: relative; overflow: hidden;">
    <%- partial('_partial/twikoo') %>
</div>
<script>
(function(){
    var container = document.getElementById('页面名-twikoo-wrap');
    // ... 与 musics 页面相同的 Canvas 粒子代码 ...
})();
</script>
```

只需修改 `id` 名称避免冲突即可。
