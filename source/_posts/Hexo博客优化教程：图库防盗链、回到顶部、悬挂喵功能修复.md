---
title: Hexo博客优化教程：图库防盗链、回到顶部、悬挂喵功能修复
date: 2026-05-02
categories: 技术教程
tags:
  - Hexo
  - Gitee
  - 防盗链
  - 图库
  - 回到顶部
  - CSS
  - JavaScript
---

本教程记录了本次对 Hexo 博客的三项修复和优化，包括 Gitee 图库防盗链解决方案、回到顶部按钮冲突修复，以及悬挂喵动画功能的保留。

---

## 一、Gitee 图库防盗链问题

### 问题现象

`galleries.json` 中引用 Gitee 的图片（如 `https://gitee.com/huajiaojiang/fuliefu/raw/master/...`），在浏览器中打开图库页面时不显示，但直接在浏览器地址栏访问该 URL 却能正常加载。

### 原因分析

Gitee 启用了**防盗链（Anti-Hotlink）**机制。当浏览器从你的博客页面加载图片时，会携带 `Referer` 请求头（值为你的博客域名），Gitee 检测到来源不是 `gitee.com`，直接返回 **HTTP 403 Forbidden**。

验证方法：

```bash
# 直接请求（无 Referer）→ 正常返回
curl -s -o /dev/null -w "%{http_code}" "https://gitee.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/babecue.jpg"
# 结果：200

# 带 Referer 头（模拟浏览器从博客加载）→ 被拒绝
curl -s -o /dev/null -w "%{http_code}" -H "Referer: https://example.com/" "https://gitee.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/babecue.jpg"
# 结果：403
```

### 解决方案：只对图库图片禁止 Referer

**不推荐**全局 `<meta name="referrer" content="no-referrer">`，因为会影响统计、评论等功能。

**推荐方案**：在图库模板的 `<img>` 标签上添加 `referrerpolicy="no-referrer"` 属性，**仅对图片生效**。

修改文件：`themes/hexo-theme-matery/layout/gallery.ejs`，找到渲染 `<img>` 标签的位置：

```ejs
// 修改前
imageStr += "<a href=\"" + photoUrl + "\"" +
        "     class=\"photo-item\" rel=\"example_group\"" +
        "     data-fancybox=\"images\">" +
        "      <img src=\"" + photoUrl + "\"" +
        "       alt=\"" + photo + "\">" +
        "    </a>"

// 修改后：在 <img> 标签上添加 referrerpolicy="no-referrer"
imageStr += "<a href=\"" + photoUrl + "\"" +
        "     class=\"photo-item\" rel=\"example_group\"" +
        "     data-fancybox=\"images\">" +
        "      <img src=\"" + photoUrl + "\"" +
        "       alt=\"" + photo + "\"" +
        "       referrerpolicy=\"no-referrer\">" +
        "    </a>"
```

### 效果对比

| 场景 | 修改前 | 修改后 |
|------|--------|--------|
| 图库页面加载 Gitee 图片 | ❌ 403 不显示 | ✅ 正常显示 |
| 博客其它页面 / Gitalk / 统计 | ✅ 正常 | ✅ 正常（不受影响） |

---

## 二、galleries.json 语法错误修复

### 问题现象

`galleries.json` 中部分图库完全不显示，Hexo 生成的页面为空。

### 原因分析

1. **URL 域名错误**：使用了不存在的 `raw.giteeusercontent.com`（混淆了 GitHub 的 `raw.githubusercontent.com`），应改为 `gitee.com`。
2. **JSON 语法错误**：URL 字符串中间被插入了换行符 `\n`，导致 JSON 解析失败。
3. **多余残留代码**：对象已用 `}` 闭合后，仍有孤立的 `"淘宝01.png"` 等残留内容。

### 修复方法

**修正 URL 域名**：

```diff
- "https://raw.giteeusercontent.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/yao.jpg"
+ "https://gitee.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/yao.jpg"
```

**合并被换行截断的 URL**（JSON 不允许字符串内有裸换行符）：

```diff
- "https://raw.githubusercontent.com/.../babecue.jpg
- ",
+ "https://raw.githubusercontent.com/.../babecue.jpg",
```

**删除闭合括号后多余的残留代码**：

```diff
      ]
-   }
-       "淘宝01.png"
-     ]
-   },
+   },
```

验证 JSON 语法：

```bash
python3 -c "import json; json.load(open('source/_data/galleries.json')); print('✓ JSON valid')"
```

---

## 三、回到顶部按钮 + 悬挂喵冲突修复

### 问题现象

博客页面有**两个功能元素**同时存在但互相冲突：

| 元素 | 来源 | 功能 |
|------|------|------|
| 回到顶部按钮 | `_partial/back-top.ejs`（`#backTop.top-scroll`） | 滚动显示 ↑ 按钮，点击回到顶部 |
| 悬挂的喵 | `layout.ejs` 引入的 `szgotop.js`（`.back-to-top.cd-top`） | 页面右侧悬挂一只小猫动画 |

原来的 `szgotop.js` 绑定的是 `.back-to-top` 类，同时控制显示/隐藏**和**点击跳转。但 `.back-to-top` 这个类名与 `_partial/back-top.ejs` 中的回到顶部按钮产生冲突，导致两者都不能正常工作。

### 解决方案

1. **保留 `_partial/back-top.ejs`** 作为正式的回到顶部按钮（由 `matery.js` 控制）。
2. **去掉外部 `szgotop.js`**，改为内联脚本，只控制悬挂喵的显示/隐藏，且用 `.not('#backTop')` 排除正式按钮。
3. 悬挂喵的 CSS 仍引用 `szgotop.css`（提供背景图 `scroll.gif` 和动画）。

修改文件：`themes/hexo-theme-matery/layout/layout.ejs`

```html
<!-- 悬挂的喵 -->
<link rel="stylesheet" type="text/css" href="https://blog-static.cnblogs.com/files/fsh001/szgotop.css" />
<div class="back-to-top cd-top faa-float animated cd-is-visible" style="top: -999px;"></div>
<script>
$(window).scroll(function() {
    if ($(window).scrollTop() > 500) {
        $('.back-to-top').not('#backTop').css('top','-200px');
    } else {
        $('.back-to-top').not('#backTop').css('top','-999px');
    }
});
$('.back-to-top').not('#backTop').click(function() {
    $('body,html').animate({scrollTop: 0}, 600);
});
</script>
```

关键点：
- `.not('#backTop')` 确保只操作悬挂喵的 `<div>`，不影响 `#backTop.top-scroll` 按钮。
- 滚动超过 500px 显示，低于则隐藏。
- 点击喵也可以回到顶部（附加体验）。

### 生效方法

```bash
hexo clean && hexo g && hexo s
```

---

## 四、Node.js DEP0170 警告修复

### 问题现象

Hexo 生成时出现警告：

```
(node:2340) [DEP0170] DeprecationWarning: The URL http://localhost:4000，访问图库页面，第112行那张 is invalid.
```

### 原因分析

Markdown 文件中，中文逗号 `，` 紧贴 URL 结尾，Node.js 把 `http://localhost:4000，访问图库页面，第112行那张` 整体当作一个 URL 来解析。

### 修复方法

在 URL 和中文之间加一个空格：

```diff
- 然后打开 http://localhost:4000，访问图库页面
+ 然后打开 http://localhost:4000 ，访问图库页面
```

---

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `source/_data/galleries.json` | 修正 URL 域名、修复换行截断、删除残留代码 |
| `themes/hexo-theme-matery/layout/gallery.ejs` | `<img>` 添加 `referrerpolicy="no-referrer"` |
| `themes/hexo-theme-matery/layout/layout.ejs` | 用内联脚本替代 `szgotop.js`，保留悬挂喵，避免冲突 |
| `source/_posts/Gitee 防盗链.md` | URL 后加空格修复 DEP0170 警告 |
