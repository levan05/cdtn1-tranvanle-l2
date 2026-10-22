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
