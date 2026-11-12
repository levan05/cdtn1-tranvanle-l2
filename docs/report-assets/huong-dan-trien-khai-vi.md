## 4.1. Yêu cầu môi trường

Hệ thống sử dụng bộ chứa Linux trên Docker Desktop kết hợp WSL2 ở Windows, Docker Desktop ở macOS hoặc Docker Engine ở Linux. Cấu hình dự kiến: Docker Engine từ 24, Compose từ 2.20, RAM 4 GB, dung lượng trống 5 GB và cổng 8000 chưa bị sử dụng. Lần dựng đầu cần Internet để tải ảnh nền. Node.js và PostgreSQL đã được cung cấp trong bộ chứa.

Môi trường đã kiểm ngày 12/11/2026: Windows 11, WSL 3.0.5, Docker Engine 29.9.3, Compose 5.7.0, Node.js 20.20.2 và PostgreSQL 16.15. Các phiên bản tối thiểu nêu trên là cấu hình dự kiến, chưa được kiểm trên mọi tổ hợp hệ điều hành.

## 4.2. Các bước dựng hệ thống

Sau khi tải mã nguồn và mở thư mục gốc của dự án, thực hiện hai lệnh:

```sh
cp .env.example .env
docker compose up -d --build
```

Docker tự dựng giao diện React. Khi khởi động, ứng dụng lần lượt tạo cấu trúc bảng, nạp dữ liệu mẫu rồi chạy Express. Chờ cả hai dịch vụ báo healthy, sau đó truy cập http://localhost:8000. Không cần chạy một tiến trình giao diện riêng.

## 4.3. Biến môi trường

| Biến | Ý nghĩa và giá trị mẫu | Yêu cầu |
|---|---|---|
| DB_HOST | Máy chủ PostgreSQL: localhost; trong Compose là db | Compose tự cấp |
| DB_PORT | Cổng PostgreSQL: 5432 | Compose tự cấp |
| DB_NAME | Tên CSDL: baohanh_l2 | Compose tự cấp |
| DB_USER | Tài khoản PostgreSQL: postgres | Compose tự cấp |
| DB_PASSWORD | Mật khẩu CSDL trong .env; mẫu doi_mat_khau_cua_ban | Khai báo trong .env; có giá trị demo dự phòng |
| JWT_SECRET | Khóa ký JWT; có giá trị mẫu trong .env.example | Bắt buộc; thay khóa khi dùng ngoài demo |
| PORT | Cổng ứng dụng: 8000 | Mặc định 8000, Compose gán cố định |
| NODE_ENV | Chế độ chạy: production | Được đặt trong ảnh Docker |
| WORKSHOP_ALLOW_DB_WRITE | Đặt bằng 1 để cho phép tạo dữ liệu thử | Chỉ cần khi chạy kiểm thử tích hợp |
| WORKSHOP_TEST_PASSWORD | Mật khẩu tài khoản thử; mặc định Demo@123 | Không bắt buộc |

Các giá trị mẫu và tài khoản có sẵn chỉ dùng để trình diễn. Prototype chưa có HTTPS, giới hạn tần suất yêu cầu hoặc cơ chế thu hồi JWT.

## 4.4. Dữ liệu mẫu

Trên CSDL trống, chương trình tạo 2 trung tâm, 6 nhóm sự cố, 2 tài khoản, 3 khách hàng, 3 thiết bị, 3 phiếu và 3 dòng nhật ký ban đầu. Nạp lại dữ liệu mẫu không xóa dữ liệu đang có và không tạo trùng các bản ghi mẫu. Phiếu mẫu có ngày nhận cố định trong tháng 10/2026 nên cảnh báo quá hạn phụ thuộc ngày chạy.

Hai tài khoản thử là nv.tiepnhan01 (nhân viên tiếp nhận) và ql.ninhkieu (quản lý), cùng mật khẩu Demo@123 và cùng trung tâm 1.

## 4.5. Kiểm tra kết quả và xử lý sự cố

```sh
docker compose ps
curl http://localhost:8000/health
docker compose exec app npm test
```

Kết quả mong đợi: app và db đều healthy; health trả HTTP 200 với {"status":"ok","db":"ok"}; bộ kiểm thử đơn vị đạt 15 PASS, 0 FAIL. Trên PowerShell có thể dùng curl.exe để tránh trùng bí danh lệnh.

Chạy 12 trường hợp kiểm thử tích hợp trên một CSDL riêng:

```sh
docker compose exec db createdb -U postgres baohanh_l2_test
docker compose exec -e DB_NAME=baohanh_l2_test app npm run migrate
docker compose exec -e DB_NAME=baohanh_l2_test app npm run seed
docker compose exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 app node scripts/run-workshop-integration.js
```

Kết quả mong đợi là SUMMARY 12/12 PASS, 0/12 FAIL. Đây là các lệnh xác minh sau khi khởi động, không cộng vào hai lệnh dựng hệ thống. Chỉ chạy createdb một lần cho CSDL mới; các lượt sau có thể dùng lại CSDL thử sau khi dữ liệu tạm đã được dọn.

Khi gặp lỗi, xem nhật ký bằng docker compose logs app db. Nếu cổng 8000 đã được dùng, cần giải phóng cổng. Nếu đổi mật khẩu trong .env nhưng volume đã có CSDL cũ, phải dùng lại mật khẩu của CSDL đó hoặc đặt lại riêng volume demo. Lệnh docker compose down dừng dịch vụ; thêm -v sẽ xóa dữ liệu trong volume của dự án.
