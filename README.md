# Tiếp nhận và phân loại yêu cầu bảo hành (luồng L2, Mekong Mobile)

Sinh viên: Trần Văn Lễ, MSSV 2374802010270, track SE, lớp 71K29CNTT11. Học phần Chuyên đề Tốt nghiệp 1, Bài tập 3 — Kiểm thử và Đóng gói prototype, tiếp tục hệ thống của Bài tập 2.

## 1. Mô tả

Hệ thống giúp nhân viên tiếp nhận của Mekong Mobile ghi nhận yêu cầu bảo hành: tra cứu khách theo số điện thoại, chọn thiết bị, tự phân loại nhóm sự cố, mức ưu tiên và sinh hạn cam kết (CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ, không tính Chủ Nhật). Phiếu đi một chiều MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT, DA_DONG và mỗi lần chuyển đều ghi log. Quản lý chỉ thấy phiếu của trung tâm mình và xem đủ số điện thoại, nhân viên chỉ thấy 4 số cuối. Backend Node.js/Express theo kiến trúc `routes → services → repositories` (kèm `validators`), cơ sở dữ liệu PostgreSQL, giao diện React + Vite.

## 2. Tải mã nguồn và chạy bằng Docker (BT3)

Yêu cầu: cài và bật Docker Desktop (Windows dùng WSL2, chế độ Linux containers; macOS dùng Docker Desktop) hoặc Docker Engine trên Linux, kèm Docker Compose. Cấu hình mục tiêu: Engine 24+, Compose 2.20+, RAM 4 GB, dung lượng trống 5 GB; cổng 8000 còn trống. Lần build đầu cần Internet. Không cần cài Node.js hoặc PostgreSQL trên máy nếu chạy bằng Docker.

Tải mã nguồn bằng **Code → Download ZIP** trên GitHub rồi giải nén, hoặc clone repo:

```sh
git clone https://github.com/levan05/cdtn1-tranvanle-l2.git
```

Mở terminal tại thư mục vừa tải, nơi có `docker-compose.yml`. Chạy đúng **hai lệnh** sau trong PowerShell, bash hoặc zsh:

```sh
cp .env.example .env
docker compose up -d --build
```

Trong Windows Command Prompt (cmd), thay lệnh đầu bằng `copy .env.example .env`. Chỉ sao chép cấu hình khi chưa có `.env`; giữ lại cấu hình đang dùng nếu khởi động lại dự án.

Docker tự cài thư viện, build giao diện React, khởi động PostgreSQL, chạy migration/seed rồi khởi động Express. Chờ cả `app` và `db` báo `healthy` (xem mục 5), sau đó mở **http://localhost:8000**. Các giá trị trong `.env.example` dùng được cho demo Docker cục bộ; Compose tự đặt địa chỉ DB thành `db`. Thay mật khẩu và khóa JWT trước khi dùng ngoài môi trường demo.

Hướng dẫn bàn giao bằng tiếng Anh: [Deployment Guide](docs/deployment-guide.md). Khi tag `v1.0` được phát hành, tải source tại [Release v1.0](https://github.com/levan05/cdtn1-tranvanle-l2/releases/tag/v1.0) để dùng đúng phiên bản nộp BT3; hiện chưa phát hành tag này.

## 3. Chạy trực tiếp bằng Node.js (tùy chọn)

Cần Node.js 20+ và PostgreSQL 16+ đang chạy. Các bước dưới đây là phương án cài trực tiếp để phát triển, độc lập với hai lệnh Docker ở mục 2.

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

Sau khi hệ thống Docker đã khởi động, chạy unit test bằng một lệnh:

```sh
docker compose exec app npm test
```

Kết quả mong đợi: **15 test PASS, 0 FAIL**. Bộ test gồm giá trị biên hạn cam kết, dữ liệu sai, luồng đúng và xử lý lỗi HTTP; dùng đối tượng giả thay cho DB. Nếu cài trực tiếp bằng Node.js, dùng `npm test`.

Bộ **12 case integration** dùng PostgreSQL thật cần DB thử riêng. Tạo DB một lần, sau đó migrate/seed và chạy bộ test:

```sh
docker compose exec db createdb -U postgres baohanh_l2_test
docker compose exec -e DB_NAME=baohanh_l2_test app npm run migrate
docker compose exec -e DB_NAME=baohanh_l2_test app npm run seed
docker compose exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 app node scripts/run-workshop-integration.js
```

Kết quả mong đợi: `SUMMARY 12/12 PASS, 0/12 FAIL`. Các lần chạy sau bỏ lệnh `createdb` nếu DB thử đã tồn tại. Chạy riêng một case bằng cách thêm mã như `TC-02` vào cuối lệnh cuối. Chỉ chạy integration trên DB thử; runner ghi dữ liệu fixture và dọn theo ID. Các lệnh này dùng để kiểm chứng sau khi khởi động, không phải bước dựng hệ thống.

## 5. Kiểm tra hệ thống đã chạy đúng

- Chạy `docker compose ps`: cả `app` và `db` báo `healthy`.
- Mở http://localhost:8000/health: nhận `{"status":"ok","db":"ok"}`. Có thể kiểm bằng `curl http://localhost:8000/health` (PowerShell dùng `curl.exe`).
- Mở http://localhost:8000, đăng nhập bằng tài khoản mẫu ở mục 3. Trên DB mới có 3 phiếu mẫu; seed chạy lại giữ dữ liệu hiện có.
- Chạy lại `docker compose exec app npm run migrate` rồi `docker compose exec app npm run seed`: không lỗi và không nhân đôi dữ liệu mẫu.

## 6. Dừng và xử lý sự cố Docker

- Xem nhật ký khi chưa lên được: `docker compose logs app db`.
- Docker không kết nối được: bật Docker Desktop và chờ engine sẵn sàng; Windows chọn Linux containers.
- Cổng 8000 bị chiếm: dừng ứng dụng đang dùng cổng đó rồi khởi động lại.
- Lỗi mật khẩu DB sau khi sửa `.env`: volume cũ vẫn giữ mật khẩu ban đầu. Dùng lại mật khẩu của DB đã tạo.
- Dừng hệ thống, giữ dữ liệu: `docker compose down`. Khởi động lại bằng `docker compose up -d --build`, không cần chép lại `.env`.
- Chỉ khi muốn xóa toàn bộ dữ liệu demo của dự án: `docker compose down -v`, rồi khởi động lại. Tùy chọn `-v` xóa volume PostgreSQL của project, bao gồm dữ liệu đã nhập.

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
# Bài tập 3 — tài liệu bàn giao

[Test Plan](docs/test-plan.md) · [Test Report 8 cột](docs/test-report.md) · [Bug Log](docs/bug-log.md) · [Deployment Guide (English)](docs/deployment-guide.md) · [Checklist bảo mật](docs/checklist-bao-mat.md) · [API docs (English)](docs/api-docs.md) · [Khai báo AI](docs/ai-disclosure.md).

Minh chứng ngày 12/11/2026: unit 15/15, integration PostgreSQL 12/12, 21 exchange API thật, audit backend 0 advisory. Đã dựng bản xuất Git sạch `ca4ce2a` bằng Docker: app/db healthy, unit 15/15 và integration 12/12 PASS; xem [minh chứng](docs/packaging-evidence/README.md). Các kết quả này thuộc lần kiểm đã lưu, không thay cho kết quả chạy trên máy người nhận. Tag `v1.0` chưa phát hành và chưa có phép thử clone public tag; sẽ kiểm lại đúng tag sau khi phát hành.
