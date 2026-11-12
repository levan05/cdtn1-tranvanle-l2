# BT3 — Bug Log

Các lỗi lịch sử được ghi rõ thời điểm, không dựng lại kết quả FAIL giả. Link GitHub chỉ mở được nếu commit tương ứng đã được push; các commit BT3 hiện giữ local theo yêu cầu.

## BUG-01 — MAJOR — lỗi HTTP khi PostgreSQL ngừng (lịch sử BT2)
1. Phát hiện bởi: kiểm thử thủ công ngắt DB; regression `tests/http-errors.test.js` (không thuộc bộ TC-01–12).
2. Triệu chứng: client nhận lỗi 500 chung thay vì biết DB tạm mất kết nối.
3. Tái lập: dừng PostgreSQL của môi trường thử, gọi endpoint cần DB; hoặc chạy unit mô phỏng `ECONNREFUSED`/`AggregateError`.
4. Nguyên nhân: error handler chưa phân biệt mã lỗi kết nối và SQLSTATE nhóm 08 với lỗi không xác định.
5. Cách sửa: nhận diện mã kết nối, trả 503 `DATABASE_UNAVAILABLE`, giữ thông báo chung với lỗi lạ.
6. Commit: [50c4b7d](https://github.com/levan05/cdtn1-tranvanle-l2/commit/50c4b7d9092a6ba5e7060bff1eeeb551f665ed73).
7. Xác nhận: lượt `npm test` BT3 có cả ba regression error-handler PASS; không tuyên bố đã tái hiện lỗi cũ bằng cách dừng DB trong phiên BT3.

## BUG-02 — MAJOR — lệnh test quét mã tham khảo
1. Phát hiện bởi: kiểm tra phạm vi lệnh `npm test` khi thư mục mẫu nằm trong `docs/` (ngoài bộ 12 case).
2. Triệu chứng: `node --test` có thể khám phá cả test của dự án mẫu không thuộc hệ thống nộp.
3. Tái lập: đặt bản mẫu có test dưới docs, dùng lệnh test cũ không giới hạn đường dẫn; quan sát danh sách test được khám phá.
4. Nguyên nhân: script dùng cơ chế tự khám phá trên toàn repo thay vì chỉ bộ test của module.
5. Cách sửa: `node --test tests/*.test.js`.
6. Commit: [d61d902](https://github.com/levan05/cdtn1-tranvanle-l2/commit/d61d902) (local, chờ push).
7. Xác nhận: lệnh mới chạy đúng 15 test, 15 PASS/0 FAIL trên Node 24.19.0. Chưa đo lại số case lệnh cũ trong phiên này.

## BUG-03 — MAJOR — thiếu kiểm tra sức khỏe app và test trong image
1. Phát hiện bởi: review đóng gói theo tiêu chí BT3 (kiểm tra cấu hình, ngoài bộ 12 case).
2. Triệu chứng: Compose không thể báo app healthy; image không có `tests/` để chạy `npm test`.
3. Tái lập: đọc Compose cũ không có `app.healthcheck`; Dockerfile cũ không COPY tests và `.dockerignore` loại tests.
4. Nguyên nhân: cấu hình BT2 chỉ kiểm DB; đóng gói chỉ gồm mã chạy, chưa gồm bộ test phục vụ bàn giao.
5. Cách sửa: healthcheck HTTP dùng Node fetch, COPY tests và bỏ ignore tests.
6. Commit: [84dfbf5](https://github.com/levan05/cdtn1-tranvanle-l2/commit/84dfbf5) (local, chờ push).
7. Xác nhận: đã kiểm tra diff cấu hình; **chưa xác nhận runtime** vì máy không có Docker. Trạng thái: đã sửa mã, chờ kiểm thử Docker; chưa tính là bug đã đóng hoàn toàn.

## BUG-04 — HIGH dependency advisory (ghi nhận từ phiên trước)
1. Phát hiện bởi: `npm audit` trong phiên làm việc trước, không thuộc bộ 12 case.
2. Triệu chứng: advisory HIGH của body-parser qua Express.
3. Tái lập: audit lockfile trước `cfdf354` trong checkout tách biệt; không hạ dependency của nhánh đang làm.
4. Nguyên nhân: phiên bản phụ thuộc gián tiếp được ghim trong lockfile cũ có cảnh báo.
5. Cách sửa: cập nhật lockfile bằng npm audit fix.
6. Commit: [cfdf354](https://github.com/levan05/cdtn1-tranvanle-l2/commit/cfdf354) (local, chờ push).
7. Xác nhận: phiên trước báo audit 0 và unit 15/15; audit hiện tại phải đo riêng, không suy ra từ lịch sử. Mức HIGH của advisory không tự đồng nghĩa phân loại CRITICAL của bài tập.

**Điều kiện còn thiếu:** giảng viên cần ít nhất 3 bug đã sửa, truy vết về test và có link mở được. BUG-03 còn chờ runtime, BUG-02 cần tái hiện đầu cũ nếu muốn bằng chứng trước/sau; không coi bảng này tự động đạt rubric.
