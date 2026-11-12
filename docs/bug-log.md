# BT3 — Bug Log

Các lỗi lịch sử được ghi rõ thời điểm, không dựng lại kết quả FAIL giả. Link GitHub chỉ mở được nếu commit tương ứng đã được push; các commit BT3 hiện giữ local theo yêu cầu.

## BUG-01 — MAJOR — lỗi HTTP khi PostgreSQL ngừng (lịch sử BT2)
1. Phát hiện bởi: kiểm thử thủ công ngắt DB; regression `tests/http-errors.test.js` (không thuộc bộ TC-01–12).
2. Triệu chứng: client nhận lỗi 500 chung thay vì biết DB tạm mất kết nối.
3. Tái lập: dừng PostgreSQL của môi trường thử, gọi endpoint cần DB; hoặc chạy unit mô phỏng `ECONNREFUSED`/`AggregateError`.
4. Nguyên nhân: error handler chưa phân biệt mã lỗi kết nối và SQLSTATE nhóm 08 với lỗi không xác định.
5. Cách sửa: nhận diện mã kết nối, trả 503 `DATABASE_UNAVAILABLE`, giữ thông báo chung với lỗi lạ.
6. Commit: [50c4b7d](https://github.com/levan05/cdtn1-tranvanle-l2/commit/50c4b7d9092a6ba5e7060bff1eeeb551f665ed73).
7. Xác nhận: `node scripts/verify-bug-regressions.js` thực thi handler tại `50c4b7d^` và `50c4b7d` với lỗi ECONNREFUSED mô phỏng: trước 500 (FAIL kỳ vọng 503), sau 503/DATABASE_UNAVAILABLE (PASS). Unit hiện tại 3 regression error-handler PASS. [Output](bug-evidence/regressions.txt). Đây là mô phỏng runtime handler, không phải dừng DB thật.

## BUG-02 — MAJOR — lệnh test quét mã tham khảo
1. Phát hiện bởi: kiểm tra phạm vi lệnh `npm test` khi thư mục mẫu nằm trong `docs/` (ngoài bộ 12 case).
2. Triệu chứng: `node --test` có thể khám phá cả test của dự án mẫu không thuộc hệ thống nộp.
3. Tái lập: đặt bản mẫu có test dưới docs, dùng lệnh test cũ không giới hạn đường dẫn; quan sát danh sách test được khám phá.
4. Nguyên nhân: script dùng cơ chế tự khám phá trên toàn repo thay vì chỉ bộ test của module.
5. Cách sửa: `node --test tests/*.test.js`.
6. Commit: [d61d902](https://github.com/levan05/cdtn1-tranvanle-l2/commit/d61d902) (local, chờ push).
7. Xác nhận: đã tái hiện với thư mục mẫu ở máy làm việc; regression tự chứa tạo 1 test dự án và 1 test tham khảo cố ý FAIL trong thư mục tạm: lệnh cũ chạy cả 2 (FAIL), lệnh mới chỉ chạy 1 test dự án (PASS). Bộ 15 test thực của dự án cũng PASS. [Trước](bug-evidence/test-scope-before.txt), [sau](bug-evidence/test-scope-after.txt). Sentinel FAIL là đối chứng kiểm phạm vi, không phải bug nghiệp vụ; script không phụ thuộc thư mục tham khảo chưa commit.

## BUG-03 — MAJOR — thiếu kiểm tra sức khỏe app và test trong image
1. Phát hiện bởi: review đóng gói theo tiêu chí BT3 (kiểm tra cấu hình, ngoài bộ 12 case).
2. Triệu chứng: Compose không thể báo app healthy; image không có `tests/` để chạy `npm test`.
3. Tái lập: đọc Compose cũ không có `app.healthcheck`; Dockerfile cũ không COPY tests và `.dockerignore` loại tests.
4. Nguyên nhân: cấu hình BT2 chỉ kiểm DB; đóng gói chỉ gồm mã chạy, chưa gồm bộ test phục vụ bàn giao.
5. Cách sửa: healthcheck HTTP dùng Node fetch, COPY tests và bỏ ignore tests.
6. Commit: [84dfbf5](https://github.com/levan05/cdtn1-tranvanle-l2/commit/84dfbf5) (local, chờ push).
7. Xác nhận: ngày 12/11/2026 dựng source `ca4ce2a` trong thư mục mới và volume mới: app/db đều healthy, `/health` đúng, `npm test` trong image 15/15 PASS; integration 12/12 PASS. [Transcript](packaging-evidence/20261112-132605.txt). Trạng thái: đã xác nhận đóng qua runtime Docker.

## BUG-04 — HIGH dependency advisory (ghi nhận từ phiên trước)
1. Phát hiện bởi: `npm audit` trong phiên làm việc trước, không thuộc bộ 12 case.
2. Triệu chứng: advisory HIGH của body-parser qua Express.
3. Tái lập: audit lockfile trước `cfdf354` trong checkout tách biệt; không hạ dependency của nhánh đang làm.
4. Nguyên nhân: phiên bản phụ thuộc gián tiếp được ghim trong lockfile cũ có cảnh báo.
5. Cách sửa: cập nhật lockfile bằng npm audit fix.
6. Commit: [cfdf354](https://github.com/levan05/cdtn1-tranvanle-l2/commit/cfdf354) (local, chờ push).
7. Xác nhận: phiên BT3 ngày 12/11/2026 chạy lại `npm audit --omit=dev` → 0 vulnerabilities, `npm test` → 15/15 PASS. Mức HIGH của advisory không tự đồng nghĩa phân loại CRITICAL của bài tập.

## BUG-05 — MAJOR — ID BIGINT không khớp hợp đồng số của API (lịch sử BT2)
1. Phát hiện bởi: kiểm hợp đồng kiểu ID; regression `scripts/verify-bug-regressions.js`, đối chiếu TC-01 (`center_id` phải là number) và TC-02/11 (so sánh chủ sở hữu thiết bị).
2. Triệu chứng: driver trả ID dạng chuỗi trong JSON; so sánh nghiêm ngặt với ID số từ request cho kết quả khác nhau dù cùng giá trị.
3. Tái lập: dùng `pg.types.getTypeParser(20)('42')` ở tiến trình Node mới; đối chiếu với `42` bằng `===`; sau đó chạy tiến trình mới nạp cấu hình `src/db.js` rồi đo lại.
4. Nguyên nhân: pg mặc định đọc PostgreSQL BIGINT thành string; ứng dụng và validator dùng number, chưa đăng ký parser thống nhất.
5. Cách sửa: đăng ký parser OID 20 sang Number cho miền ID của prototype nhỏ hơn 2^53. Nếu mở rộng vượt miền số nguyên an toàn phải đổi hợp đồng ID sang string.
6. Commit: [af99f3b](https://github.com/levan05/cdtn1-tranvanle-l2/commit/af99f3b457b750af7ebefd9bd0da32fddaf9ff6e).
7. Xác nhận: regression cho kết quả trước `string/false` (FAIL), sau `number/true` (PASS); script đọc bản trước commit để xác nhận chưa có parser, không checkout hoặc ghi DB. [Output](bug-evidence/regressions.txt); bộ integration hiện tại 12/12 PASS.

**Ba lỗi có regression trước/sau:** BUG-01, BUG-02 và BUG-05. BUG-03 đã xác nhận runtime Docker; BUG-04 có audit hậu kiểm. Các commit local phải được push theo yêu cầu người dùng thì link mới mở được trên GitHub; sinh viên cần tự chạy và giải thích nguyên nhân trước khi nộp.
