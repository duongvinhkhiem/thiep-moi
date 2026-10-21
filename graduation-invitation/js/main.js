/* main.js — Điểm khởi động: đọc cấu hình, gắn dữ liệu vào trang, khởi tạo các module. */
(function () {
  'use strict';

  var cfg = window.GRAD_CONFIG;
  if (!cfg) {
    if (window.console) console.error('Thiếu js/config.js');
    // Không có cấu hình → bỏ màn mở thiệp để nội dung tĩnh trong HTML vẫn đọc được
    document.documentElement.classList.remove('intro-lock');
    var i0 = document.getElementById('intro'); if (i0) i0.hidden = true;
    document.documentElement.classList.add('opened');
    return;
  }

  var DOW = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function p2(n) { return n < 10 ? '0' + n : String(n); }

  /* ---------- Dữ liệu hiển thị, suy ra từ cấu hình (một nguồn duy nhất) ---------- */
  function buildView() {
    var ev = cfg.event;
    var startMs = Date.parse(ev.startISO);
    var off = (ev.utcOffsetMinutes || 420) * 60000;
    var loc = new Date(startMs + off);                 // đọc bằng getUTC* = giờ Việt Nam
    var dd = p2(loc.getUTCDate()), mm = p2(loc.getUTCMonth() + 1), yy = loc.getUTCFullYear();
    var hh = p2(loc.getUTCHours()), mi = p2(loc.getUTCMinutes());
    var hour = loc.getUTCHours();
    var part = hour < 11 ? 'sáng' : hour < 13 ? 'trưa' : hour < 18 ? 'chiều' : 'tối';

    var initials = cfg.person.name
      .replace(/Đ/g, 'D').replace(/đ/g, 'd')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/\s+/).filter(Boolean).map(function (w) { return w[0].toUpperCase(); }).join('');

    return {
      name: cfg.person.name,
      nameUpper: cfg.person.name.toLocaleUpperCase('vi-VN'),
      initials: initials,
      school: cfg.school.name,
      schoolShort: cfg.school.short,
      major: cfg.school.major,
      year: String(yy),
      dateDots: dd + '.' + mm + '.' + yy,
      dateLong: DOW[loc.getUTCDay()] + ', ngày ' + dd + ' tháng ' + mm + ' năm ' + yy + '.',
      timeShort: hh + ':' + mi,
      timeLong: hh + ':' + mi + ' ' + part + '.',
      venue: ev.venue + '.',
      campus: ev.campus + '.',
      _startMs: startMs, _off: off
    };
  }

  function bind(view) {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var k = el.getAttribute('data-bind');
      if (view[k] != null) el.textContent = view[k];
    });
    document.title = 'Thiệp mời tốt nghiệp — ' + view.name;
  }

  /* ---------- Liên kết Google Maps / Google Calendar ---------- */
  function fmtLocal(ms, off) {
    return new Date(ms + off).toISOString().replace(/[-:]/g, '').slice(0, 15);   // YYYYMMDDTHHMMSS
  }

  function setupLinks(view) {
    var ev = cfg.event;
    var maps = document.getElementById('mapsBtn');
    if (maps) {
      maps.href = ev.mapsUrl && ev.mapsUrl.trim()
        ? ev.mapsUrl.trim()
        : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.mapsQuery);
    }
    var cal = document.getElementById('calBtn');
    if (cal && !isNaN(view._startMs)) {
      var end = view._startMs + (ev.calendarDurationMinutes || 60) * 60000;
      var q = [
        'action=TEMPLATE',
        'text=' + encodeURIComponent('Lễ tốt nghiệp của ' + view.name),
        'dates=' + fmtLocal(view._startMs, view._off) + '/' + fmtLocal(end, view._off),
        'ctz=' + encodeURIComponent(ev.timezoneLabel || 'Asia/Ho_Chi_Minh'),
        'location=' + encodeURIComponent(ev.venue + ', ' + ev.campus),
        'details=' + encodeURIComponent(view.name + ' trân trọng mời bạn đến chung vui lễ tốt nghiệp — ' + view.school + '.')
      ].join('&');
      cal.href = 'https://calendar.google.com/calendar/render?' + q;
    }
  }

  /* ---------- Ảnh chân dung ---------- */
  function setupPortrait() {
    var img = document.getElementById('portraitImg');
    var ph = document.getElementById('portraitPh');
    var src = cfg.person.portrait;
    if (!img || !ph || !src) return;
    img.alt = cfg.person.portraitAlt || '';
    img.addEventListener('load', function () { img.hidden = false; ph.hidden = true; });
    img.addEventListener('error', function () { img.hidden = true; ph.hidden = false; });
    img.src = src;
  }

  /* ---------- Nhạc nền (tùy chọn, không tự phát) ---------- */
  function setupMusic() {
    var btn = document.getElementById('musicBtn');
    var m = cfg.music;
    if (!btn || !m || !m.enabled) return;
    btn.hidden = false;
    var audio = null, failed = false;
    btn.addEventListener('click', function () {
      if (failed) { window.GradEffects.toast('Chưa có file nhạc nền hợp lệ.'); return; }
      if (!audio) {
        audio = new Audio(m.src);
        audio.loop = true;
        audio.volume = m.volume == null ? 0.35 : m.volume;
        audio.addEventListener('error', function () {
          failed = true; btn.setAttribute('aria-pressed', 'false');
          window.GradEffects.toast('Không tải được file nhạc nền.');
        });
      }
      if (audio.paused) {
        audio.play().then(function () {
          btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Tắt nhạc nền');
        }).catch(function () {
          btn.setAttribute('aria-pressed', 'false');
          window.GradEffects.toast('Trình duyệt chưa cho phép phát nhạc.');
        });
      } else {
        audio.pause();
        btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Bật nhạc nền');
      }
    });
  }

  /* ---------- Nút cuối trang ---------- */
  function setupButtons() {
    var top = document.getElementById('topBtn');
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.GradEffects.reduced() ? 'auto' : 'smooth' });
    });
    var cf = document.getElementById('confettiBtn');
    if (cf) cf.addEventListener('click', function (e) {
      var r = cf.getBoundingClientRect();
      window.GradEffects.confetti(r.left + r.width / 2, r.top);
    });
  }

  /* ---------- Khởi động ---------- */
  function start() {
    var view = buildView();
    window.GradView = view;
    bind(view);
    setupLinks(view);
    setupPortrait();

    var E = window.GradEffects;
    E.initReveal();
    E.initTilt();
    if (window.GradScene) window.GradScene.init(cfg);
    if (window.GradCountdown) window.GradCountdown.init(cfg);
    if (window.GradGallery) window.GradGallery.init(cfg);
    if (window.GradRSVP) window.GradRSVP.init(cfg);
    setupMusic();
    setupButtons();
    if (window.GradEnvelope) window.GradEnvelope.init();
  }

  try { start(); }
  catch (err) {
    // Lỗi bất ngờ: không để người xem kẹt ở màn mở thiệp
    if (window.console) console.error(err);
    document.documentElement.classList.remove('intro-lock');
    document.documentElement.classList.add('opened');
    var i = document.getElementById('intro'); if (i) i.hidden = true;
    var mn = document.getElementById('main'); if (mn) { mn.inert = false; mn.removeAttribute('aria-hidden'); }
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
