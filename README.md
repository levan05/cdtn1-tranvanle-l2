# Tiếp nhận và phân loại yêu cầu bảo hành (luồng L2, Mekong Mobile)

Sinh viên: Trần Văn Lễ, MSSV 2374802010270, track SE, lớp 71K29CNTT11. Học phần Chuyên đề Tốt nghiệp 1, Bài tập 2.

## 1. Mô tả

Hệ thống giúp nhân viên tiếp nhận của Mekong Mobile ghi nhận yêu cầu bảo hành: tra cứu khách theo số điện thoại, chọn thiết bị, tự phân loại nhóm sự cố, mức ưu tiên và sinh hạn cam kết (CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ, không tính Chủ Nhật). Phiếu đi một chiều MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT, DA_DONG và mỗi lần chuyển đều ghi log. Quản lý chỉ thấy phiếu của trung tâm mình và xem đủ số điện thoại, nhân viên chỉ thấy 4 số cuối. Backend Node.js/Express theo kiến trúc `routes → services → repositories` (kèm `validators`), cơ sở dữ liệu PostgreSQL, giao diện React + Vite.

## 2. Yêu cầu môi trường

- Node.js 20 trở lên (đã chạy trên Node 24)
- PostgreSQL 16 trở lên, đang chạy và có tài khoản `postgres` (cơ sở dữ liệu `baohanh_l2` được tạo ở bước 2 bên dưới)
- Hoặc chỉ cần Docker (xem mục 6)

## 3. Cài đặt và chạy (mỗi bước một lệnh)

1. Cài thư viện backend: `npm install`
2. Tạo cơ sở dữ liệu trống: `psql -U postgres -c "CREATE DATABASE baohanh_l2;"` (bỏ qua nếu đã có; nếu không có `psql`, tạo bằng pgAdmin với tên `baohanh_l2`)
3. Tạo file cấu hình: `copy .env.example .env` (Linux/macOS: `cp .env.example .env`), rồi mở `.env` sửa `DB_PASSWORD` thành mật khẩu PostgreSQL của bạn và `JWT_SECRET` thành chuỗi bí mật dài từ 32 ký tự
4. Tạo bảng: `npm run migrate`
5. Nạp dữ liệu mẫu: `npm run seed`
6. Cài thư viện giao diện: `npm install --prefix frontend`
7. Build giao diện: `npm run build --prefix frontend`
8. Chạy hệ thống: `npm start`

Mở http://localhost:8000 (cổng lấy từ `PORT` trong `.env`).

Chạy giao diện ở chế độ phát triển (tự tải lại): giữ `npm start` ở một cửa sổ, cửa sổ khác chạy `npm run dev --prefix frontend` rồi mở http://localhost:5173.

Tài khoản mẫu, mật khẩu chung `Demo@123`:

| Tên đăng nhập | Vai trò | Trung tâm |
| --- | --- | --- |
| `nv.tiepnhan01` | Nhân viên tiếp nhận | Ninh Kiều |
| `ql.ninhkieu` | Quản lý | Ninh Kiều |

Quản lý có thể tạo thêm tài khoản nhân viên ở menu "Tài khoản".

## 4. Chạy kiểm thử

Một lệnh: `npm test`

Bộ kiểm thử gồm ba loại: kiểm thử giá trị biên của hạn cam kết (`tests/deadline.test.js`), dữ liệu sai (`tests/ticket.invalid.test.js`) và luồng đúng (`tests/ticket.valid.test.js`). Kiểm thử dùng đối tượng giả thay cho cơ sở dữ liệu nên không cần PostgreSQL và không phụ thuộc dữ liệu trên máy.

## 5. Kiểm tra hệ thống đã chạy đúng

- `GET http://localhost:8000/health` trả `{"status":"ok","db":"ok"}`
- Đăng nhập bằng `nv.tiepnhan01` thấy danh sách 3 phiếu mẫu
- Chạy lại `npm run migrate` và `npm run seed` lần hai không báo lỗi và không nhân đôi dữ liệu

## 6. Chạy bằng Docker (tùy chọn)

Một lệnh: `docker compose up --build`, sau đó mở http://localhost:8000. Hệ thống tự tạo bảng và nạp dữ liệu mẫu khi khởi động. Có thể đặt `DB_PASSWORD` và `JWT_SECRET` trong môi trường để thay giá trị demo.

## 7. Cấu trúc

```
src/routes         nhận yêu cầu HTTP, trả mã trạng thái
src/services       nghiệp vụ (hạn cam kết, phân loại, vòng đời phiếu), không có req/res/SQL
src/repositories   toàn bộ truy vấn SQL, nhận db qua tham số
src/validators     kiểm tra dữ liệu đầu vào
migrations/ seeds/ cấu trúc bảng và dữ liệu mẫu
frontend/          giao diện React + Vite (gọi API qua frontend/src/api/client.js)
tests/             kiểm thử
docs/              SRS, API contract, thay đổi thiết kế, khai báo AI, kiến trúc thực tế
```

Thay đổi so với thiết kế Bài tập 1 nằm ở `docs/thay-doi-thiet-ke.md`.