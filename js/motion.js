/* =========================================================
   优胜美地国家公园 · Yosemite National Park（中文信息站）
   动效引擎 motion.js
   ---------------------------------------------------------
   一套统一的滚动驱动动画系统。设计原则：

   1. 单一 rAF 循环 —— 全站所有滚动动效共用一次读写，
      不做 N 个独立 scroll 监听（避免布局抖动）
   2. 只动 transform / opacity —— GPU 合成，不触发重排
   3. 视口外自动停机 —— IntersectionObserver 标记可见性，
      不可见的元素不参与计算
   4. 全站尊重 prefers-reduced-motion —— 开启时直接关闭引擎

   目录：
   01. 常量与状态
   02. 缓动函数
   03. 工具函数
   04. ScrollBus —— 滚动总线（统一 rAF 循环）
   05. Parallax —— 视差层（Hero 分层 + 图片纵深）
   06. Reveal —— 区块错峰入场
   07. Counter —— 数字滚动计数
   08. Rail —— 横向轨道滚动推进
   09. ProgressRail —— 右侧章节进度指示器
   10. Header —— 顶栏滚动状态机
   11. Magnetic —— 磁性按钮
   12. SplitText —— 标题逐字浮现
   13. CursorSpot —— 光斑跟随（桌面端）
   14. 初始化与全局 API
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     01. 常量与状态
     ========================================================= */

  /** 是否尊重用户的「减弱动态效果」系统设置 */
  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 是否为触摸设备（用于关闭鼠标相关的花哨效果） */
  var TOUCH = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);

  /** 是否为窄屏 */
  var isNarrow = function () {
    return window.innerWidth <= 960;
  };

  /* =========================================================
     02. 缓动函数
     ========================================================= */

  var Ease = {
    /** 线性 */
    linear: function (t) { return t; },

    /** 缓出三次 —— 入场动画的默认手感，快起慢收 */
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },

    /** 缓入缓出三次 —— 视差位移用，两端平滑 */
    inOutCubic: function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /** 缓出四次 —— 比 outCubic 更"急刹"，用于磁性回弹 */
    outQuart: function (t) { return 1 - Math.pow(1 - t, 4); }
  };

  /* =========================================================
     03. 工具函数
     ========================================================= */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /** 数值区间映射 */
  function map(v, a, b, c, d) {
    if (b === a) return c;
    return c + (d - c) * ((v - a) / (b - a));
  }

  /** 把数值夹在 [min, max] 内 */
  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  /** 保留小数位，减少 style 写入字符串长度 */
  function r2(v) { return Math.round(v * 100) / 100; }

  /** 写入 transform（统一前缀，避免各处手写字符串） */
  function setT(el, x, y, scale, extra) {
    var s = 'translate3d(' + r2(x) + 'px,' + r2(y) + 'px,0)';
    if (scale != null) s += ' scale(' + (Math.round(scale * 1000) / 1000) + ')';
    if (extra) s += ' ' + extra;
    el.style.transform = s;
  }

  /* =========================================================
     04. ScrollBus —— 滚动总线
     ---------------------------------------------------------
     全站唯一的滚动驱动核心。所有动效模块把自己注册进来，
     每帧只读取一次 scrollY / viewport 尺寸，然后依次执行。
     ========================================================= */

  var ScrollBus = {
    /** @type {Array<{el:Element, update:Function, active:boolean}>} */
    subscribers: [],
    scrollY: 0,
    vh: 0,
    vw: 0,
    ticking: false,
    observer: null,

    init: function () {
      var self = this;

      this.scrollY = window.scrollY;
      this.vh = window.innerHeight;
      this.vw = window.innerWidth;

      // 可见性观察器：只让进入视口（含上下各 1 屏余量）的元素参与计算
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var rec = entry.target.__motionRec;
            if (rec) {
              rec.active = entry.isIntersecting;
              // 刚进入视口时立即算一次，避免第一帧位置错位
              if (entry.isIntersecting) self.schedule();
            }
          });
        }, { rootMargin: '100% 0px 100% 0px' });
      }

      // 滚动：只标记需要重算，真正的计算在 rAF 里
      window.addEventListener('scroll', function () {
        self.schedule();
      }, { passive: true });

      // 尺寸变化：更新缓存并全量重算
      window.addEventListener('resize', function () {
        self.vh = window.innerHeight;
        self.vw = window.innerWidth;
        self.schedule();
      }, { passive: true });

      // 启动首帧
      this.schedule();
    },

    /** 请求下一帧执行一次更新 */
    schedule: function () {
      if (this.ticking) return;
      this.ticking = true;
      var self = this;
      requestAnimationFrame(function () {
        self.ticking = false;
        self.update();
      });
    },

    /** 每帧的实际执行体 */
    update: function () {
      this.scrollY = window.scrollY;
      var subs = this.subscribers;
      for (var i = 0; i < subs.length; i++) {
        var rec = subs[i];
        if (!rec.active) continue;       // 视口外直接跳过
        rec.update(this.scrollY, this.vh, this.vw);
      }
    },

    /**
     * 注册一个动效订阅者
     * @param {Element} el 用于可见性判断的元素
     * @param {Function} update 每帧回调 (scrollY, vh, vw) => void
     */
    add: function (el, update) {
      var rec = { el: el, update: update, active: true };
      el.__motionRec = rec;
      this.subscribers.push(rec);
      if (this.observer) this.observer.observe(el);
      return rec;
    }
  };

  /* =========================================================
     05. Parallax —— 视差层
     ---------------------------------------------------------
     读取元素的 data-parallax 值作为位移强度系数。
     原理：元素中心相对视口中心的偏移 × 系数 = 位移量。
     负数向上飘（更"远"），正数向下沉（更"近"）。

     可选属性：
       data-parallax-axis="x|y"     位移轴，默认 y
       data-parallax-scale          是否叠加缩放，默认关闭
       data-parallax-fade           向上位移时同步淡出
                                    适合首屏文字层
     ========================================================= */

  var Parallax = {
    init: function () {
      var self = this;
      $$('[data-parallax]').forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
        var axis = el.getAttribute('data-parallax-axis') || 'y';
        var scaleOn = el.hasAttribute('data-parallax-scale');
        var baseScale = parseFloat(el.getAttribute('data-parallax-scale')) || 1;
        var fadeOn = el.hasAttribute('data-parallax-fade');

        // fade 模式下位移量收敛很多，避免文字飞得太远
        if (fadeOn) speed = Math.min(speed, 0.14);

        ScrollBus.add(el, function (scrollY, vh) {
          self.render(el, scrollY, vh, speed, axis, scaleOn, baseScale, fadeOn);
        });
      });
    },

    render: function (el, scrollY, vh, speed, axis, scaleOn, baseScale, fadeOn) {
      var rect = el.getBoundingClientRect();
      // 元素中心相对视口中心的归一化偏移：-1（下方）→ 1（上方）
      var centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;

      var shift = -centerOffset * speed * 100;
      // 限制最大位移，防止极端比例下元素飞出容器
      shift = clamp(shift, -200, 200);

      var sc = 1;
      if (scaleOn) {
        // 越靠近视口中心越接近原始尺寸，边缘略微放大
        sc = baseScale - Math.abs(centerOffset) * 0.04;
      }

      if (axis === 'x') {
        setT(el, shift, 0, scaleOn ? sc : null);
      } else {
        setT(el, 0, shift, scaleOn ? sc : null);
      }

      // fade 模式：元素向下位移的同时淡出，制造"沉入"感
      if (fadeOn) {
        var p = clamp((scrollY - vh * 0.25) / (vh * 0.5), 0, 1);
        el.style.opacity = r2(1 - Ease.outCubic(p));
      }
    }
  };

  /* =========================================================
     06. Reveal —— 区块错峰入场
     ---------------------------------------------------------
     用 IntersectionObserver 触发，不占用滚动帧。
     同一容器内的 [data-reveal] 子项按索引递增延迟，形成错峰。
     支持 data-reveal="up|down|left|right|zoom|mask|blur"
     ========================================================= */

  var Reveal = {
    STAGGER: 55,   // 每项之间的延迟（毫秒）
    STAGGER_MAX: 260,  // 错峰延迟上限，避免长列表尾部等待过久
    DELAY_ATTR: 'revealDelay',   // 支持 data-reveal-delay="180" 单独指定

    init: function () {
      var items = $$('[data-reveal]');
      if (!items.length) return;

      // 不支持 IO 时全部直接显示，保证内容可读
      if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-revealed'); });
        return;
      }

      // 预计算每项的错峰延迟：找到最近的带 data-reveal-group 的祖先
      items.forEach(function (el) {
        // 显式指定优先：data-reveal-delay="120"
        var explicit = parseInt(el.getAttribute('data-reveal-delay'), 10);
        if (!isNaN(explicit)) {
          el.style.setProperty('--reveal-delay', explicit + 'ms');
          return;
        }

        var group = el.closest('[data-reveal-group]');
        var delay = 0;
        if (group) {
          var siblings = $$('[data-reveal]', group);
          var idx = siblings.indexOf(el);
          if (idx > 0) delay = Math.min(idx * this.STAGGER, this.STAGGER_MAX);
        }
        el.style.setProperty('--reveal-delay', delay + 'ms');
      }, this);

      /*
       * 遮罩类元素（clip-path: inset(0 0 100%)）的可见矩形高度为 0，
       * 用 threshold 永远无法触发。这类元素改用 threshold: 0，
       * 只要元素边界进入视口就算命中。
       */
      var maskItems = items.filter(function (el) {
        return el.getAttribute('data-reveal') === 'mask';
      });
      var normalItems = items.filter(function (el) {
        return el.getAttribute('data-reveal') !== 'mask';
      });

      var markRevealed = function (el) {
        el.classList.add('is-revealed');
      };

      // 普通元素：需露出 10% 才触发，避免刚露头就播完动画
      if (normalItems.length) {
        var ioNormal = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            markRevealed(entry.target);
            ioNormal.unobserve(entry.target);
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -8% 0px'
        });
        normalItems.forEach(function (el) { ioNormal.observe(el); });
      }

      // 遮罩元素：threshold 0，且不加负 rootMargin（用正向内缩保证已进入视口）
      if (maskItems.length) {
        var ioMask = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            markRevealed(entry.target);
            ioMask.unobserve(entry.target);
          });
        }, {
          threshold: 0,
          rootMargin: '0px 0px -5% 0px'
        });
        maskItems.forEach(function (el) { ioMask.observe(el); });
      }
    }
  };

  /* =========================================================
     07. Counter —— 数字滚动计数
     ---------------------------------------------------------
     元素进入视口后，数值从 from 缓动到 to（默认从 0）。
     ========================================================= */

  var Counter = {
    DURATION: 1600,

    init: function () {
      var items = $$('[data-count]');
      if (!items.length) return;

      if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) {
          el.textContent = el.getAttribute('data-count');
        });
        return;
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Counter.run(entry.target);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.4 });

      items.forEach(function (el) { io.observe(el); });
    },

    run: function (el) {
      var to = parseFloat(el.getAttribute('data-count')) || 0;
      var from = parseFloat(el.getAttribute('data-count-from')) || 0;
      var dur = parseFloat(el.getAttribute('data-count-duration')) || this.DURATION;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = clamp((ts - start) / dur, 0, 1);
        var eased = Ease.outQuart(p);
        var val = Math.round(from + (to - from) * eased);
        el.textContent = val.toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }
  };

  /* =========================================================
     08. Rail —— 横向轨道（独立滚动，不绑定纵向滚动）
     ---------------------------------------------------------
     横向轨道只响应用户自己的横滑 / 滚轮横推 / 拖拽，
     与页面纵向滚动完全解耦——上下滚动页面时轨道保持不动。
     另附：轨道边缘时自动切换方向键提示、滚轮横推支持。
     ========================================================= */

  var Rail = {
    init: function () {
      var self = this;

      $$('[data-rail]').forEach(function (el) {
        // 1) 滚轮：垂直滚轮在轨道上且还有横向余量时，转成横向推进
        el.addEventListener('wheel', function (e) {
          var maxShift = el.scrollWidth - el.clientWidth;
          if (maxShift <= 0) return;

          // 优先取横轴滚轮（触控板双指横滑）
          var dx = e.deltaX;
          var dy = e.deltaY;

          if (Math.abs(dx) > Math.abs(dy)) {
            // 已经是横轴，交给浏览器原生处理
            return;
          }

          var atStart = el.scrollLeft <= 0;
          var atEnd = el.scrollLeft >= maxShift - 1;

          // 到头了就放行，让页面正常纵向滚动，不"吃掉"滚轮
          if ((atStart && dy < 0) || (atEnd && dy > 0)) return;

          e.preventDefault();
          el.scrollLeft += dy;
        }, { passive: false });

        // 2) 拖拽：桌面端按住鼠标横拖
        var dragging = false, startX = 0, startScroll = 0, moved = false;

        el.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'touch') return;   // 触摸交给原生滚动
          dragging = true; moved = false;
          startX = e.clientX;
          startScroll = el.scrollLeft;
          el.classList.add('is-dragging');
        });

        el.addEventListener('pointermove', function (e) {
          if (!dragging) return;
          var dx = e.clientX - startX;
          if (Math.abs(dx) > 3) moved = true;
          el.scrollLeft = startScroll - dx;
        });

        var endDrag = function () {
          if (!dragging) return;
          dragging = false;
          el.classList.remove('is-dragging');
        };
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);
        el.addEventListener('pointerleave', endDrag);

        // 3) 拖拽后抑制误触发的点击
        el.addEventListener('click', function (e) {
          if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
        }, true);

        // 4) 方向键左右推进
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', function (e) {
          var step = 322;   // 卡片宽 300 + gap 22
          if (e.key === 'ArrowRight') { el.scrollLeft += step; e.preventDefault(); }
          if (e.key === 'ArrowLeft')  { el.scrollLeft -= step; e.preventDefault(); }
        });

        // 5) 首尾状态类：用于渐隐遮罩 / 提示箭头显隐
        //    注意：由于 padding + scroll-snap 的存在，scrollLeft 的真正最小值
        //    未必是 0（首卡会吸附到 padding 边缘，实测 min≈57）。
        //    浏览器会把负的 scrollLeft 直接钳制掉，所以不能靠 set 负值探测，
        //    改为从计算样式的 padding-left 推导。
        var minLeft = 0;
        var measureEdges = function () {
          var cs = window.getComputedStyle(el);
          minLeft = Math.max(0, parseFloat(cs.paddingLeft) || 0);
        };

        var syncEdges = function () {
          var maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
          var left = el.scrollLeft;
          var tol = Math.max(6, minLeft * 0.15);

          el.classList.toggle('at-start', left <= minLeft + tol);
          el.classList.toggle('at-end', left >= maxLeft - tol);
          el.classList.toggle('is-scrollable', maxLeft - minLeft > 8);
        };

        measureEdges();
        syncEdges();
        el.addEventListener('scroll', syncEdges, { passive: true });
        window.addEventListener('resize', function () {
          measureEdges();
          syncEdges();
        }, { passive: true });
        window.addEventListener('load', function () {
          measureEdges();
          syncEdges();
        });
      });
    }
  };

  /* =========================================================
     09. ProgressRail —— 右侧章节进度指示器
     ---------------------------------------------------------
     收集所有带 data-section 的区块，生成右侧圆点导航。
     滚动时高亮当前区块，点击可跳转。
     ========================================================= */

  var ProgressRail = {
    sections: [],
    dots: [],
    lastIndex: -1,

    init: function () {
      var els = $$('[data-section]');
      if (els.length < 2) return;

      var nav = document.createElement('nav');
      nav.className = 'progress-rail';
      nav.setAttribute('aria-label', '页面章节导航');

      var self = this;
      els.forEach(function (sec, i) {
        self.sections.push(sec);

        var btn = document.createElement('button');
        btn.className = 'progress-dot';
        btn.type = 'button';
        btn.setAttribute('aria-label', sec.getAttribute('data-section') || ('第 ' + (i + 1) + ' 节'));

        var label = document.createElement('span');
        label.className = 'progress-label';
        label.textContent = sec.getAttribute('data-section') || '';
        btn.appendChild(label);

        btn.addEventListener('click', function () {
          var navH = 74;
          var top = sec.getBoundingClientRect().top + window.scrollY - navH + 1;
          window.scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
        });

        nav.appendChild(btn);
        self.dots.push(btn);
      });

      document.body.appendChild(nav);
      this.el = nav;

      ScrollBus.add(document.body, function (scrollY, vh) {
        self.update(scrollY, vh);
      });
      this.update(window.scrollY, window.innerHeight);
    },

    update: function (scrollY, vh) {
      // 取最后一个已越过视口 40% 处的区块作为"当前区块"
      var mark = scrollY + vh * 0.4;
      var current = 0;
      for (var i = 0; i < this.sections.length; i++) {
        if (this.sections[i].offsetTop <= mark) current = i;
      }

      if (current === this.lastIndex) return;
      this.lastIndex = current;

      this.dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }
  };

  /* =========================================================
     10. Header —— 顶栏滚动状态机
     ---------------------------------------------------------
     三种状态：
       hero      —— 在首屏内，导航透明浮在图上
       compact   —— 离开首屏，导航收缩 + 背景转实
       hidden    —— 向下快速滚动时隐藏，向上滚立即召回

     方向判定说明：
       update() 由 ScrollBus 驱动，而 ScrollBus 只在「滚动发生」
       时执行，因此两次 update 之间的 scrollY 差值就代表滚动方向。
       必须先算出方向，再更新 lastY。
     ========================================================= */

  var Header = {
    lastY: null,
    state: '',
    HIDE_AFTER: 420,     // 超过这个滚动距离才允许隐藏
    DELTA: 4,            // 判定方向的最小位移，过滤抖动
    TOP_ZONE: 0.72,      // 首屏判定阈值（× 视口高）

    init: function () {
      this.el = $('.topbar');
      if (!this.el) return;

      var self = this;
      ScrollBus.add(this.el, function (scrollY, vh) {
        self.update(scrollY, vh);
      });
    },

    update: function (scrollY, vh) {
      // 首帧：只记录位置，不做状态切换判定
      if (this.lastY === null) {
        this.lastY = scrollY;
        this.apply(scrollY < vh * this.TOP_ZONE ? 'hero' : 'compact');
        return;
      }

      var delta = scrollY - this.lastY;
      var next;

      if (scrollY < vh * this.TOP_ZONE) {
        // 还在首屏内 —— 始终透明浮层
        next = 'hero';
      } else if (delta > this.DELTA && scrollY > this.HIDE_AFTER) {
        // 向下滚且已离开顶部区域 —— 收起导航
        next = 'hidden';
      } else if (delta < -this.DELTA) {
        // 向上滚 —— 立即召回
        next = 'compact';
      } else {
        // 无明显方向变化：保持上一个状态，避免抖动
        next = this.state || 'compact';
      }

      this.apply(next);
      this.lastY = scrollY;
    },

    /** 仅在状态真正变化时才操作 DOM */
    apply: function (state) {
      if (state === this.state) return;
      this.el.classList.remove('is-hero', 'is-compact', 'is-hidden');
      this.el.classList.add('is-' + state);
      this.state = state;
    }
  };

  /* =========================================================
     11. Magnetic —— 磁性按钮
     ---------------------------------------------------------
     鼠标在按钮附近时，按钮朝光标方向轻微位移；离开后回弹。
     仅桌面端启用。
     ========================================================= */

  var Magnetic = {
    STRENGTH: 0.28,
    MAX: 14,

    init: function () {
      if (TOUCH || isNarrow()) return;

      $$('[data-magnetic]').forEach(function (el) {
        var cx = 0, cy = 0;      // 当前位移
        var tx = 0, ty = 0;      // 目标位移
        var raf = null;
        var running = false;

        function loop() {
          // 阻尼插值：每帧向目标靠拢 18%，形成轻柔跟随
          cx += (tx - cx) * 0.18;
          cy += (ty - cy) * 0.18;
          setT(el, cx, cy, null);

          if (Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1) {
            setT(el, tx, ty, null);
            running = false;
            return;
          }
          raf = requestAnimationFrame(loop);
        }

        function start() {
          if (running) return;
          running = true;
          raf = requestAnimationFrame(loop);
        }

        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var dx = e.clientX - (rect.left + rect.width / 2);
          var dy = e.clientY - (rect.top + rect.height / 2);
          tx = clamp(dx * Magnetic.STRENGTH, -Magnetic.MAX, Magnetic.MAX);
          ty = clamp(dy * Magnetic.STRENGTH, -Magnetic.MAX, Magnetic.MAX);
          start();
        });

        el.addEventListener('mouseleave', function () {
          tx = 0; ty = 0;
          start();
        });
      });
    }
  };

  /* =========================================================
     12. SplitText —— 标题逐字浮现
     ---------------------------------------------------------
     把带 data-split 的元素文本拆成单个字符，
     进入视口后按 26ms 间隔依次上浮显现。
     ========================================================= */

  var SplitText = {
    STEP: 26,

    init: function () {
      var items = $$('[data-split]');
      if (!items.length) return;

      // 逐字动画在减弱动效 / 窄屏下反而拖慢阅读节奏，直接跳过
      if (REDUCED || isNarrow()) return;

      items.forEach(function (el) {
        var text = el.textContent;
        el.textContent = '';
        el.setAttribute('aria-label', text);

        var frag = document.createDocumentFragment();
        var chars = [];

        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === ' ') {
            // 空格用普通文本节点，避免被 flex 布局吃掉
            frag.appendChild(document.createTextNode(' '));
            continue;
          }
          var span = document.createElement('span');
          span.className = 'split-char';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = ch;
          span.style.transitionDelay = (chars.length * SplitText.STEP) + 'ms';
          frag.appendChild(span);
          chars.push(span);
        }

        el.appendChild(frag);

        if (!('IntersectionObserver' in window)) {
          chars.forEach(function (c) { c.classList.add('is-in'); });
          return;
        }

        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            chars.forEach(function (c) { c.classList.add('is-in'); });
            io.unobserve(entry.target);
          });
        }, { threshold: 0.3 });

        io.observe(el);
      });
    }
  };

  /* =========================================================
     13. CursorSpot —— 卡片光斑跟随
     ---------------------------------------------------------
     在卡片上移动鼠标时，一个柔和光斑跟随光标位置，
     用 CSS 变量传给伪元素渲染。仅桌面端。
     ========================================================= */

  var CursorSpot = {
    init: function () {
      if (TOUCH || isNarrow()) return;

      $$('[data-spot]').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var x = ((e.clientX - rect.left) / rect.width) * 100;
          var y = ((e.clientY - rect.top) / rect.height) * 100;
          el.style.setProperty('--spot-x', x + '%');
          el.style.setProperty('--spot-y', y + '%');
          el.style.setProperty('--spot-o', '1');
        }, { passive: true });

        el.addEventListener('mouseleave', function () {
          el.style.setProperty('--spot-o', '0');
        });
      });
    }
  };

  /* =========================================================
     14. HeroCue —— 首屏滚动提示
     ---------------------------------------------------------
     滚动离开首屏时隐藏提示箭头，并在 hero 上挂 is-leaving，
     触发底部渐隐过渡。
     ========================================================= */

  var HeroCue = {
    init: function () {
      var hero = $('.hero');
      var cue = $('.scroll-cue');
      if (!hero) return;

      var last = null;

      ScrollBus.add(hero, function (scrollY, vh) {
        var leaving = scrollY > vh * 0.18;
        if (leaving === last) return;
        last = leaving;

        hero.classList.toggle('is-leaving', leaving);
        if (cue) cue.classList.toggle('is-hidden', leaving);
      });
    }
  };

  /* =========================================================
     15. FooterTheme —— 页脚区域反色
     ---------------------------------------------------------
     进入深绿色页脚时给进度指示器换浅色，避免看不见。
     ========================================================= */

  var FooterTheme = {
    init: function () {
      var footer = $('.footer');
      var rail = $('.progress-rail');
      if (!footer || !rail) return;

      if (!('IntersectionObserver' in window)) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          rail.classList.toggle('is-dark', entry.isIntersecting);
        });
      }, { threshold: 0.05 });

      io.observe(footer);
    }
  };

  /* =========================================================
     15.5 ReadProgress —— 顶部阅读进度细线
     ---------------------------------------------------------
     直接用 transform:scaleX 推进，不触发重排；滚到底为 1。
     ========================================================= */

  var ReadProgress = {
    init: function () {
      var bar = $('.read-progress i');
      if (!bar) return;

      var last = -1;
      var update = function (scrollY, vh) {
        var doc = document.documentElement;
        var max = (doc.scrollHeight || 0) - (vh || window.innerHeight);
        var p = max > 0 ? Math.min(1, Math.max(0, (scrollY || 0) / max)) : 0;
        // 只在变化超过 0.2% 时才写 DOM
        if (Math.abs(p - last) < 0.002) return;
        last = p;
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      };

      ScrollBus.add(bar, update);
    }
  };

  /* =========================================================
     16. 初始化与全局 API
     ========================================================= */

  function init() {
    // 减弱动效模式下，直接给所有揭示元素落地态，不启动任何滚动引擎
    if (REDUCED) {
      $$('[data-reveal]').forEach(function (el) {
        el.classList.add('is-revealed');
      });
      $$('[data-count]').forEach(function (el) {
        el.textContent = el.getAttribute('data-count');
      });
      $$('[data-split] .split-char').forEach(function (c) {
        c.classList.add('is-in');
      });
      document.documentElement.classList.add('motion-off');
      return;
    }

    ScrollBus.init();
    Parallax.init();
    Reveal.init();
    Counter.init();
    Rail.init();
    ProgressRail.init();
    Header.init();
    Magnetic.init();
    SplitText.init();
    CursorSpot.init();
    HeroCue.init();
    FooterTheme.init();
    ReadProgress.init();

    document.documentElement.classList.add('motion-on');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露给控制台调试 / 外部调用
  window.YosemiteMotion = {
    bus: ScrollBus,
    ease: Ease,
    reduced: REDUCED,
    refresh: function () { ScrollBus.schedule(); }
  };
})();
