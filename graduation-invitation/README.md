# Website thiệp mời tốt nghiệp 3D — Dương Vĩnh Khiêm

HTML/CSS/JavaScript thuần. Phụ thuộc ngoài (CDN): **Three.js r128** (nền 3D) và **Google Fonts** (Inter, Space Grotesk). Nếu tải lỗi hoặc không có WebGL, trang tự dùng nền CSS.

## 1. Chạy trên máy tính
1. Giải nén thư mục `graduation-invitation`.
2. Mở bằng VS Code → cài tiện ích **Live Server** → chuột phải `index.html` → *Open with Live Server*.
3. Kiểm tra lỗi: F12 → tab *Console* và *Network* (không được có dòng đỏ).

## 2. Chỉnh thông tin, ảnh
Mọi thứ nằm trong `js/config.js`: tên, trường, ngành, ngày giờ, địa điểm, Google Maps, ảnh chân dung, album, RSVP, nhạc, hiệu ứng.
- Ảnh chân dung: `person.portrait: 'assets/images/portrait.jpg'`.
- Album: điền `gallery[].src`; để trống thì hiện khung placeholder.
- `event.calendarDurationMinutes` (mặc định 60) là **giá trị tạm** vì chưa có thời lượng chính thức — sửa cho đúng.
- Google Maps hiện dùng liên kết *tìm kiếm* theo tên. Khi xác minh được vị trí, dán link chia sẻ vào `event.mapsUrl`.
- Nội dung lời mời, câu trích dẫn nằm trong `index.html`.

## 3. Cấu hình RSVP (Google Sheet, miễn phí)
1. Tạo Google Sheet mới → *Extensions → Apps Script*.
2. Dán toàn bộ `apps-script/Code.gs` → Lưu.
3. *Deploy → New deployment → Web app*: Execute as **Me**, Who has access **Anyone** → Deploy, cấp quyền.
4. Mở URL Web app trên trình duyệt, phải thấy `{"ok":true,"service":"rsvp"}`.
5. Dán URL vào `rsvp.endpoint` trong `js/config.js`.
6. Gửi thử một phản hồi, kiểm tra sheet `RSVP` có dòng mới.

Lưu ý: URL không chứa mật khẩu; dữ liệu chỉ nằm trong Sheet của bạn (không chia sẻ Sheet công khai). Website chỉ báo thành công khi máy chủ trả `{"ok":true}`; chưa cấu hình thì báo "chưa được kết nối". Mỗi lần sửa `Code.gs` phải *Deploy → Manage deployments → New version*.

## 4. Triển khai miễn phí
**GitHub Pages**: tạo repository công khai → tải toàn bộ file lên (giữ nguyên cấu trúc, `index.html` ở gốc) → *Settings → Pages → Branch: main, / (root)* → chờ 1–2 phút, lấy link dạng `https://tên.github.io/tên-repo/`.
**Cloudflare Pages**: *Workers & Pages → Create → Pages → Upload assets* → kéo thả thư mục → Deploy.
Mọi đường dẫn trong dự án là **tương đối** (không bắt đầu bằng `/`) nên chạy được cả khi nằm trong thư mục con. Cập nhật nội dung: sửa file rồi tải lại lên repo.

## 5. Chia sẻ & xem trước (Open Graph)
1. Sau khi có link, mở `index.html`, thay `TEN-MIEN-CUA-BAN` trong `og:url` và `og:image` bằng địa chỉ thật (cần đường dẫn đầy đủ `https://...`).
2. Ảnh xem trước: `assets/images/og-cover.png` (1200×630, có thể thay).
3. Gửi link qua Zalo/Messenger/email. Kiểm tra xem trước bằng Facebook Sharing Debugger; Zalo/Messenger lưu cache nên có thể phải đổi nhẹ link (thêm `?v=2`).

## 6. Cần cấu hình thêm
- [ ] Ảnh chân dung và ảnh album
- [ ] Endpoint RSVP (mục 3)
- [ ] `og:url`, `og:image` (mục 5)
- [ ] Thời lượng lịch (`calendarDurationMinutes`)
- [ ] Link Google Maps chính xác (tùy chọn)
- [ ] Nhạc nền (tùy chọn, `music.enabled`)

## 7. Checklist trước khi gửi thiệp
- [ ] Mở link trên điện thoại (Chrome/Safari) và máy tính, bấm *MỞ THIỆP* và *Bỏ qua hiệu ứng*
- [ ] Ngày 08.11.2026, 07:30, địa điểm đúng; đếm ngược chạy
- [ ] *MỞ GOOGLE MAPS* và *THÊM VÀO GOOGLE CALENDAR* mở đúng
- [ ] Ảnh hiển thị, lightbox đóng bằng nút và Esc
- [ ] Gửi thử RSVP, thấy dòng trong Sheet
- [ ] Không cuộn ngang trên điện thoại; Console không có lỗi
- [ ] Xem trước link trên Zalo/Messenger đúng tiêu đề, ảnh

## Cấu trúc
`index.html` · `css/style.css` · `js/` (config, effects, scene, countdown, gallery, rsvp, envelope, main) · `apps-script/Code.gs` · `assets/`
