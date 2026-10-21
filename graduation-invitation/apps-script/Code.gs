/**
 * Code.gs — Nhận RSVP từ website và ghi vào Google Sheet.
 *
 * Cách dùng (chi tiết trong README.md, mục "Cấu hình RSVP"):
 *  1. Tạo Google Sheet mới, đặt tên tùy ý.
 *  2. Extensions → Apps Script, dán toàn bộ file này vào, bấm Lưu.
 *  3. Deploy → New deployment → loại "Web app":
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Sao chép "Web app URL" dán vào js/config.js → rsvp.endpoint.
 *
 * Không có khóa bí mật nào nằm trong website. Dữ liệu chỉ nằm trong Sheet của bạn.
 */

var SHEET_NAME = 'RSVP';
var HEADERS = ['Thời gian (VN)', 'Họ và tên', 'Trạng thái', 'Số người', 'Lời chúc', 'Gửi lúc (trình duyệt)'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var name = String(body.name || '').trim().slice(0, 80);
    var attending = body.attending === 'yes' ? 'Có thể tham dự' : body.attending === 'no' ? 'Không thể tham dự' : '';
    var guests = parseInt(body.guests, 10) || 0;
    var message = String(body.message || '').trim().slice(0, 500);

    if (name.length < 2 || !attending) return json_({ ok: false, error: 'Dữ liệu không hợp lệ' });
    if (body.attending === 'yes' && (guests < 1 || guests > 20)) return json_({ ok: false, error: 'Số người không hợp lệ' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss'),
      sanitize_(name), attending, guests, sanitize_(message), String(body.sentAt || '').slice(0, 40)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'Lỗi máy chủ' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Chặn công thức độc hại khi mở Sheet (ô bắt đầu bằng = + - @ bị coi là công thức)
function sanitize_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Mở URL web app bằng trình duyệt để kiểm tra nhanh: phải thấy {"ok":true,"service":"rsvp"}
function doGet() { return json_({ ok: true, service: 'rsvp' }); }
