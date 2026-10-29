# Luồng dữ liệu và mã nguồn của luồng L2

Tài liệu này trả lời ba câu hỏi: đoạn mã nào đọc ghi dữ liệu, đoạn nào đưa dữ liệu từ giao diện lên máy chủ `localhost`, và tệp nào liên quan tới luồng L2 "Tiếp nhận và phân loại yêu cầu bảo hành".

## 1. Dữ liệu đi từ đâu đến đâu

Có hai chế độ chạy, cùng một đường đi dữ liệu:

- Chạy bằng `npm start`: máy chủ Express ở cổng 8000 phục vụ cả giao diện đã build (`frontend/dist`) lẫn API. Trình duyệt mở http://localhost:8000.
- Chạy chế độ phát triển: Vite ở cổng 5173 phục vụ giao diện, mọi yêu cầu `/api` được chuyển sang http://localhost:8000 (cấu hình trong `frontend/vite.config.js`).

```
Trình duyệt (React)
  └─ frontend/src/pages/*.jsx        người dùng bấm nút, nhập form
      └─ frontend/src/api/client.js  fetch("/api/...") gửi JSON kèm token
          └─ HTTP tới localhost:8000
              └─ src/app.js                       nhận request, kiểm tra token
                  └─ src/routes/*.routes.js       đọc req, gọi service, trả JSON
                      └─ src/services/*.js        luật nghiệp vụ
                          ├─ src/validators/*.js  kiểm tra dữ liệu vào
                          └─ src/repositories/*.js  câu lệnh SQL
                              └─ src/db.js (pg Pool) ──► PostgreSQL, CSDL baohanh_l2
```

Dữ liệu trả về đi ngược lại đường đó. Token đăng nhập (JWT) được giao diện lưu trong `localStorage` và gắn vào header `Authorization` ở mọi yêu cầu.

## 2. Đoạn nào đưa dữ liệu lên localhost

Toàn bộ việc gọi máy chủ nằm ở một nơi: `frontend/src/api/client.js`. Hàm `request()` ghép địa chỉ, gắn token, gọi `fetch`, đổi lỗi thành `ApiError`. Các màn hình không gọi `fetch` trực tiếp mà gọi các hàm của đối tượng `api`.

| Hành động của người dùng | Màn hình gọi | Hàm trong `api` | Yêu cầu HTTP |
| --- | --- | --- | --- |
| Đăng nhập | `Login.jsx` | `login` | `POST /api/auth/login` |
| Xem danh sách, lọc phiếu | `TicketList.jsx` | `listTickets`, `listCategories` | `GET /api/tickets?...`, `GET /api/categories` |
| Tra khách theo số điện thoại | `TicketCreate.jsx` | `findCustomerByPhone` | `GET /api/customers?phone=...` |
| Tạo khách mới | `TicketCreate.jsx` | `createCustomer` | `POST /api/customers` |
| Lấy thiết bị của khách | `TicketCreate.jsx` | `listCustomerDevices` | `GET /api/customers/:id/devices` |
| Thêm thiết bị mới | `TicketCreate.jsx` | `createDevice` | `POST /api/devices` |
| Xem gợi ý phân loại khi gõ mô tả lỗi | `TicketCreate.jsx` | `previewTicket` | `POST /api/tickets/preview` (không lưu gì) |
| Bấm "Tạo phiếu" | `TicketCreate.jsx` | `createTicket` | `POST /api/tickets` |
| Mở chi tiết phiếu | `TicketDetail.jsx` | `getTicket` | `GET /api/tickets/:id` |
| Chuyển sang bước kế tiếp | `TicketDetail.jsx` | `changeTicketStatus` | `PATCH /api/tickets/:id/status` |
| Xem, tạo tài khoản nhân viên | `UserManage.jsx` | `listUsers`, `createUser` | `GET`, `POST /api/users` |

Khi máy chủ tắt hoặc mất kết nối cơ sở dữ liệu, `client.js` đổi thành lỗi `NETWORK_ERROR` và giao diện hiện trạng thái lỗi kèm nút "Thử lại" (`components/StateViews.jsx`, `hooks/useAsync.js`).

## 3. Đoạn nào đọc, ghi cơ sở dữ liệu

Mọi câu lệnh SQL nằm trong `src/repositories/`; services và routes không viết SQL. Kết nối do `src/db.js` tạo, thông số lấy từ `.env`.

| Việc | Tệp | Hàm | Bảng bị tác động |
| --- | --- | --- | --- |
| Tạo phiếu | `ticket.repository.js` | `nextTicketId`, `insert`, `insertLog` | ghi `ticket`, `ticket_status_log` |
| Chuyển trạng thái | `ticket.repository.js` | `findForUpdate`, `updateStatus`, `insertLog` | sửa `ticket`, ghi `ticket_status_log` |
| Xem danh sách, chi tiết | `ticket.repository.js` | `list`, `findById`, `listLogs` | đọc `ticket`, `customer`, `device`, `service_center`, `issue_category` |
| Khách hàng | `customer.repository.js` | tìm, thêm, sửa, xóa | `customer` |
| Thiết bị | `device.repository.js` | tìm, thêm, sửa, xóa | `device` |
| Nhóm sự cố | `category.repository.js` | liệt kê | đọc `issue_category` |
| Đăng nhập, tài khoản | `user.repository.js` | tìm theo tài khoản và mật khẩu, thêm, liệt kê | `app_user` |

Hai thao tác ghi nhiều bảng chạy trong transaction (`runInTransaction` trong `ticket.repository.js`): hoặc phiếu và log đều được lưu, hoặc không gì được lưu. Khi đổi trạng thái, phiếu bị khóa dòng (`FOR UPDATE`) để hai người không ghi đè nhau.

Cấu trúc bảng và dữ liệu mẫu nằm ở `migrations/001_init.sql`, `migrations/002_app_user.sql`, `seeds/001_demo.sql`, chạy bằng `scripts/run-sql.js` (`npm run migrate`, `npm run seed`).

## 4. Hành trình của một phiếu: tạo phiếu

1. `TicketCreate.jsx` tra số điện thoại, chọn hoặc thêm thiết bị, gõ mô tả lỗi. Khi người dùng dừng gõ khoảng 0,4 giây, giao diện gọi `previewTicket`, máy chủ trả nhóm sự cố, mức ưu tiên và hạn dự kiến.
2. Bấm "Tạo phiếu": `api.createTicket({customer_id, device_id, issue_desc})` gửi `POST /api/tickets`.
3. `src/app.js` chạy `authenticate` (`src/middleware/auth.js`): đọc token, giải mã ra `req.user` gồm tên đăng nhập, vai trò, `center_id`.
4. `src/routes/ticket.routes.js` gọi `ticketService.create(req.body, req.user)`.
5. `src/services/ticket.service.js` (`create`):
   - `validateTicketInput` (`validators/ticket.validator.js`) kiểm tra dữ liệu.
   - Kiểm khách và thiết bị có tồn tại, thiết bị đúng của khách.
   - `phanLoaiSuCo` (`services/classifier.js`) cho nhóm sự cố và mức ưu tiên từ mô tả.
   - `tinhHanCamKet` (`services/deadline.js`) tính hạn: CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ, bỏ Chủ Nhật.
   - Trong một transaction: lấy `ticket_id`, sinh mã `BHxxxxxx/năm` (`sinhMaPhieu`), `insert` phiếu ở trạng thái `MOI`, `insertLog` dòng đầu (từ rỗng sang `MOI`).
   - `center_id` lấy từ token, không nhận từ giao diện.
6. Máy chủ trả `201` kèm mã phiếu, hạn cam kết. Giao diện chuyển sang trang chi tiết phiếu.

## 5. Hành trình của một phiếu: chuyển trạng thái và xem danh sách

- **Chuyển trạng thái (QT-04):** `TicketDetail.jsx` gọi `PATCH /api/tickets/:id/status`. `ticketService.changeStatus` khóa phiếu, chỉ chấp nhận trạng thái kế tiếp trong chuỗi `MOI → DA_PHAN_CONG → DANG_XU_LY → HOAN_TAT → DA_DONG`. Nhảy cóc hoặc quay lại trả lỗi 409 `INVALID_TRANSITION`. Mỗi lần chuyển ghi một dòng `ticket_status_log` kèm người thực hiện.
- **Danh sách (QT-06, QT-05):** `ticketService.list` luôn lọc theo `center_id` trong token, sắp theo hạn sớm nhất trước, thêm cờ `is_overdue`, `is_near_due`. Số điện thoại được che còn 4 số cuối, trừ vai trò `QUAN_LY` (`presentPhone`).
- **Lỗi:** `AppError` được ném ở service, `src/routes/http-errors.js` đổi thành mã HTTP (400, 401, 403, 404, 409, 503) và JSON `{ error: { code, message, fields } }`; `client.js` đọc lại thành `ApiError`.

## 6. Tệp nào liên quan tới L2

**Lõi nghiệp vụ L2 (quan trọng nhất khi bảo vệ):**

| Tệp | Vai trò |
| --- | --- |
| `src/services/deadline.js` | QT-03: tính hạn cam kết theo ưu tiên, bỏ Chủ Nhật, tính theo UTC+7 |
| `src/services/classifier.js` | Phân loại nhóm sự cố và mức ưu tiên bằng từ khóa |
| `src/services/ticket.service.js` | Tạo phiếu, mã phiếu, log đầu, đổi trạng thái một chiều, danh sách theo trung tâm, che số điện thoại |
| `src/repositories/ticket.repository.js` | SQL của phiếu, transaction, khóa dòng |
| `src/validators/ticket.validator.js` | Kiểm tra dữ liệu phiếu, bộ lọc, trạng thái |
| `src/routes/ticket.routes.js` | 5 endpoint phiếu |

**Hỗ trợ luồng (khách, thiết bị, đăng nhập):**

| Tệp | Vai trò |
| --- | --- |
| `src/services/customer.service.js`, `src/repositories/customer.repository.js`, `src/validators/customer.validator.js`, `src/routes/customer.routes.js` | Khách hàng (QT-01, QT-02, QT-05) |
| `src/services/device.service.js`, `src/repositories/device.repository.js`, `src/validators/device.validator.js`, `src/routes/device.routes.js` | Thiết bị (QT-07) |
| `src/services/auth.service.js`, `src/middleware/auth.js`, `src/routes/auth.routes.js` | Đăng nhập JWT, kiểm token, phân quyền theo vai trò |
| `src/services/user.service.js`, `src/repositories/user.repository.js`, `src/validators/user.validator.js`, `src/routes/user.routes.js` | Quản lý tài khoản nhân viên |
| `src/services/category.service.js`, `src/repositories/category.repository.js`, `src/routes/category.routes.js` | Danh sách nhóm sự cố cho ô lọc |

**Hạ tầng dùng chung:** `src/app.js` (ghép các route, phục vụ giao diện), `src/server.js` (tạo repository và service rồi truyền vào nhau, mở cổng), `src/db.js` (kết nối PostgreSQL), `src/errors/AppError.js`, `src/routes/http-errors.js`, `src/validators/common.validator.js`, `src/logger.js`.

**Giao diện:**

| Tệp | Vai trò |
| --- | --- |
| `frontend/src/api/client.js` | Nơi duy nhất gọi API, lưu token |
| `frontend/src/pages/TicketList.jsx` | Danh sách và lọc phiếu |
| `frontend/src/pages/TicketCreate.jsx` | Tạo phiếu: tra khách, chọn thiết bị, gợi ý phân loại |
| `frontend/src/pages/TicketDetail.jsx` | Chi tiết, chuyển trạng thái, lịch sử |
| `frontend/src/pages/Login.jsx`, `UserManage.jsx` | Đăng nhập, tài khoản |
| `frontend/src/components/Layout.jsx`, `StateViews.jsx`, `hooks/useAsync.js`, `hooks/useHashRoute.js`, `utils/format.js` | Khung trang, ba trạng thái đang tải/rỗng/lỗi, định tuyến, định dạng giờ Việt Nam |

**Kiểm thử và dữ liệu:** `tests/deadline.test.js` (giá trị biên hạn cam kết), `tests/ticket.valid.test.js` (luồng đúng), `tests/ticket.invalid.test.js` (dữ liệu sai), `tests/http-errors.test.js` (ánh xạ lỗi); `migrations/`, `seeds/`, `scripts/run-sql.js`.

## 7. Cách các lớp nối với nhau

`src/server.js` là nơi duy nhất tạo đối tượng: tạo repository từ `db`, truyền vào service, truyền service vào `createApp`. Service không import repository trực tiếp và không biết `req`, `res` hay SQL, nên kiểm thử (`tests/`) có thể truyền repository giả và hàm `now` giả mà không cần PostgreSQL.
