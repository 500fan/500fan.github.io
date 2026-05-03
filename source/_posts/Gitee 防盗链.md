---
title: Gitee 防盗链
date: 2019-07-22 10:43:47
categories: yy
cover: true
img: medias/featureimages/13.jpg
coverImg: images/33.jpeg
tags: 
 - 人
 - 事物
 - 世界
---
 
 未来楼市如村
 问题确认：Gitee 防盗链 (Anti-Hotlink)
 解决方案（推荐程度从高到低）
方案 1 ⭐ 用 jsDelivr CDN 代理 GitHub 仓库（最推荐）
如果你在 GitHub 上有同样的 fuliefu 仓库，可以免费加速且无防盗链：


https://cdn.jsdelivr.net/gh/huajiaojiang/fuliefu@master/image/hexomaterry/babecue.jpg
方案 2 用 GitHub Raw 直链

https://raw.githubusercontent.com/huajiaojiang/fuliefu/master/image/hexomaterry/babecue.jpg
方案 3 在博客 HTML <head> 里添加 no-referrer meta（快速绕过）
让浏览器不发送 Referer，Gitee 就无法识别跨站引用：


<meta name="referrer" content="no-referrer">
⚠️ 这会影响全站所有外链请求的 Referer，可能影响统计、评论等服务。

方案 4 把图片放到本地 source/ 目录
最稳定，但会增加仓库体积。

请问你希望我采用哪种方案修改 galleries.json？ 如果选方案 1 或 2，请确认你的图片是否同步在 GitHub 上；如果选方案 3，我帮你改主题的布局模板文件。

galleries.json
让浏览器不发送 Referer，Gitee 就无法识别跨站引用
修改详情
文件： themes/hexo-theme-matery/layout/_partial/head.ejs（第66行）

新增内容：


<meta name="referrer" content="no-referrer">
工作原理
修改前	修改后
浏览器加载图片时携带 Referer: https://你的博客域名/	浏览器不发送任何 Referer 头
Gitee 防盗链检测到跨站引用 → ❌ 403	Gitee 无法识别来源 → ✅ 正常返回
下一步操作
需要重新生成博客以使修改生效：


hexo clean && hexo g && hexo s
然后打开 http://localhost:4000 ，访问图库页面，第112行那张 babecue.jpg 以及其它 5 张 Gitee 图片应该都能正常显示了。

⚠️ 副作用提醒
no-referrer 是全站生效的，请注意以下可能受影响的功能：

功能	影响
第三方统计（百度统计、不蒜子等）	⚠️ 可能无法识别访问来源
Gitalk / 评论系统的 OAuth 跳转	✅ 不影响（OAuth 走的是 redirect_uri）
友链跳转统计	⚠️ 对方网站看不到访问来自你的博客
SEO（搜索引擎追踪）	⚠️ 轻微影响
如果你希望只对图片生效而不影响其它请求，可以告诉我，我可以改成更精细的方案——只在 <img> 标签上加 referrerpolicy="no-referrer"。

找到图库页面的模板，对 <img> 标签添加 referrerpolicy。

本次做了以下3处修改
1. 撤销全局 no-referrer（head.ejs）
✅ 已移除，博客恢复正常 Referer 行为，统计、评论等功能不受影响。

2. 修复第166行 URL（galleries.json）

- "https://raw.giteeusercontent.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/yao.jpg"
+ "https://gitee.com/huajiaojiang/fuliefu/raw/master/image/hexomaterry/yao.jpg"
3. 只对图库的 <img> 标签禁止 Referer（gallery.ejs 第35-37行）

- <img src="..." alt="...">
+ <img src="..." alt="..." referrerpolicy="no-referrer">
效果
场景	Referer 行为
图库页面加载图片（Gitee 等外部图床）	✅ 不发送 Referer，Gitee 返回 200
博客其它页面、Gitalk、统计等	✅ 正常发送 Referer，功能不受影响
生效方法

