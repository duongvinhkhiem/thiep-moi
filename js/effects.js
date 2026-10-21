/* effects.js — Hiệu ứng giao diện nhẹ: reveal khi cuộn, tilt 3D, confetti, toast */
(function () {
  'use strict';

  var Effects = {};
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  Effects.reduced = function () { return mqReduce.matches; };

  /* ---------- Hiệu ứng xuất hiện khi cuộn ---------- */
  Effects.initReveal = function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || Effects.reduced()) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- Hover 3D cho thẻ (chỉ máy có chuột) ---------- */
  Effects.initTilt = function () {
    if (Effects.reduced() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('.tilt').forEach(function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--rx', (-py * 9).toFixed(2) + 'deg');
          el.style.setProperty('--ry', (px * 11).toFixed(2) + 'deg');
          el.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
          el.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  };

  /* ---------- Confetti (canvas 2D, tự dừng sau vài giây) ---------- */
  var cfRaf = 0;
  Effects.confetti = function (originX, originY) {
    var cfg = window.GRAD_CONFIG || {};
    if (cfg.effects && cfg.effects.confetti === false) return;
    if (Effects.reduced()) return;
    var canvas = document.getElementById('confetti');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(cfRaf);
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    var small = w < 720;
    var count = small ? 70 : 130;
    var colors = ['#22d3ee', '#3b82f6', '#8b5cf6', '#e6ecff', '#a5f3fc'];
    var ox = originX == null ? w / 2 : originX;
    var oy = originY == null ? h * 0.62 : originY;
    var parts = [];
    for (var i = 0; i < count; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
      var v = (small ? 7 : 11) + Math.random() * (small ? 6 : 9);
      parts.push({
        x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: 5 + Math.random() * 6, h: 3 + Math.random() * 5,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        c: colors[(Math.random() * colors.length) | 0], life: 0
      });
    }
    var start = performance.now();
    (function step(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.vy += 0.28; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
        if (p.y < h + 20 && elapsed < 3800) {
          alive++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - elapsed / 3800);
          ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      if (alive > 0) { cfRaf = requestAnimationFrame(step); }
      else { ctx.clearRect(0, 0, w, h); }
    })(start);
  };

  /* ---------- Toast ---------- */
  var toastTimer = 0;
  Effects.toast = function (msg, ms) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 3200);
  };

  window.GradEffects = Effects;
})();
