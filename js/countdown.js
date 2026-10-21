/* countdown.js — Đếm ngược tới thời điểm tổ chức, theo múi giờ Việt Nam (UTC+7).
 *
 * Cách làm đúng múi giờ:
 *  - Mốc đích lấy từ chuỗi ISO có offset "+07:00" → là một thời điểm tuyệt đối, không phụ thuộc múi giờ máy.
 *  - So sánh "cùng ngày" bằng cách cộng cố định +7h (Việt Nam không có giờ mùa hè).
 */
(function () {
  'use strict';

  var HOUR = 3600000, DAY = 86400000;
  var timer = 0, target = 0, offsetMs = 0, prev = {};
  var els = {};

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /** Số ngày (từ epoch) của thời điểm ms theo giờ Việt Nam. */
  function vnDay(ms) { return Math.floor((ms + offsetMs) / DAY); }

  function setNum(key, value) {
    var el = els[key];
    if (!el) return;
    var text = key === 'd' && value > 99 ? String(value) : pad(value);
    if (prev[key] === text) return;
    prev[key] = text;
    el.textContent = text;
    if (!window.GradEffects || !window.GradEffects.reduced()) {
      el.classList.remove('tick');
      void el.offsetWidth;           // khởi động lại animation
      el.classList.add('tick');
    }
  }

  function showMessage(text) {
    els.grid.hidden = true;
    els.note.hidden = true;
    els.msg.hidden = false;
    els.msg.textContent = text;
  }

  function tick() {
    var now = Date.now();
    var diff = target - now;

    if (diff > 0) {
      els.grid.hidden = false;
      els.msg.hidden = true;
      els.note.hidden = false;
      var d = Math.floor(diff / DAY);
      var h = Math.floor((diff % DAY) / HOUR);
      var m = Math.floor((diff % HOUR) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      setNum('d', d); setNum('h', h); setNum('m', m); setNum('s', s);
    } else if (vnDay(now) === vnDay(target)) {
      showMessage('HÔM NAY LÀ NGÀY ĐẶC BIỆT!');
    } else {
      showMessage('Cảm ơn bạn đã là một phần của hành trình này');
    }
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    // Canh đúng nhịp giây để số không bị lệch
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
  }

  var Countdown = {};

  Countdown.init = function (cfg) {
    els = {
      grid: document.getElementById('cdGrid'),
      msg: document.getElementById('cdMsg'),
      note: document.getElementById('cdNote'),
      d: document.getElementById('cdD'), h: document.getElementById('cdH'),
      m: document.getElementById('cdM'), s: document.getElementById('cdS')
    };
    if (!els.grid) return;
    target = Date.parse(cfg.event.startISO);
    offsetMs = (cfg.event.utcOffsetMinutes || 420) * 60000;
    if (isNaN(target)) { showMessage('Chưa xác định được thời gian buổi lễ.'); return; }

    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    tick();
  };

  Countdown.destroy = function () { clearTimeout(timer); };

  window.GradCountdown = Countdown;
})();
