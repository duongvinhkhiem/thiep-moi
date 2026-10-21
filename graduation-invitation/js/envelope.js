/* envelope.js — Hiệu ứng mở phong bì 3D.
 * Chuỗi: nắp mở → thiệp trượt ra → ánh sáng + confetti → chuyển vào nội dung (~3 giây).
 * Không tự chạy: chỉ bắt đầu khi người dùng bấm. Có nút "Bỏ qua hiệu ứng".
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro, envelope, openBtn, skipBtn, main, topbar;
  var started = false, finished = false, timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    intro.hidden = true;
    root.classList.remove('intro-lock');
    root.classList.add('opened');
    main.inert = false; main.removeAttribute('aria-hidden');
    if (topbar) { topbar.inert = false; }
    window.scrollTo(0, 0);
    var h = document.getElementById('heroTitle');
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    document.dispatchEvent(new CustomEvent('grad:opened'));
  }

  function open() {
    if (started || finished) return;
    started = true;
    var reduce = window.GradEffects && window.GradEffects.reduced();

    if (reduce) { finish(); return; }

    intro.classList.add('opening');
    openBtn.disabled = true;
    if (window.GradScene) window.GradScene.warp();

    var r = envelope.getBoundingClientRect();
    later(function () {
      if (window.GradEffects) window.GradEffects.confetti(r.left + r.width / 2, r.top + r.height * 0.3);
    }, 1500);
    later(function () { intro.classList.add('leaving'); }, 2300);
    later(finish, 3050);
  }

  var Envelope = {};

  Envelope.init = function () {
    intro = document.getElementById('intro');
    envelope = document.getElementById('envelope');
    openBtn = document.getElementById('openBtn');
    skipBtn = document.getElementById('skipBtn');
    main = document.getElementById('main');
    topbar = document.getElementById('topbar');
    if (!intro || !main) return;

    // Có #neo trên URL (hoặc không bật intro-lock) → vào thẳng nội dung
    if (!root.classList.contains('intro-lock')) {
      intro.hidden = true; finished = true;
      root.classList.add('opened');
      return;
    }

    // Khoá nội dung phía sau trong lúc màn mở thiệp hiển thị
    main.inert = true; main.setAttribute('aria-hidden', 'true');
    if (topbar) topbar.inert = true;

    openBtn.addEventListener('click', open);
    envelope.addEventListener('click', open);
    skipBtn.addEventListener('click', function () { started = true; finish(); });
    openBtn.focus({ preventScroll: true });
  };

  window.GradEnvelope = Envelope;
})();
