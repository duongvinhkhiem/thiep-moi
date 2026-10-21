/* =====================================================================
 * config.js — FILE CẤU HÌNH TRUNG TÂM
 * Mọi thông tin cần thay đổi (tên, ngày giờ, địa điểm, ảnh, RSVP, nhạc,
 * hiệu ứng) đều nằm ở đây. Không cần sửa các file JS khác.
 * ===================================================================== */
window.GRAD_CONFIG = {

  /* ---------- Người tốt nghiệp ---------- */
  person: {
    name: 'Dương Vĩnh Khiêm',
    shortName: 'Khiêm',
    // Đường dẫn ảnh chân dung, ví dụ: 'assets/images/portrait.jpg'
    // Để trống ('') → hiển thị khung placeholder.
    portrait: '',
    portraitAlt: 'Ảnh chân dung Dương Vĩnh Khiêm'
  },

  /* ---------- Trường / ngành ---------- */
  school: {
    name: 'Trường Đại học Công nghệ TP.HCM',
    short: 'HUTECH',
    major: 'Công nghệ thông tin'
  },

  /* ---------- Buổi lễ ---------- */
  event: {
    // Thời điểm bắt đầu, LUÔN kèm múi giờ +07:00 để không phụ thuộc máy người xem.
    startISO: '2026-11-08T07:30:00+07:00',
    timezoneLabel: 'Asia/Ho_Chi_Minh',
    utcOffsetMinutes: 420,            // Việt Nam UTC+7, không có giờ mùa hè

    venue: 'Hội trường E3-05.01',
    campus: 'Thu Duc Campus — Trung tâm Đào tạo nhân lực chất lượng cao HUTECH',

    // Google Maps: nếu mapsUrl để trống, website dùng liên kết TÌM KIẾM theo mapsQuery.
    // Khi đã xác minh được vị trí chính xác, dán link chia sẻ Google Maps vào mapsUrl.
    mapsQuery: 'Hội trường E3-05.01, Thu Duc Campus, Trung tâm Đào tạo nhân lực chất lượng cao HUTECH',
    mapsUrl: '',

    // PLACEHOLDER CẤU HÌNH: chưa có thời lượng chính thức của buổi lễ.
    // Google Calendar cần giờ kết thúc nên tạm dùng giá trị này. Hãy sửa cho đúng chương trình.
    calendarDurationMinutes: 60
  },

  /* ---------- Album ảnh ----------
   * src để trống ('') → hiện khung placeholder có hướng dẫn thay ảnh.
   * Ảnh đầu tiên là ảnh lớn làm điểm nhấn. Có thể thêm/bớt phần tử.
   * Ví dụ: src: 'assets/images/gallery/01.jpg'
   */
  gallery: [
    { src: '', label: 'Ảnh chân dung',        alt: 'Ảnh chân dung của Khiêm',          caption: 'Chân dung' },
    { src: '', label: 'Ảnh tốt nghiệp',       alt: 'Ảnh tốt nghiệp của Khiêm',         caption: 'Ngày tốt nghiệp' },
    { src: '', label: 'Ảnh cùng bạn bè',      alt: 'Khiêm chụp ảnh cùng bạn bè',       caption: 'Cùng bạn bè' },
    { src: '', label: 'Ảnh học tập',          alt: 'Khiêm trong quá trình học tập',    caption: 'Những ngày học tập' },
    { src: '', label: 'Ảnh kỷ niệm tại trường', alt: 'Kỷ niệm của Khiêm tại trường',   caption: 'Kỷ niệm tại trường' }
  ],

  /* ---------- Xác nhận tham dự (RSVP) ----------
   * endpoint: URL Google Apps Script Web App (xem README, mục "Cấu hình RSVP").
   * Để trống → form vẫn kiểm tra dữ liệu nhưng sẽ báo "chưa được kết nối",
   * KHÔNG hiển thị thành công giả.
   */
  rsvp: {
    endpoint: 'https://script.google.com/macros/s/AKfycbxaSl_bgWId6k3Q07NQvUFtRv4sLpHCkW0I0fell_9hbHuRnimOk2NIJt3HkOT_amqx/exec',
    maxGuests: 10,
    timeoutMs: 15000
  },

  /* ---------- Hiệu ứng ---------- */
  effects: {
    quality: 'auto',          // 'auto' | 'high' | 'low' | 'off' ('off' = bỏ WebGL, dùng nền CSS)
    particlesHigh: 1800,
    particlesLow: 600,
    confetti: true,
    parallax: true
  },

  /* ---------- Nhạc nền (tùy chọn) ----------
   * Mặc định TẮT vì chưa có file nhạc. Khi đã thêm file hợp lệ/bản quyền rõ ràng
   * vào assets/audio/, đặt enabled: true. Nhạc không tự phát; người xem bấm nút để bật.
   */
  music: {
    enabled: false,
    src: 'assets/audio/background.mp3',
    volume: 0.35
  }
};
