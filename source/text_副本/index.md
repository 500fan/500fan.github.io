---
title: 文本
date: 2024-01-01 00:00:00
type: "page"
layout: "page"
top_img: "/medias/banner/nichuan.jpg"
---

# 欢迎来到本文页面

这是一段示例文本内容。你可以在这里写任何文字。

## 图文展示

![示例图片](/medias/featureimages/1.jpg)

上面是一张图片，下面是更多内容。

![示例图片2](/medias/featureimages/2.jpg)

## 视频展示

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:20px 0;">
  <iframe src="//player.bilibili.com/player.html?aid=15551509&bvid=BV1Wx411M7T1&cid=203125227&page=1"
    scrolling="no" border="0" frameborder="no"
    framespacing="0" allowfullscreen="true"
    style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
</div>

上面是 B 站视频，下面是另一段文字。

## 弹幕留言

<div id="danmaku-wrap" style="position:relative;width:100%;height:400px;background:rgba(0,0,0,0.03);border-radius:12px;overflow:hidden;margin:20px 0;">
  <canvas id="danmaku-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;"></canvas>
</div>

<div style="display:flex;gap:8px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
  <input id="danmaku-input" type="text" placeholder="输入弹幕，按 Enter 发送..." style="flex:1;min-width:200px;padding:10px 14px;border:1px solid #ccc;border-radius:8px;font-size:14px;background:transparent;color:rgba(0,0,0,1);opacity:1;" />
  <button onclick="sendDanmaku()" style="padding:10px 24px;background:linear-gradient(45deg,rgb(109,208,242) 15%,rgb(245,154,190) 85%);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;white-space:nowrap;">发送弹幕</button>
</div>

<link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css" />
<div id="waline-textfb" style="margin-top:20px;"></div>
<script type="module">
  import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';
  init({
    el: '#waline-textfb',
    serverURL: 'https://waline-render-4h1r.onrender.com',
    lang: 'zh-CN',
    pageview: true,
    comment: true,
  });
</script>

<script>
(function() {
  var WALINE_URL = 'https://waline-render-4h1r.onrender.com';
  var DMK_PATH = decodeURIComponent(window.location.pathname).replace(/\/+$/, '') || '/';
  var canvas = document.getElementById('danmaku-canvas');
  var ctx = canvas.getContext('2d');
  var activeDanmakus = [];
  var replayPool = [];
  var replayIndex = 0;
  var frameCount = 0;
  var defaultMessages = ['欢迎来到弹幕留言区~','快来发一条弹幕吧！','历史弹幕加载中...'];
  var COLORS = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0','#ff9f43','#ee5a24','#6ab04c','#686de0'];

  // 轨道系统：将画布分成固定轨道，避免弹幕重叠
  var LANE_HEIGHT = 36;  // 每条轨道高度
  var lanes = [];        // 每条轨道最后一弹幕的右边缘x坐标

  function getLaneCount() {
    return Math.max(1, Math.floor((canvas.height - 20) / LANE_HEIGHT));
  }

  function initLanes() {
    var count = getLaneCount();
    lanes = [];
    for (var i = 0; i < count; i++) lanes.push(0);
  }

  // 找到空闲轨道（该轨道最后一条弹幕已飘出足够远）
  function findFreeLane(textWidth) {
    var count = lanes.length;
    // 优先找完全空的轨道
    for (var i = 0; i < count; i++) {
      if (lanes[i] <= 0) return i;
    }
    // 找最后弹幕已飘出画布左侧的轨道
    for (var j = 0; j < count; j++) {
      if (lanes[j] < canvas.width - textWidth - 40) return j;
    }
    // 都满了，找最远的那条
    var minLane = 0;
    for (var k = 1; k < count; k++) {
      if (lanes[k] < lanes[minLane]) minLane = k;
    }
    return minLane;
  }

  function makeItem(text) {
    return {
      text: text.substring(0, 50),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 1.2 + Math.random() * 1.5,
      fontSize: 15 + Math.floor(Math.random() * 5)
    };
  }

  for (var d = 0; d < defaultMessages.length; d++) {
    replayPool.push(makeItem(defaultMessages[d]));
  }
  shuffle(replayPool);

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function resizeCanvas() {
    var wrap = document.getElementById('danmaku-wrap');
    canvas.width = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
    initLanes();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function createDanmaku(item, isUser) {
    ctx.font = 'bold ' + item.fontSize + 'px "Microsoft YaHei", sans-serif';
    var textWidth = ctx.measureText(item.text).width;
    var lane = findFreeLane(textWidth);
    this.text = item.text;
    this.color = item.color;
    this.speed = item.speed;
    this.fontSize = item.fontSize;
    this.x = canvas.width + 10;
    this.y = 10 + lane * LANE_HEIGHT + LANE_HEIGHT * 0.7;
    this.lane = lane;
    this.width = textWidth;
    this.stopped = false;  // 单条暂停状态
    // 标记轨道占用
    lanes[lane] = canvas.width + textWidth + 40;
  }

  // 点击单条弹幕暂停/播放
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    var clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    // 从后往前检测（后绘制的在上层）
    for (var i = activeDanmakus.length - 1; i >= 0; i--) {
      var d = activeDanmakus[i];
      var top = d.y - d.fontSize;
      var bottom = d.y + 4;
      if (clickX >= d.x && clickX <= d.x + d.width && clickY >= top && clickY <= bottom) {
        d.stopped = !d.stopped;
        break;
      }
    }
  });

  // 每帧绘制 + 投放
  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++;

    for (var i = activeDanmakus.length - 1; i >= 0; i--) {
      var d = activeDanmakus[i];
      ctx.font = 'bold ' + d.fontSize + 'px "Microsoft YaHei", sans-serif';
      ctx.globalAlpha = 1;
      // 暂停的弹幕加下划线标记
      if (d.stopped) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(d.x - 2, d.y - d.fontSize, d.width + 4, d.fontSize + 6);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillText(d.text, d.x + 1, d.y + 1);
      ctx.fillStyle = d.stopped ? '#999' : d.color;
      ctx.fillText(d.text, d.x, d.y);
      if (d.stopped) {
        // 暂停的弹幕加下划线
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y + 3);
        ctx.lineTo(d.x + d.width, d.y + 3);
        ctx.stroke();
      }
      // 未暂停才移动
      if (!d.stopped) d.x -= d.speed;
      if (d.x < -d.width - 20) {
        activeDanmakus.splice(i, 1);
      }
    }

    // 每45帧投放一条，屏幕上已有相同内容则跳过
    if (replayPool.length > 0 && frameCount % 45 === 0) {
      var item = replayPool[replayIndex];
      var isOnScreen = false;
      for (var k = 0; k < activeDanmakus.length; k++) {
        if (activeDanmakus[k].text === item.text) {
          isOnScreen = true;
          break;
        }
      }
      if (!isOnScreen) {
        activeDanmakus.push(new createDanmaku(item, false));
      }
      replayIndex++;
      if (replayIndex >= replayPool.length) {
        shuffle(replayPool);
        replayIndex = 0;
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(drawFrame);
  }
  drawFrame();

  // 从 Waline 加载历史弹幕
  function loadDanmakus() {
    if (!WALINE_URL) return;
    var url = WALINE_URL + '/api/comment?path=' + DMK_PATH + '&page=1&pageSize=50';
    fetch(url, { credentials: 'omit' })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        // 兼容 Waline 不同版本的返回格式
        var list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        }
        if (list.length > 0) {
          var newPool = [];
          for (var i = 0; i < list.length; i++) {
            var comment = list[i].comment || list[i].content || '';
            var tmp = document.createElement('div');
            tmp.innerHTML = comment;
            var txt = tmp.textContent || tmp.innerText || '';
            if (txt.trim()) {
              newPool.push(makeItem(txt.trim()));
            }
          }
          // 默认消息 + 历史数据合并，一起循环
          var defaultItems = [];
          for (var m = 0; m < defaultMessages.length; m++) {
            defaultItems.push(makeItem(defaultMessages[m]));
          }
          replayPool = defaultItems.concat(newPool);
          shuffle(replayPool);
          replayIndex = 0;
        }
      })
      .catch(function(e) {
        console.error('弹幕加载失败:', e);
      });
  }

  // 用户发送弹幕
  window.sendDanmaku = function() {
    var input = document.getElementById('danmaku-input');
    var text = input.value.trim();
    if (!text) { alert('请输入弹幕内容'); return; }

    var item = makeItem(text);
    // 立即飘出
    activeDanmakus.push(new createDanmaku(item, true));
    // 加入循环池
    replayPool.push(item);

    // 保存到 Waline
    if (WALINE_URL) {
      fetch(WALINE_URL + '/api/comment', {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: text,
          nick: '弹幕匿名',
          mail: 'danmaku-' + Date.now() + '@danmaku.local',
          link: '',
          ua: navigator.userAgent,
          url: DMK_PATH
        })
      }).catch(function() {});
    }
    input.value = '';
  };

  document.getElementById('danmaku-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); sendDanmaku(); }
  });

  loadDanmakus();
})();
</script>

## 总结

这是页面结尾的内容。
