;
(function($, window) {
    let APP = {
        plugins: {
            APlayer: {
                css: baseLink + "/source/js/APlayer/APlayer.min.css",
                js: baseLink + "/source/js/APlayer/APlayer.min.js"
            },
            bootstrap: {
              js: baseLink + "/source/css/bootstrap/js/bootstrap.min.js"
            },
            highlight: {
                js: baseLink + "/source/js/highlightjs/highlight.pack.js"
            },
            lazyLoad: {
                js: baseLink + "/source/js/jquery.lazyload.min.js"
            },
            toc: {
                js: baseLink + "/source/js/toc.js"
            },
            wayPoints: {
                js: baseLink + "/source/js/jquery.waypoints.min.js"
            }
        }
    };

    console.log("%c Theme." + themeName + " v" + version + " %c https://www.extlight.com/ ", "color: white; background: #e9546b; padding:5px 0;", "padding:4px;border:1px solid #e9546b;");

    $.ajaxSetup({
        cache: true
    });

    const loadResource = function() {
        let APlayer = APP.plugins.APlayer;
        $('head').append('<link href="' + APlayer.css + '" rel="stylesheet" type="text/css" />');
        $.getScript(APlayer.js);
        $.getScript("//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js");
        $("body").css("cursor", "url('" + baseLink + "/source/images/normal.cur'), default");
        $("a").css("cursor", "url('" + baseLink + "/source/images/link.cur'), pointer");
    };

    let CURRENT_MODE = "current_mode";
    const themModeEvent = function() {
        let mode = sessionStorage.getItem(CURRENT_MODE);
        if (!mode) {
            let hour = (new Date()).getHours();
            mode = (hour >= 6 && hour < 18 ? "light" : "dark");
        }
        $("html").attr("mode", mode);

        if (mode === "light") {
            $("#modeBtn").html('<i class="fa fa-moon-o"></i>');
        } else {
            $("#modeBtn").html('<i class="fa fa-sun-o"></i>');
        }
    };

    const optionEvent = function() {
        let body = $("body");

        let $options = $('<div class="options animated fadeInRight" id="option"><i class="fa fa-cog fa-2x faa-spin animated"></i></div>');
        body.append($options);

        let elements = [
            {"class": "up", "icon": "fa fa-arrow-up", "title": "回到顶部"},
            {"class": "change-mode", "icon": "fa fa-adjust", "title": "黑白模式"},
            {"class": "music", "icon": "fa fa-music", "title": "播放音乐"},
        ];

        let htmArr = [];
        for (let i = 0; i < elements.length; i++) {
            let ele = elements[i];
            htmArr.push('<div class="option-item '+ ele.class +'" title="'+ ele.title +'"> <i class="' + ele.icon+'"></i> </div> ');
        }

        body.append(htmArr.join(""));

        $("#option").off("click").on("click", function() {
            $(this).siblings(".option-item").toggleClass("show");
        });

        $(".up").off("click").on("click", function() {
            $('html, body').animate({
              scrollTop: $('html').offset().top
            }, 500);
        });

        $(".change-mode").off("click").on("click", function () {
            let $html = $("html");
            let mode = ($html.attr("mode") === "light" ? "dark" : "light");
            sessionStorage.setItem(CURRENT_MODE, mode);
            $html.attr("mode", mode);
            if (mode === "light") {
                $("#modeBtn").html('<i class="fa fa-moon-o"></i>');
            } else {
                $("#modeBtn").html('<i class="fa fa-sun-o"></i>');
            }
        });

        $(".music").off("click").on("click", function() {
            let $aplayer = $("#aplayer");
            if ($aplayer.hasClass("inited")) {
                $aplayer.toggleClass("show");
                return;
            }

            $.ajax({
                url: "/musicList.json",
                type: "GET",
                dataType: "JSON",
                success: function (resp) {
                    if (resp.success) {
                        if (resp.data.length === 0) {
                            layer.msg("博主未上传音乐资源");
                            return;
                        }
                        $aplayer.toggleClass("show");
                        new APlayer({
                            container: $aplayer.get(0),
                            fixed: true,
                            listFolded: true,
                            autoplay: true,
                            listMaxHeight: "120px",
                            audio: resp.data
                        });
                        $aplayer.addClass("inited");
                    } else {
                        layer.msg("加载数据异常");
                    }
                }
            });
        });

    };

    const changeModeEvent = function() {
        $("#modeBtn").off("click").on("click", function () {
            let $html = $("html");
            let mode = ($html.attr("mode") === "light" ? "dark" : "light");
            sessionStorage.setItem(CURRENT_MODE, mode);
            $html.attr("mode", mode);
            if (mode === "light") {
                $(this).html("<i class='fa fa-moon-o'></i>");
            } else {
                $(this).html("<i class='fa fa-sun-o'></i>");
            }
        });
    };

    const navBarShow = function() {
        let $navBar = $("#navBar");
        $(window).on("scroll", function() {
            let scrollTop = $(this).scrollTop();
            checkNav(scrollTop, $navBar);
        });

        window.onload = function () {
            let scrollTop = $(this).scrollTop();
            checkNav(scrollTop, $navBar);
        }
    };

    function checkNav(scrollTop, navBar) {
        if (scrollTop > 0) {
            navBar.addClass("show");
        } else {
            navBar.removeClass("show");
        }
    }

    const menuToggleEvent = function() {
        $("#menuToggle").off("click").on("click", function() {
            let $body = $("body");
            let $mask = $("<div class='common-mask'></div>");
            $body.append($mask);

            let $menu = $("ul.menu").clone();
            let $tinyMenu = $(".tiny-menu");
            $tinyMenu.html($menu);
            $body.addClass("tiny");

            $mask.off("click").on("click", function() {
                $(this).remove();
                $tinyMenu.html("");
                $body.removeClass("tiny");
            });
        });
    };

    const loadLazy = function() {
        $.getScript(APP.plugins.lazyLoad.js, function() {
            $("img.lazyload").lazyload({
                placeholder : baseLink + "/source/images/loading2.jpg",
                effect: "fadeIn"
            });
        })
    };

    const contentWayPoint = function () {
        $.getScript(APP.plugins.wayPoints.js, function() {
            $('.animate-box').waypoint(function (direction) {
                if (direction === 'down' && !$(this.element).hasClass('animated')) {
                    $(this.element).addClass('item-animate');
                    $('body .animate-box.item-animate').each(function (k) {
                        let el = $(this);
                        setTimeout(function () {
                            let effect = el.data('animate-effect');
                            effect = effect || 'fadeInUp';
                            el.addClass(effect + ' animated visible');
                            el.removeClass('item-animate');
                        }, k * 300, 'easeInOutExpo');
                    });
                }
            }, {
                offset: '85%'
            });
        });
    };

    const searchEvent = function() {

        let $body = $("body");
        let $iframe = $('<div id="modal-iframe" class="iziModal light"></div>');
        $body.append($iframe);

        $("#modal-iframe").iziModal({
            iframe: true,
            headerColor: "rgb(10,10,10)",
            title: '<i class="fa fa-search"></i> 站内搜索' ,
            width: 620,
            iframeHeight: 360,
            iframeURL: "/search/"
        });

        $("#searchBtn").off("click").on("click", function() {
            $('#modal-iframe').iziModal('open');
        });
    };

    const sidebarEvent = function() {
        $.getScript(APP.plugins.bootstrap.js, function() {
            let $sidebar = $("#sidebar");
            $sidebar.affix({ offset: 480});
            $sidebar.find("li.tab-item").off("click").on("click", function() {
                if ($(this).hasClass("active")) {
                    return;
                }

                let $tabItems = $sidebar.find(".tab-item");
                $tabItems.removeClass("active");
                $(this).addClass("active");

                let index = $tabItems.index($(this));

                let panelItems = $sidebar.find(".panel-item");
                panelItems.removeClass("active");
                $(panelItems.get(index)).addClass("active");
            });
        });
    };

    const rewardEvent = function() {
        $("#rewardBtn").off("click").on("click", function() {
            let $body = $("body");
            let $mask = $("<div class='common-mask'></div>");
            $body.append($mask);

            $(".post-reward .codes").addClass("visible");

            $mask.off("click").on("click", function() {
                $(this).remove();
                $(".post-reward .codes").removeClass("visible");
            });
        });

        $(".post-reward a").off("click").on("click", function() {
            if ($(this).hasClass("active")) {
                return;
            }

            let $old = $(".post-reward a.active");
            $old.removeClass("active");
            let $postReward = $(".post-reward");
            $postReward.find("." + $old.data("type")).removeClass("active");

            $(this).addClass("active");
            $postReward.find("." + $(this).data("type")).addClass("active");
        });
    };

    const praiseEvent = function() {
        $("#priseBtn").on("click",function () {
            let postId = $(this).data("postId");
            if (sessionStorage.getItem("hasPrize" + postId)) {
                layer.msg("已点赞,请勿频繁操作");
                return;
            }

            $.post("/praisePost/" + postId, null, function (resp) {
                if (resp.success) {
                    layer.msg("点赞成功");
                    $("#prizeNum").text(resp.data);
                    sessionStorage.setItem("hasPrize" + postId, "y");
                }
            },"json");
        });
    };

    const copyInfoEvent = function() {
        let clipboard = new ClipboardJS('.info-btn');
        clipboard.on('success', function(e) {
            layer.msg("复制成功");
            e.clearSelection();
        });
    };

    const copyCodeEvent = function() {
        let $highlightArr = $(".highlight");
        $highlightArr.each(function(index, domEle) {
            let $highlight = $(domEle);
            let $table = $highlight.find("table");
            let copyBtn = $("<span class='copy-btn'><i class='fa fa-clone'></i> 复制</span>");
            $highlight.append(copyBtn);
            let clipboard = new ClipboardJS(copyBtn.get(0), {
                text: function(trigger) {
                    let html = $table.find("td.code pre").html();
                    html = html.replace(/<br>/g, "\r\n");
                    return $(html).text();
                }
            });

            clipboard.on('success', function(e) {
                layer.msg("复制成功");
                e.clearSelection();
            });
        });
    };

    const runCodeEvent = function() {
        $(".run-code").on("click", function() {
            let $btn = $(this);
            let html = $btn.prev("figure").find("td.code pre").html();
            html = html.replace(/<br>/g, "\r\n");
            let codeContent = $(html).text();
            let childWin = window.open("", "_blank", "");
            childWin.document.open("text/html", "replace");
            childWin.opener = null;
            childWin.document.write(codeContent);
            childWin.document.close()
        });
    };

    const dynamicEvent = function() {
        let $dynamic = $("#dynamicList");
        if ($dynamic.length > 0) {
            $(".praise").off("click").on("click",function () {
                let that = this;
                let id = $(this).data("id");
                let key = "dynamic-hasPrize" + id;
                if (sessionStorage.getItem(key)) {
                    layer.msg("已点赞");
                    return;
                }

                $.post("/praiseDynamic/" + id, null, function (resp) {
                    if (resp.success) {
                        $(that).find(".praise-num").text(resp.data);
                        $(that).find(".fa").css("color", "red");
                        sessionStorage.setItem(key, "y");
                        layer.msg("点赞成功");
                    }
                },"json");

            });
        }
    };

    const postEvent = function() {
        let $postDetail = $(".post-detail");
        if ($postDetail.length > 0) {

            $.getScript(APP.plugins.toc.js, function () {
                $(".post-toc").html(tocHelper("nav"));
                $('body').scrollspy({ offset: 100, target: '.post-toc' });
                let headArr = $(".post-detail").find("h3");
                $(window).scroll(function(e) {
                    let scrollTop = $(this).scrollTop();
                    // 确认当前滚动的目录索引
                    let current = 0;
                    $.grep(headArr, function(domEle, index) {
                        if (scrollTop >= $(domEle).offset().top - 100) {
                            current = index;
                            return true;
                        }
                    });
                    $(".post-toc").find("li.nav-level-2").removeClass("active");
                    let currentHead = $(".post-toc").find("li.nav-level-2").eq(current);
                    currentHead.addClass("active");
                });
            });

            $.getScript(APP.plugins.highlight.js, function () {
                document.querySelectorAll('figure span').forEach((block) => {
                    hljs.highlightBlock(block);
                });
            });

            sidebarEvent();
            rewardEvent();
            praiseEvent();
            copyCodeEvent();
            runCodeEvent();
        }
    };

    const pjaxEvent = function() {
        $(document).pjax('a[data-pjax]', '#wrap', {fragment: '#wrap', timeout: 8000});
        $(document).on('pjax:start', function() {});
        $(document).on('pjax:complete',   function(e) {
            chickenSoup();
            dynamicEvent();
            postEvent();
            $.getScript("//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js");
            pushEvent();

            let $navBar = $("#navBar");
            let $arr = $navBar.find("ul.menu>li");
            $arr.removeClass("current");
            let $target = $navBar.find("ul.menu>li>a").filter("[href='" + window.location.pathname + "']");
            $target.parent("li").addClass("current");
        });
        $(document).on('pjax:end', function() { scrollIndicator(); contentWayPoint(); loadLazy();});
    };

    const chickenSoup = function() {
        let $notice = $("#notice");
        if ($notice.length > 0) {
            let value = sessionStorage.getItem("chickenSoup");
            if (value) {
                $notice.html("<div class='animated fadeInDown'><i class='fa fa-bullhorn'></i> 当前毒鸡汤: " + value + "</div>");
            } else {
                $.ajax({
                    type: "GET",
                    url: "chickenSoup.json",
                    dataType: "JSON",
                    success: function(resp) {
                        $notice.html("<div class='animated fadeInDown'><i class='fa fa-bullhorn'></i> 当前毒鸡汤: " + resp.data.data + "</div>");
                        sessionStorage.setItem("chickenSoup", resp.data.data);
                    }
                });
            }
        }
    };

    const pushEvent = function() {
        $.getScript("https://zz.bdstatic.com/linksubmit/push.js");
    };

    const scrollIndicator = function () {
        let $window = $(window);
        let $line = $("#scroll-line");
        let $left = $(".left");
        let $right = $(".right");
        let winTop = $window.scrollTop(), docHeight = $(document).height(), winHeight = $(window).height();
        calcProcess(winTop, docHeight, winHeight, $line, $left, $right);

        $window.on('scroll', function() {
            let winTop = $window.scrollTop(), docHeight = $(document).height(), winHeight = $(window).height();
            calcProcess(winTop, docHeight, winHeight, $line, $left, $right);
        });
    };

    function calcProcess(winTop, docHeight, winHeight, line, left, right) {
        let scrolled;
        let denominator = docHeight - winHeight;
        if (denominator > 0) {
            scrolled =  (winTop / denominator) * 100;
        } else {
            scrolled = 100;
        }
        line.css('width', scrolled + '%');
        $("#progress-value").html(parseInt(scrolled + "") + '%');
        let num = scrolled * 3.6;
        if (scrolled <= 50) {
            right.css({"transform":"rotate(" + (num - 180) + "deg)"});
            left.css({"transform":"rotate(-180deg)"});
        } else {
            right.css({"transform":"rotate(0deg)"});
            left.css({"transform":"rotate(" + (num - 360) + "deg)"});
        }
    }

    const ServiceWorker = function() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js');
            });
        }
    };

    $(function() {
        scrollIndicator();
        themModeEvent();
        optionEvent();
        changeModeEvent();
        navBarShow();
        menuToggleEvent();
        loadLazy();
        contentWayPoint();
        searchEvent();
        copyInfoEvent();
        dynamicEvent();
        postEvent();
        pjaxEvent();
        loadResource();
        chickenSoup();
        pushEvent();
        ServiceWorker();
    });

})(jQuery, window);
