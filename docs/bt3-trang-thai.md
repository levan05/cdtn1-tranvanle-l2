# BT3 — Trạng thái bàn giao

## Đã xác minh tại máy này

- `npm test`: 15/15 PASS, Node 24.19.0.
- Bộ integration PostgreSQL: 12/12 PASS; TC-06/07 kiểm cả message.
- TC-02 kiểm thêm QT-01/02/05/07; TC-10 kiểm cả vai trò quản lý và nhân viên, quản lý đọc phiếu cùng trung tâm.
- `node scripts/verify-bug-regressions.js`: 3 kiểm tra trước/sau PASS cho BUG-01/02/05, output tại `docs/bug-evidence/`.
- Capture API: 21 exchange thật, gồm 20 cặp method/path và biến thể tìm khách theo điện thoại; JWT/password đã che.
- `npm audit --omit=dev`: 0 vulnerabilities ở backend.
- `npm run build --prefix frontend`: build thành công.

## Cần hoàn thành trước khi nộp chính thức

Bản rà soát tổng hợp: [HTML](BT3_2374802010270_TranVanLe-review.html) và PDF cùng tên trong thư mục docs (PDF không đưa vào Git theo `.gitignore`). Tái tạo HTML bằng `node scripts/export-bt3-report.js`, mở trong trình duyệt và Print → Save as PDF; chọn A4 ngang. Đây là bản rà soát, chưa phải bản nộp cuối.

1. Chạy Docker máy trắng theo Deployment Guide, lưu ảnh thật cả hai dịch vụ healthy, health response và test PASS. Máy hiện chưa có Docker nên chưa thể thực hiện.
2. Chụp lại terminal TC-02/10 đã mở rộng và bộ 12 case mới khi sinh viên tự chạy; ảnh buổi 14 chỉ chứng minh phiên bản cũ. BUG-01/02/05 đã có kiểm tra trước/sau; BUG-03 vẫn chờ Docker. Không dùng output mô phỏng như bằng chứng đã dừng PostgreSQL thật.
3. Sinh viên tự chạy lại, hiểu test/bug và cập nhật xác nhận trong bảng AI; bổ sung lớp/ngày nộp.
4. Kiểm bản PDF, thêm ảnh máy trắng sau khi chạy; chọn commit để push. Các link commit local chưa mở được trên GitHub.
5. Khi kết quả đóng gói đã đạt và người dùng yêu cầu phát hành, tạo/push tag `v1.0`. Chưa tạo tag để tránh đánh dấu bản chưa xác minh là bản nộp cuối.

Không push/tag trong phiên này. Không đưa đề, thư mục tham khảo, file giải nén hoặc file khóa Word vào commit.

## Việc cần người dùng thực hiện

- Cài Docker Desktop và mở ứng dụng đến khi Linux engine chạy; báo lại để trợ lý chạy script kiểm đóng gói và xử lý lỗi nếu có. Không cần tự xóa database/volume đang dùng.
- Cung cấp mã lớp để điền trang bìa; xác nhận ngày nộp thực tế.
- Tự chạy/đọc test và bug, chụp terminal thật; kiểm trang PDF cuối cùng. Các mục tự xác nhận thuộc sinh viên, trợ lý không điền thay.
