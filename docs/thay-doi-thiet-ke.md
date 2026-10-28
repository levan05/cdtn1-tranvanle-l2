# Thay đổi so với thiết kế Bài tập 1

Mỗi thay đổi gồm ba dòng: thay đổi gì, vì sao, ảnh hưởng tới thành phần nào.

## TĐ1. Thêm bảng `app_user` (người dùng hệ thống)

- Thay đổi gì: thêm bảng `app_user` gồm `user_id`, `username`, `password_hash`, `full_name`, `role` (`NHAN_VIEN_TIEP_NHAN` hoặc `QUAN_LY`), `center_id`. Migration nằm ở `migrations/002_app_user.sql`.
- Vì sao: ERD BT1 chưa có người dùng, chỉ có `ticket_status_log.changed_by` dạng chữ. Đề BT2 yêu cầu đăng nhập mức cơ bản, và hệ thống cần biết vai trò, trung tâm của người đăng nhập để thực hiện QT-05 (che số điện thoại) và QT-06 (quản lý chỉ xem phiếu trung tâm mình).
- Ảnh hưởng tới: `docs/erd.drawio`, `docs/erd.png` và `db/schema.sql` (bản BT1 giữ nguyên, bản chạy thật là `migrations/`); `docs/api-contract.md` (sẽ thêm endpoint đăng nhập); lớp Application (kiểm tra quyền theo vai trò).

## TĐ2. Migration chạy lại được nhiều lần

- Thay đổi gì: `migrations/001_init.sql` dùng `CREATE TABLE IF NOT EXISTS` và `CREATE INDEX IF NOT EXISTS`; cấu trúc 6 bảng của BT1 giữ nguyên.
- Vì sao: đề BT2 mục C5 yêu cầu chạy lại lần thứ hai không lỗi và không nhân đôi dữ liệu.
- Ảnh hưởng tới: `db/schema.sql` (bản thiết kế, không còn là bản chạy thật), quy trình dựng cơ sở dữ liệu trong README.

## TĐ3. Dữ liệu mẫu có cơ chế chống nhân đôi

- Thay đổi gì: thêm `seeds/001_demo.sql` (2 trung tâm, 6 nhóm sự cố, 2 tài khoản, 3 khách, 3 thiết bị, 3 phiếu) dùng `ON CONFLICT DO NOTHING`.
- Vì sao: hệ thống không được lên trống trơn, và nạp lại dữ liệu mẫu không được nhân đôi bản ghi.
- Ảnh hưởng tới: các bảng `service_center`, `issue_category`, `app_user`, `customer`, `device`, `ticket`, `ticket_status_log`.

## TĐ4. Thêm chức năng quản lý tài khoản (`/api/users`)

- Thay đổi gì: thêm `GET /api/users` và `POST /api/users`. Chỉ `QUAN_LY` dùng được; tài khoản mới luôn có vai trò `NHAN_VIEN_TIEP_NHAN` và thuộc trung tâm của quản lý đang tạo. Trùng tên đăng nhập trả 409 `USERNAME_EXISTS`. Mật khẩu được băm bằng bcrypt (`crypt()` của pgcrypto) ngay trong SQL.
- Vì sao: SRS và API contract chỉ có tài khoản mẫu từ seed, chưa có cách tạo thêm người dùng. Việc cho người dùng tự chọn vai trò hoặc trung tâm sẽ phá QT-05, QT-06, nên hai trường này không nhận từ client.
- Ảnh hưởng tới: `docs/api-contract.md` (thêm 2 endpoint và mã lỗi `USERNAME_EXISTS`), `src/routes/user.routes.js`, `src/services/user.service.js`, `src/repositories/user.repository.js`, `src/validators/user.validator.js`, màn hình quản lý tài khoản ở giao diện.

## TĐ5. Thời điểm hạn cam kết tính theo múi giờ UTC+7

- Thay đổi gì: `src/services/deadline.js` xác định ngày làm việc theo UTC+7 (chỉ Chủ Nhật nghỉ). Phiếu nhận vào Chủ Nhật được đếm từ 00:00 Thứ Hai. API trả thời điểm dạng UTC (hậu tố `Z`) thay vì `+07:00` như ví dụ trong API contract.
- Vì sao: máy chủ có thể chạy ở múi giờ khác, nếu dùng giờ máy thì hạn sẽ sai lệch. Hai dạng biểu diễn cùng chỉ một thời điểm.
- Ảnh hưởng tới: `docs/api-contract.md` (ví dụ thời gian), `tests/deadline.test.js`, hiển thị giờ ở giao diện (đổi sang giờ Việt Nam khi hiển thị).

## TĐ6. Ví dụ phân loại trong API contract được chỉnh theo quy tắc từ khóa

- Thay đổi gì: câu mô tả "den man hinh, khong len nguon" được phân loại ưu tiên `CAO` theo bảng từ khóa trong `src/services/classifier.js`, không còn là `TRUNG_BINH` như ví dụ ở API contract.
- Vì sao: ví dụ trong contract chỉ là minh họa, quy tắc từ khóa mới là nguồn chuẩn; hạn cam kết của phiếu này vì vậy là 24 giờ.
- Ảnh hưởng tới: `docs/api-contract.md` (ví dụ phản hồi tạo phiếu), `tests/ticket.valid.test.js`.


## TĐ7. Bổ sung endpoint phục vụ giao diện và mã lỗi mất kết nối cơ sở dữ liệu

- Thay đổi gì: thêm `GET /api/categories`, `POST /api/tickets/preview`, các bộ lọc `phone` và `category` cho `GET /api/tickets`, hai cờ `is_overdue` và `is_near_due` trong danh sách phiếu, `customer_address` và `imei` trong chi tiết phiếu, và mã lỗi 503 `DATABASE_UNAVAILABLE`.
- Vì sao: wireframe M1, M2, M3 cần ô lọc theo số điện thoại và nhóm sự cố, danh sách nhóm lấy từ cơ sở dữ liệu thay vì ghi cứng, gợi ý phân loại và hạn cam kết trước khi lưu phiếu, địa chỉ và IMEI ở chi tiết phiếu, cảnh báo sắp quá hạn (US5). Đề BT2 yêu cầu khi một thành phần phụ trợ ngừng thì hệ thống báo lỗi rõ ràng thay vì lỗi chung.
- Ảnh hưởng tới: `docs/api-contract.md` (mục 6), `src/routes/ticket.routes.js`, `src/routes/category.routes.js`, `src/routes/http-errors.js`, `src/repositories/ticket.repository.js`, `frontend/src/pages/`, `tests/http-errors.test.js`.
