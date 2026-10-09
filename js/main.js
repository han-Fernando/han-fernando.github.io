/* =========================================================
   优胜美地国家公园 · Yosemite National Park（中文信息站）
   交互脚本 main.js
   ---------------------------------------------------------
   目录：
   01. 工具函数
   02. Banner 轮播（自动播放 / 箭头 / 圆点 / 键盘 / 悬停暂停 / 触摸滑动）
   03. 移动端抽屉菜单
   04. 四季游览 Tab 切换
   05. 页内轻提示 Toast
   06. 返回顶部按钮
   07. 导航滚动状态与当前区块高亮
   08. 滚动入场动画
   09. 警示条关闭
   10. 平滑锚点跳转（兼容固定导航）
   11. 初始化
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     01. 工具函数
     ========================================================= */

  /**
   * 选中单个元素
   * @param {string} sel CSS 选择器
   * @param {Element|Document} [ctx=document] 查询上下文
   * @returns {Element|null}
   */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  /**
   * 选中多个元素并转为真数组（便于使用 forEach / filter）
   * @param {string} sel CSS 选择器
   * @param {Element|Document} [ctx=document] 查询上下文
   * @returns {Element[]}
   */
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /**
   * 节流：限制函数在指定时间窗口内最多执行一次（用于 scroll 事件）
   * @param {Function} fn
   * @param {number} [wait=120] 毫秒
   * @returns {Function}
   */
  function throttle(fn, wait) {
    var last = 0;
    var timer = null;
    return function () {
      var now = Date.now();
      var args = arguments;
      var self = this;
      if (now - last >= (wait || 120)) {
        last = now;
        fn.apply(self, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          last = Date.now();
          timer = null;
          fn.apply(self, args);
        }, (wait || 120) - (now - last));
      }
    };
  }

  /* =========================================================
     02. Banner 轮播
     ========================================================= */
  var Hero = {
    index: 0,
    slides: [],
    dots: [],
    timer: null,
    INTERVAL: 5500, // 自动切换间隔（毫秒）

    init: function () {
      this.slides = $$('.slide');
      this.dots = $$('.dots button');
      if (!this.slides.length) return;

      var self = this;

      // 箭头按钮：data-hero 属性驱动，避免在 HTML 内写内联事件
      $$('[data-hero]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.move(parseInt(btn.getAttribute('data-hero'), 10));
        });
      });

      // 指示圆点
      this.dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          self.go(i);
        });
      });

      // 键盘左右方向键切换（仅在焦点不在输入框时生效）
      document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (e.key === 'ArrowLeft') self.move(-1);
        if (e.key === 'ArrowRight') self.move(1);
      });

      // 鼠标悬停暂停自动播放
      var hero = $('.hero');
      if (hero) {
        hero.addEventListener('mouseenter', function () { self.pause(); });
        hero.addEventListener('mouseleave', function () { self.play(); });
      }

      // 移动端触摸左右滑动
      this.bindTouch(hero);

      // 页面切到后台时暂停，省电且避免返回时跳帧
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { self.pause(); } else { self.play(); }
      });

      this.play();
    },

    /** 渲染当前索引对应的激活状态 */
    render: function () {
      var cur = this.index;
      this.slides.forEach(function (s, i) {
        s.classList.toggle('active', i === cur);
      });
      this.dots.forEach(function (d, i) {
        d.classList.toggle('active', i === cur);
        d.setAttribute('aria-current', i === cur ? 'true' : 'false');
      });
    },

    /** 相对位移切换（n 为 +1 / -1，支持循环） */
    move: function (n) {
      if (isNaN(n)) return;
      this.index = (this.index + n + this.slides.length) % this.slides.length;
      this.render();
      this.restart();
    },

    /** 跳到指定索引 */
    go: function (i) {
      this.index = i;
      this.render();
      this.restart();
    },

    play: function () {
      var self = this;
      if (this.timer) return;
      this.timer = setInterval(function () {
        self.index = (self.index + 1) % self.slides.length;
        self.render();
      }, this.INTERVAL);
    },

    pause: function () {
      clearInterval(this.timer);
      this.timer = null;
    },

    /** 手动操作后重置计时，避免刚点击就自动切换 */
    restart: function () {
      this.pause();
      this.play();
    },

    /** 触摸滑动支持 */
    bindTouch: function (el) {
      if (!el) return;
      var self = this;
      var startX = 0;
      var startY = 0;
      var tracking = false;

      el.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
        self.pause();
      }, { passive: true });

      el.addEventListener('touchend', function (e) {
        if (!tracking) return;
        tracking = false;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        // 横向位移足够大且明显大于纵向，才算有效滑动
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          self.move(dx < 0 ? 1 : -1);
        } else {
          self.play();
        }
      }, { passive: true });
    }
  };

  /* =========================================================
     03. 移动端抽屉菜单
     ========================================================= */
  var Drawer = {
    init: function () {
      var self = this;
      this.el = $('#drawer');

      var openBtn = $('[data-drawer-open]');
      var closeBtn = $('[data-drawer-close]');
      if (openBtn) openBtn.addEventListener('click', function () { self.open(); });
      if (closeBtn) closeBtn.addEventListener('click', function () { self.close(); });

      // 点击菜单项后关闭抽屉
      $$('#drawer a').forEach(function (a) {
        a.addEventListener('click', function () { self.close(); });
      });

      // ESC 关闭
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') self.close();
      });
    },

    open: function () {
      if (!this.el) return;
      this.el.classList.add('open');
      this.el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },

    close: function () {
      if (!this.el) return;
      this.el.classList.remove('open');
      this.el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  /* =========================================================
     04. 四季游览 Tab 切换
     ========================================================= */
  var Seasons = {
    init: function () {
      var panels = $$('.season-panel');
      var buttons = $$('.season-tabs button');
      if (!panels.length || !buttons.length) return;

      buttons.forEach(function (btn, i) {
        btn.addEventListener('click', function () {
          panels.forEach(function (p, k) {
            p.classList.toggle('active', k === i);
          });
          buttons.forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        });
      });

      this.preloadHidden(panels);
    },

    /** 空闲时预载隐藏面板里的图片
     *
     * 隐藏面板是 display:none，浏览器永远不会触发 loading="lazy"，
     * 导致用户切 Tab 时先看到一片空白。这里在页面空闲时主动加载，
     * 既不影响首屏速度，又消除切换时的空白闪烁。
     */
    preloadHidden: function (panels) {
      var load = function () {
        panels.forEach(function (panel) {
          if (panel.classList.contains('active')) return;
          $$('img[loading="lazy"]', panel).forEach(function (img) {
            img.removeAttribute('loading');
            // 重新赋值同一个 src 以触发浏览器开始加载
            var src = img.getAttribute('src');
            if (src) img.src = src;
          });
        });
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(load, { timeout: 2500 });
      } else {
        setTimeout(load, 1200);
      }
    }
  };

  /* =========================================================
     05. 页内轻提示 Toast
     ========================================================= */
  var Toast = {
    timer: null,

    /** 显示一条提示
     * @param {string} msg 提示文案
     * @param {number} [duration=2800] 持续毫秒数
     */
    show: function (msg, duration) {
      var el = $('#toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(this.timer);
      this.timer = setTimeout(function () {
        el.classList.remove('show');
      }, duration || 2800);
    },

    init: function () {
      var self = this;
      // 统一接管所有带 data-toast 属性的元素
      $$('[data-toast]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          // 若是链接且只用于演示，阻止跳转
          if (el.tagName === 'A' && el.getAttribute('href') === '#') {
            e.preventDefault();
          }
          self.show(el.getAttribute('data-toast'));
        });
      });
    }
  };

  /* =========================================================
     06. 返回顶部按钮
     ========================================================= */
  var ToTop = {
    init: function () {
      this.btn = $('#toTop');
      if (!this.btn) return;
      var self = this;
      this.btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      this.onScroll();
    },

    onScroll: function () {
      if (!this.btn) return;
      this.btn.classList.toggle('show', window.scrollY > 600);
    }
  };

  /* =========================================================
     07. 导航滚动状态与当前区块高亮
     ========================================================= */
  var Nav = {
    init: function () {
      this.bar = $('.topbar');
      this.links = $$('.nav a[href^="#"]');
      this.sections = this.links
        .map(function (a) {
          var id = a.getAttribute('href').slice(1);
          return id ? document.getElementById(id) : null;
        })
        .filter(Boolean);
      this.onScroll();
    },

    onScroll: function () {
      var y = window.scrollY;

      // 顶栏背景加深
      if (this.bar) this.bar.classList.toggle('scrolled', y > 40);

      // 当前所在区块高亮：取最后一个已越过视口上 1/3 处的区块
      var currentId = '';
      var mark = y + window.innerHeight / 3;
      this.sections.forEach(function (sec) {
        if (sec.offsetTop <= mark) currentId = sec.id;
      });

      this.links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
      });
    }
  };

  /* =========================================================
     08. 滚动入场动画
     ---------------------------------------------------------
     已迁移至 motion.js 的 Reveal 模块（支持方向、错峰、遮罩）。
     此处保留一个安全兜底：若 motion.js 未能加载（例如离线、
     被拦截），则把带 data-reveal 的元素直接显示，避免内容
     因 opacity:0 而永久不可见。
     ========================================================= */
  var RevealFallback = {
    init: function () {
      // motion.js 正常加载时会挂载全局 API，此时无需兜底
      if (window.YosemiteMotion) return;

      $$('[data-reveal]').forEach(function (el) {
        el.classList.add('is-revealed');
      });
      $$('[data-count]').forEach(function (el) {
        el.textContent = el.getAttribute('data-count');
      });
    }
  };

  /* =========================================================
     09. 警示条关闭
     ========================================================= */
  var AlertBar = {
    init: function () {
      var bar = $('#alertBar');
      var close = $('[data-alert-close]');
      if (!bar || !close) return;
      close.addEventListener('click', function () {
        bar.style.display = 'none';
      });
    }
  };

  /* =========================================================
     10. 平滑锚点跳转（兼容固定导航高度）
     ========================================================= */
  var SmoothAnchor = {
    init: function () {
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href');
          if (!href || href === '#') return;

          var target = document.getElementById(href.slice(1));
          if (!target) return;

          e.preventDefault();
          var navH = ($('.topbar') || {}).offsetHeight || 74;
          var top = target.getBoundingClientRect().top + window.scrollY - navH + 1;

          window.scrollTo({ top: top, behavior: 'smooth' });
          // 更新地址栏，便于分享与回退
          if (history.replaceState) history.replaceState(null, '', href);
        });
      });
    }
  };

  /* =========================================================
     10.5 VideoBox —— 首页宣传片
     ---------------------------------------------------------
     海报 + 自绘播放键作为封面，点击后真正调用 video.play()，
     并隐藏封面（播放键 / 字幕条），把控制权交还给原生控件。
     带 controls 属性会与封面打架，所以默认移除、播放时再加回。
     ========================================================= */

  var VideoBox = {
    init: function () {
      $$('[data-video]').forEach(function (box) {
        var video = $('.video-el', box);
        var playBtn = $('[data-video-play]', box);
        if (!video || !playBtn) return;

        // 封面期间不要出现原生控件
        video.removeAttribute('controls');

        var showCover = function () {
          box.classList.remove('is-playing');
          video.removeAttribute('controls');
        };
        var hideCover = function () {
          box.classList.add('is-playing');
          video.setAttribute('controls', '');
        };

        var start = function (e) {
          if (e) e.preventDefault();
          hideCover();
          var p = video.play();
          // 播放被拒绝（如浏览器策略）时退回封面，避免黑屏无提示
          if (p && p.catch) {
            p.catch(function () {
              showCover();
              Toast.show('视频无法自动播放，请点击视频区域手动播放');
            });
          }
        };

        playBtn.addEventListener('click', start);
        video.addEventListener('click', function () {
          if (!box.classList.contains('is-playing')) start();
        });

        // 播完 / 暂停到开头时重新显示封面
        video.addEventListener('ended', showCover);

        // 键盘可达：封面状态下回车 / 空格也能播放
        playBtn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') start(e);
        });
      });
    }
  };

  /* =========================================================
     11. 初始化
     ========================================================= */
  function init() {
    Hero.init();
    Drawer.init();
    Seasons.init();
    Toast.init();
    ToTop.init();
    Nav.init();
    RevealFallback.init();
    AlertBar.init();
    SmoothAnchor.init();
    VideoBox.init();

    // 所有滚动相关逻辑合并到一个节流监听里，减少性能开销
    window.addEventListener('scroll', throttle(function () {
      ToTop.onScroll();
      Nav.onScroll();
    }, 100), { passive: true });
  }

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露到全局，方便在控制台调试或后续扩展
  window.YosemiteSite = {
    toast: Toast.show.bind(Toast),
    goSlide: Hero.go.bind(Hero)
  };
})();
