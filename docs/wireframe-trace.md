# Bảng truy vết wireframe (luồng L2)

Số thứ tự khớp với số trong vòng tròn cam trên `docs/wireframe.png`. Cột dữ liệu lấy từ `docs/erd.drawio`.

Quy ước: màn hình hiển thị TÊN (ví dụ tên nhóm sự cố), không hiển thị khóa ngoại (ví dụ `category_id`).

## M1. Danh sách phiếu bảo hành (UC7, mở chi tiết qua UC6 · FR8 · US5)

| # | Trên màn hình | Cột trong ERD | Nguồn |
| --- | --- | --- | --- |
| 1 | Ô lọc Số điện thoại | `customer.phone` | FR1 · US1 · QT-02 |
| 2 | Ô lọc Trạng thái | `ticket.status` | FR8 · US5 · QT-04 |
| 3 | Ô lọc Nhóm sự cố | `issue_category.category_name` (qua `ticket.category_id`) | FR3 · FR8 |
| 4 | Ô lọc Mức ưu tiên | `ticket.priority` | FR3 · FR8 |
| 5 | Nút Tạo phiếu (chỉ nhân viên tiếp nhận) | chuyển sang M2 | UC2 |
| 6 | Cột: Mã phiếu | `ticket.ticket_code` | FR2 · US2 |
| 6 | Cột: Khách hàng | `customer.full_name` | FR1 |
| 6 | Cột: Số điện thoại (che) | `customer.phone` | QT-05 · NFR2 |
| 6 | Cột: Thiết bị | `device.product_name` (qua `ticket.device_id`) | FR2 |
| 6 | Cột: Nhóm sự cố | `issue_category.category_name` (qua `ticket.category_id`) | FR3 |
| 6 | Cột: Ưu tiên | `ticket.priority` | FR3 |
| 6 | Cột: Trạng thái | `ticket.status` | FR8 · US5 |
| 6 | Cột: Hạn cam kết | `ticket.due_date` | FR4 · US3 · QT-03 |
| 7 | Cảnh báo sắp quá hạn (tô vàng, đưa lên đầu) | tính từ `ticket.due_date` (không lưu) | US5 |
| 8 | Thông báo không có kết quả lọc | không lưu | US5 · QT-06 |

Lọc theo trung tâm (QT-06) do hệ thống tự áp dụng theo trung tâm của quản lý (`ticket.center_id`), không có ô nhập trên màn hình.

## M2. Tạo phiếu bảo hành mới (UC2, dùng UC1, UC3, UC4, UC5 · FR1 đến FR6)

| # | Trên màn hình | Cột trong ERD | Nguồn |
| --- | --- | --- | --- |
| 1 | Số điện thoại + nút Tra cứu | `customer.phone` (UNIQUE) | FR1 · US1 · UC1 · QT-01 · QT-02 |
| 2 | Họ tên khách (tự điền) | `customer.full_name` | FR1 · US1 · UC1 |
| 3 | Địa chỉ (tự điền) | `customer.address` | US1 · UC1 |
| 4 | Thông báo khách chưa tồn tại + nút Tạo khách mới | không lưu; tạo bản ghi `customer` | FR5 · US7 · UC3 · luồng 3a |
| 5 | Chọn Thiết bị khách đã mua | `ticket.device_id` → `device.device_id` | FR2 · US2 · UC2 |
| 6 | Tên sản phẩm | `device.product_name` | FR2 · FR6 · US2 |
| 7 | IMEI | `device.imei` | FR2 · FR6 · US2 |
| 8 | Số serial (thiết bị ngoài lịch sử mua: bắt buộc) | `device.serial_no` | FR6 · US2 · UC5 · QT-07 · luồng 4a |
| 9 | Thông báo bắt buộc nhập serial | không lưu | QT-07 · luồng 4a |
| 10 | Mô tả lỗi | `ticket.issue_desc` | FR2 · US2 · UC2 |
| 11 | Thông báo thiếu mô tả lỗi | không lưu | US2 · luồng 5a |
| 12 | Nhóm sự cố (hệ thống đề xuất) | `ticket.category_id` → `issue_category.category_name` | FR3 · US4 · UC4 |
| 13 | Mức ưu tiên | `ticket.priority` | FR3 · US4 · UC4 |
| 14 | Hạn cam kết (tự tính, chỉ đọc) | `ticket.due_date` | FR4 · US3 · QT-03 |
| 15 | Trung tâm | `ticket.center_id` → `service_center.center_name` | FR2 · QT-06 |
| 16 | Nút Hủy / Tạo phiếu | Tạo phiếu: INSERT `ticket` (tự sinh `ticket_code`, `status` = MỚI, `received_at`, `due_date`) + INSERT `ticket_status_log` (dòng đầu: từ NULL sang MỚI) | FR2 · US2 · UC2 |

## M3. Chi tiết phiếu bảo hành (UC6 · FR7 · US6)

| # | Trên màn hình | Cột trong ERD | Nguồn |
| --- | --- | --- | --- |
| 1 | Mã phiếu | `ticket.ticket_code` | FR2 · US2 |
| 2 | Trạng thái | `ticket.status` | FR7 · US6 · QT-04 |
| 3 | Ngày tiếp nhận | `ticket.received_at` | FR2 |
| 4 | Họ tên khách | `customer.full_name` | FR1 |
| 5 | Số điện thoại (che 4 số cuối với nhân viên tiếp nhận) | `customer.phone` | QT-05 · NFR2 |
| 6 | Địa chỉ | `customer.address` | US1 |
| 7 | Tên sản phẩm | `device.product_name` | FR2 |
| 8 | IMEI | `device.imei` | FR2 |
| 9 | Số serial | `device.serial_no` | FR6 · QT-07 |
| 10 | Nhóm sự cố | `issue_category.category_name` (qua `ticket.category_id`) | FR3 |
| 11 | Mức ưu tiên | `ticket.priority` | FR3 |
| 12 | Trung tâm | `service_center.center_name` (qua `ticket.center_id`) | QT-06 |
| 13 | Hạn cam kết | `ticket.due_date` | FR4 · US3 |
| 14 | Mô tả lỗi | `ticket.issue_desc` | FR2 |
| 15 | Chọn trạng thái mới + nút Cập nhật | UPDATE `ticket.status` + INSERT `ticket_status_log` | FR7 · US6 · UC6 · QT-04 |
| 16 | Thông báo không được chuyển ngược trạng thái | không lưu | US6 · QT-04 |
| 17 | Lịch sử trạng thái | `ticket_status_log.from_status`, `to_status`, `changed_at`, `changed_by` | FR7 · US6 · QT-04 |

## Kiểm hai chiều

- Mọi trường trên màn hình có cột tương ứng trong ERD, hoặc ghi rõ "không lưu" (thông báo, cảnh báo tính từ dữ liệu có sẵn).
- Mọi cột `NOT NULL` của `ticket` đều được nhập hoặc tự sinh: nhập (`customer_id`, `device_id`, `center_id`, `issue_desc`, `priority`), tự sinh (`ticket_code`, `status`, `received_at`, `due_date`).
- Wireframe không có trường nào ngoài ERD (không có kỹ thuật viên, linh kiện, email).
