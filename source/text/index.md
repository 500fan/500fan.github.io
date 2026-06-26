---
title: 文本
date: 2024-01-01 00:00:00
type: "page"
layout: "page"
top_img: "/medias/banner/shanpo.jpg"
---

# 欢迎来到本文页面

这是一段示例文本内容。你可以在这里写任何文字。

## 图文展示

<img src="/medias/featureimages/1.jpg" alt="示例图片" style="max-width:100%;height:auto;display:block;margin:0 auto;">

上面是一张图片，下面是更多内容。

<img src="/medias/featureimages/2.jpg" alt="示例图片2" style="max-width:100%;height:auto;display:block;margin:0 auto;">

## 视频展示

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:20px 0;">
  <iframe src="//player.bilibili.com/player.html?aid=15551509&bvid=BV1Wx411M7T1&cid=203125227&page=1"
    scrolling="no" border="0" frameborder="no"
    framespacing="0" allowfullscreen="true"
    style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
</div>

上面是 B 站视频，下面是另一段文字。

  <!-- Twikoo 评论区 -->
  <div id="tcomment" style="
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
  "></div>
  <script src="https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js"></script>
  <script>
    twikoo.init({
      envId: 'https://twikoo-ydp0.onrender.com',
      el: '#tcomment',
      path: window.location.pathname
    })
  </script>

  <!-- Waline 评论区 -->
  <div style="
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
  ">
    <link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css" />
    <style>
      #waline .wl-editor,
      #waline .wl-input,
      #waline textarea,
      #waline input {
        color: rgba(0, 0, 0, 1) !important;
        opacity: 1 !important;
      }
    </style>
    <div id="waline"></div>
    <script type="module">
      import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';
      init({
        el: '#waline',
        serverURL: 'https://waline-render-4h1r.onrender.com',
        lang: 'zh-CN',
        pageview: true,
        comment: true,
      });
    </script>
  </div>

  <!-- Giscus 评论区 (基于 GitHub Discussions) -->
  <div style="
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
  ">
    <script src="https://giscus.app/client.js"
            data-repo="500fan/Giscusliuyan"
            data-repo-id="R_kgDOSVH3MA"
            data-category="General"
            data-category-id="DIC_kwDOSVH3MM4C8ZLZ"
            data-mapping="pathname"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="bottom"
            data-theme="preferred_color_scheme"
            data-lang="zh-CN"
            data-loading="lazy"
            crossorigin="anonymous"
            async>
    </script>
  </div>

## 留言板

<div style="margin:20px 0;">
  <iframe src="https://shifuliefu.onrender.com/"
    style="width:100%;height:700px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"
    loading="lazy"
    allow="clipboard-write"
    title="留言板"></iframe>
</div>


## 总结

这是页面结尾的内容。
