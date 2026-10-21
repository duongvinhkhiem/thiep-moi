/* rsvp.js — Form xác nhận tham dự.
 * - Kiểm tra dữ liệu trước khi gửi, chống gửi lặp, có timeout.
 * - Chỉ báo THÀNH CÔNG khi máy chủ trả về {"ok":true}.
 * - Chưa cấu hình endpoint → báo "chưa được kết nối", không giả lập thành công.
 */
(function () {
  'use strict';

  var form, els = {}, cfg, submitting = false;

  function setError(input, errEl, msg) {
    errEl.textContent = msg || '';
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function status(type, text) {
    els.status.hidden = false;
    els.status.className = 'form-status ' + type;
    els.status.textContent = text;
  }

  function attending() {
    var r = form.querySelector('input[name="attending"]:checked');
    return r ? r.value : '';
  }

  function syncGuests() {
    var no = attending() === 'no';
    els.guestsField.hidden = no;
  }

  /** Trả về danh sách lỗi; rỗng nếu hợp lệ. */
  function validate() {
    var ok = true, firstBad = null;
    var name = els.name.value.trim().replace(/\s+/g, ' ');
    var att = attending();
    var guests = parseInt(els.guests.value, 10);
    var max = (cfg.rsvp && cfg.rsvp.maxGuests) || 10;

    setError(els.name, els.nameErr, '');
    setError(null, els.attErr, '');
    setError(els.guests, els.guestsErr, '');

    if (name.length < 2) { setError(els.name, els.nameErr, 'Vui lòng nhập họ và tên (ít nhất 2 ký tự).'); ok = false; firstBad = firstBad || els.name; }
    if (!att) { setError(null, els.attErr, 'Vui lòng chọn một trong hai trạng thái.'); ok = false; firstBad = firstBad || form.querySelector('input[name="attending"]'); }
    if (att === 'yes' && (isNaN(guests) || guests < 1 || guests > max)) {
      setError(els.guests, els.guestsErr, 'Số người tham dự phải từ 1 đến ' + max + '.');
      ok = false; firstBad = firstBad || els.guests;
    }
    if (!ok && firstBad) firstBad.focus();
    return ok ? { name: name, attending: att, guests: att === 'yes' ? guests : 0, message: els.msg.value.trim() } : null;
  }

  function setBusy(busy) {
    submitting = busy;
    els.submit.disabled = busy;
    els.submit.setAttribute('aria-busy', busy ? 'true' : 'false');
    var label = els.submit.querySelector('span');
    var icon = els.submit.querySelector('svg');
    if (busy) {
      label.textContent = 'ĐANG GỬI…';
      if (icon) icon.style.display = 'none';
      if (!els.submit.querySelector('.spin')) {
        var sp = document.createElement('i'); sp.className = 'spin'; els.submit.insertBefore(sp, label);
      }
    } else {
      label.textContent = 'XÁC NHẬN THAM DỰ';
      if (icon) icon.style.display = '';
      var s = els.submit.querySelector('.spin'); if (s) s.remove();
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;                                   // chống gửi lặp
    els.status.hidden = true;

    if (form.elements.website && form.elements.website.value) return;   // bẫy bot: bỏ qua im lặng

    var data = validate();
    if (!data) return;

    var endpoint = (cfg.rsvp && cfg.rsvp.endpoint || '').trim();
    if (!endpoint) {
      status('info', 'Chức năng xác nhận tham dự chưa được kết nối nên thông tin của bạn CHƯA được gửi. Vui lòng liên hệ trực tiếp với Khiêm để xác nhận nhé.');
      return;
    }

    setBusy(true);
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, (cfg.rsvp && cfg.rsvp.timeoutMs) || 15000);

    data.sentAt = new Date().toISOString();
    // Content-Type text/plain để tránh preflight CORS với Google Apps Script
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined,
      redirect: 'follow'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (!json || json.ok !== true) throw new Error((json && json.error) || 'Phản hồi không hợp lệ');
        var yes = data.attending === 'yes';
        status('ok', yes ? 'Cảm ơn ' + data.name + '! Khiêm đã nhận được xác nhận và rất mong gặp bạn ngày ' + (window.GradView ? window.GradView.dateDots : '') + '.'
                         : 'Cảm ơn ' + data.name + ' đã báo cho Khiêm. Khiêm rất tiếc vì không có bạn, hẹn gặp bạn dịp khác nhé!');
        form.reset(); syncGuests();
        if (yes && window.GradEffects) window.GradEffects.confetti();
      })
      .catch(function (err) {
        var aborted = err && err.name === 'AbortError';
        status('error', aborted ? 'Gửi quá lâu nên đã bị hủy. Vui lòng kiểm tra mạng rồi thử lại.'
                                : 'Không gửi được thông tin. Vui lòng thử lại sau ít phút.');
        if (window.console) console.warn('[RSVP]', err);
      })
      .then(function () { clearTimeout(to); setBusy(false); });
  }

  var RSVP = {};

  RSVP.init = function (config) {
    cfg = config;
    form = document.getElementById('rsvpForm');
    if (!form) return;
    els = {
      name: document.getElementById('rsName'), nameErr: document.getElementById('rsNameErr'),
      attErr: document.getElementById('rsAttErr'),
      guests: document.getElementById('rsGuests'), guestsErr: document.getElementById('rsGuestsErr'),
      guestsField: document.getElementById('guestsField'),
      msg: document.getElementById('rsMsg'),
      submit: document.getElementById('rsSubmit'), status: document.getElementById('rsStatus')
    };
    els.guests.max = String((cfg.rsvp && cfg.rsvp.maxGuests) || 10);
    form.addEventListener('submit', onSubmit);
    form.querySelectorAll('input[name="attending"]').forEach(function (r) {
      r.addEventListener('change', function () { setError(null, els.attErr, ''); syncGuests(); });
    });
    els.name.addEventListener('input', function () { if (els.name.value.trim().length >= 2) setError(els.name, els.nameErr, ''); });
  };

  window.GradRSVP = RSVP;
})();
