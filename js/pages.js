/* =========================================================
   优胜美地国家公园 · 内页脚本
   pages.js
   ---------------------------------------------------------
   只在各内页加载。职责：
   01. 侧边目录滚动高亮（scroll-spy）
   02. 目录点击平滑滚动（扣除固定导航高度）
   03. 内页顶栏始终为实色（滚过页头后加深）
   04. 图库点击放大（简易 lightbox）
   05. 无 IntersectionObserver 时的动效降级
   ========================================================= */

(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* 尊重系统的"减弱动效"设置 */
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) document.documentElement.classList.add('motion-off');

  /* 固定导航高度（从 CSS 变量读取，取不到时兜底 74） */
  function navH() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    var n = parseFloat(v);
    return isNaN(n) ? 74 : n;
  }

  /* =========================================================
     01 + 02. 侧边目录：滚动高亮 + 点击跳转
     ========================================================= */

  var Toc = {
    init: function () {
      var toc = $('.doc-toc');
      var main = $('.doc-main');
      if (!toc || !main) return;

      var links = $$('a[href^="#"]', toc);
      if (!links.length) return;

      /* 把链接按目标区块配对 */
      var pairs = [];
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        var sec = document.getElementById(id);
        if (sec) pairs.push({ link: a, sec: sec });
      });
      if (!pairs.length) return;

      /* ---- 点击：平滑滚动，扣除导航高度 ---- */
      pairs.forEach(function (p) {
        p.link.addEventListener('click', function (e) {
          e.preventDefault();
          var y = p.sec.getBoundingClientRect().top + window.pageYOffset - navH() - 20;
          window.scrollTo({ top: Math.max(0, y), behavior: REDUCED ? 'auto' : 'smooth' });
          /* 更新地址栏但不打断滚动 */
          if (history.replaceState) history.replaceState(null, '', '#' + p.sec.id);
          this.blur();
        });
      });

      /* ---- 滚动高亮：取当前视口内最靠上的区块 ---- */
      var active = null;
      var ticking = false;

      function update() {
        ticking = false;
        var line = navH() + 120;      // 判定基准线
        var current = pairs[0];

        for (var i = 0; i < pairs.length; i++) {
          var top = pairs[i].sec.getBoundingClientRect().top;
          if (top - line <= 0) current = pairs[i];
          else break;
        }

        /* 滚到页面底部时，强制高亮最后一项 */
        if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 80) {
          current = pairs[pairs.length - 1];
        }

        if (active === current) return;
        if (active) active.link.classList.remove('is-active');
        current.link.classList.add('is-active');
        active = current;
      }

      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
  };

  /* =========================================================
     03. 内页顶栏
     ---------------------------------------------------------
     页头是深色横幅，所以顶栏一开始就保持实色；
     滚过页头之后再叠加阴影，和首页 `.scrolled` 表现一致。
     ========================================================= */

  var Header = {
    init: function () {
      var bar = $('.topbar');
      var hero = $('.page-hero');
      if (!bar) return;

      function update() {
        var past = hero ? window.pageYOffset > hero.offsetHeight * 0.35 : true;
        bar.classList.toggle('scrolled', past);
      }

      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  };

  /* =========================================================
     04. 图库放大
     ========================================================= */

  var Lightbox = {
    init: function () {
      var items = $$('.gallery figure img');
      if (!items.length) return;

      var box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', '图片预览');
      box.innerHTML =
        '<button class="lb-close" aria-label="关闭预览">&times;</button>' +
        '<img alt="">' +
        '<p class="lb-cap"></p>';
      document.body.appendChild(box);

      var img = $('img', box);
      var cap = $('.lb-cap', box);
      var lastFocus = null;

      function open(src, text, alt) {
        lastFocus = document.activeElement;
        img.src = src;
        img.alt = alt || '';
        cap.textContent = text || '';
        box.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        $('.lb-close', box).focus();
      }

      function close() {
        box.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      items.forEach(function (im) {
        /* 让图片可聚焦，支持键盘操作 */
        im.parentNode.setAttribute('tabindex', '0');
        im.parentNode.setAttribute('role', 'button');

        im.parentNode.addEventListener('click', function () {
          var fc = $('figcaption', this);
          open(im.getAttribute('src'), fc ? fc.textContent.trim() : '', im.alt);
        });

        im.parentNode.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var fc = $('figcaption', this);
            open(im.getAttribute('src'), fc ? fc.textContent.trim() : '', im.alt);
          }
        });
      });

      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.classList.contains('lb-close')) close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && box.classList.contains('is-open')) close();
      });
    }
  };

  /* =========================================================
     05. 动效降级
     ---------------------------------------------------------
     motion.js 未加载或系统要求减弱动效时，
     直接把所有待揭示元素置为可见，保证内容一定可读。
     ========================================================= */

  var Fallback = {
    init: function () {
      if (window.YosemiteMotion && !REDUCED) return;
      $$('[data-reveal]').forEach(function (el) { el.classList.add('is-revealed'); });
      $$('[data-count]').forEach(function (el) {
        el.textContent = el.getAttribute('data-count');
      });
    }
  };

  /* =========================================================
     启动
     ========================================================= */

  function boot() {
    try { Toc.init(); }      catch (e) { /* 目录失败不影响阅读 */ }
    try { Header.init(); }   catch (e) { /* 同上 */ }
    try { Lightbox.init(); } catch (e) { /* 同上 */ }
    try { Fallback.init(); } catch (e) { /* 同上 */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* 暴露给控制台调试 */
  window.YosemitePages = { Toc: Toc, Header: Header, Lightbox: Lightbox };

})();
