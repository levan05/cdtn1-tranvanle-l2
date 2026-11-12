# Tiếp nhận và phân loại yêu cầu bảo hành (luồng L2, Mekong Mobile)

Sinh viên: Trần Văn Lễ, MSSV 2374802010270, track SE, lớp 71K29CNTT11. Học phần Chuyên đề Tốt nghiệp 1, Bài tập 3 — Kiểm thử và Đóng gói prototype, tiếp tục hệ thống của Bài tập 2.

## 1. Mô tả

Hệ thống giúp nhân viên tiếp nhận của Mekong Mobile ghi nhận yêu cầu bảo hành: tra cứu khách theo số điện thoại, chọn thiết bị, tự phân loại nhóm sự cố, mức ưu tiên và sinh hạn cam kết (CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ, không tính Chủ Nhật). Phiếu đi một chiều MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT, DA_DONG và mỗi lần chuyển đều ghi log. Quản lý chỉ thấy phiếu của trung tâm mình và xem đủ số điện thoại, nhân viên chỉ thấy 4 số cuối. Backend Node.js/Express theo kiến trúc `routes → services → repositories` (kèm `validators`), cơ sở dữ liệu PostgreSQL, giao diện React + Vite.

## 2. Chạy bằng Docker (BT3)

Cần Docker Desktop đang chạy (Windows dùng WSL2 và Linux containers), hoặc Docker Engine kèm Compose trên Linux. Cổng 8000 phải trống; lần build đầu cần Internet. Không cần cài riêng Node.js hoặc PostgreSQL.

### Chạy lần đầu

1. Tải [source v1.0](https://github.com/levan05/cdtn1-tranvanle-l2/archive/refs/tags/v1.0.zip) và giải nén.
2. Mở thư mục chứa `docker-compose.yml`. Trên Windows, bấm thanh địa chỉ, gõ `powershell`, nhấn Enter.
3. Chạy hai lệnh:

```sh
cp .env.example .env
docker compose up -d --build
```

Nếu đã có `.env`, giữ nguyên và bỏ lệnh sao chép. Trong Command Prompt dùng `copy` thay cho `cp`. Cấu hình mẫu dùng cho demo cục bộ.

Docker tự build web, tạo database, bảng và dữ liệu mẫu. Kiểm tra sau khi build xong:

```sh
docker compose ps
```

Chờ cả `app` và `db` báo `healthy`, rồi mở http://localhost:8000. Nếu còn `health: starting`, chờ vài giây rồi kiểm tra lại.

Đăng nhập: `nv.tiepnhan01` / `Demo@123`.

### Bật và tắt những lần sau

Trong Docker Desktop:

1. Chọn **Containers**, mở rộng nhóm dự án (thường là `cdtn1-tranvanle-l2-10` nếu giữ tên thư mục ZIP).
2. Bấm **Start** ở `db-1`, chờ healthy, rồi bấm **Start** ở `app-1`.
3. Khi app healthy, mở http://localhost:8000.
4. Bấm **Stop** ở cả nhóm để dừng. Dữ liệu vẫn được giữ.

Hoặc dùng terminal tại thư mục dự án:

```sh
docker compose up -d
```

Dừng bằng `docker compose stop`. Không cần chép lại `.env` hay build lại khi source không đổi.

Hướng dẫn chi tiết bằng tiếng Anh: [Deployment Guide](docs/deployment-guide.md).

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

## 6. Xử lý sự cố Docker

| Trường hợp | Cách xử lý |
| --- | --- |
| Không kết nối được Docker | Bật Docker Desktop, chờ engine sẵn sàng. |
| Cổng 8000 bị chiếm | Dùng `docker ps --filter publish=8000` để tìm container cũ, rồi `docker stop TEN_CONTAINER` nếu không cần chạy nó. |
| App không xuất hiện trong danh sách đang chạy | Xem `docker compose ps -a` và `docker compose logs app`. |
| App báo `EAI_AGAIN db` sau lỗi trùng cổng | Giải phóng cổng, chạy `docker compose up -d --force-recreate app`, rồi kiểm tra lại trạng thái. |
| DB báo sai mật khẩu sau khi sửa `.env` | Dùng lại mật khẩu ban đầu của DB; volume cũ vẫn giữ mật khẩu đó. |

Dừng và gỡ container nhưng giữ dữ liệu: `docker compose down`. Chạy `docker compose up -d` để tạo lại. Chỉ dùng `docker compose down -v` khi muốn xóa toàn bộ dữ liệu demo trong volume của dự án.

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

Minh chứng ngày 12/11/2026: unit 15/15, integration PostgreSQL 12/12, 21 exchange API thật, audit backend 0 advisory. Đã dựng bản xuất Git sạch `ca4ce2a` bằng Docker; xem [minh chứng](docs/packaging-evidence/README.md). Sau đó đã clone tag công khai `v1.0` (commit `553aa65`) vào thư mục mới, dùng project/volume riêng: app/db healthy, web và JS/CSS trả HTTP 200, unit 15/15, integration 12/12 và chạy riêng TC-02 đều PASS; migration/seed chạy lại không tăng số dòng. Lượt này sử dụng cache Docker trên máy, chưa kiểm trên máy khác. Các kết quả này thuộc lần kiểm đã lưu, không thay cho kết quả chạy trên máy người nhận.
