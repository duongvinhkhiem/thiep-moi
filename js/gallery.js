/* gallery.js — Album ảnh bất đối xứng + lightbox (Esc, mũi tên, vuốt). Ảnh lấy từ GRAD_CONFIG.gallery. */
(function () {
  'use strict';

  var items = [], current = 0, lastFocus = null;
  var els = {};
  var touchX = null;

  var ICON = '<svg class="i i-lg" aria-hidden="true"><use href="#i-image"/></svg>';

  /** Tạo khung placeholder (khi chưa có ảnh hoặc ảnh lỗi). */
  function placeholder(item) {
    var d = document.createElement('div');
    d.className = 'ph';
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', item.alt || item.label || 'Khung ảnh');
    d.innerHTML = ICON + '<span></span><small>Thêm ảnh trong <code>js/config.js</code></small>';
    d.querySelector('span').textContent = item.label || 'Ảnh';
    return d;
  }

  function buildMedia(item, lazy) {
    if (!item.src) return placeholder(item);
    var img = new Image();
    img.alt = item.alt || '';
    if (lazy) { img.loading = 'lazy'; img.decoding = 'async'; }
    img.src = item.src;
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.replaceChild(placeholder(item), img);
    });
    return img;
  }

  function render() {
    els.grid.textContent = '';
    items.forEach(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-item';
      b.setAttribute('aria-label', 'Xem ảnh lớn: ' + (item.caption || item.label || 'Ảnh ' + (i + 1)));
      b.appendChild(buildMedia(item, true));
      if (item.caption) {
        var c = document.createElement('span');
        c.className = 'g-cap';
        c.textContent = item.caption;
        b.appendChild(c);
      }
      b.addEventListener('click', function () { open(i); });
      els.grid.appendChild(b);
    });
  }

  function show(i, animate) {
    current = (i + items.length) % items.length;
    var item = items[current];
    els.stage.textContent = '';
    els.stage.appendChild(buildMedia(item, false));
    els.cap.textContent = (item.caption || item.label || '') + '  ·  ' + (current + 1) + '/' + items.length;
    var multi = items.length > 1;
    els.prev.hidden = !multi; els.next.hidden = !multi;
  }

  function open(i) {
    lastFocus = document.activeElement;
    els.box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    show(i);
    els.close.focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    els.box.hidden = true;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowLeft') { show(current - 1); }
    else if (e.key === 'ArrowRight') { show(current + 1); }
    else if (e.key === 'Tab') {            // giữ focus trong lightbox
      var f = els.box.querySelectorAll('button:not([hidden])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  var Gallery = {};

  Gallery.init = function (cfg) {
    els = {
      grid: document.getElementById('galleryGrid'),
      box: document.getElementById('lightbox'),
      stage: document.getElementById('lbStage'),
      cap: document.getElementById('lbCap'),
      close: document.getElementById('lbClose'),
      prev: document.getElementById('lbPrev'),
      next: document.getElementById('lbNext')
    };
    if (!els.grid || !els.box) return;
    items = (cfg.gallery || []).slice();
    if (!items.length) { els.grid.closest('section').hidden = true; return; }

    render();
    els.close.addEventListener('click', close);
    els.prev.addEventListener('click', function () { show(current - 1); });
    els.next.addEventListener('click', function () { show(current + 1); });
    els.box.addEventListener('click', function (e) {
      if (e.target === els.box || e.target.classList.contains('lb-fig') || e.target === els.stage) close();
    });
    els.box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    els.box.addEventListener('touchend', function (e) {
      if (touchX == null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  };

  window.GradGallery = Gallery;
})();
