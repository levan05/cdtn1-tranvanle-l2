# Tổng kết Bài tập 3 — Luồng L2

**Sinh viên:** Trần Văn Lễ — **MSSV:** 2374802010270 — **Track:** SE.

Bài tập 3 tiếp tục hệ thống tiếp nhận và phân loại yêu cầu bảo hành đã thực hiện ở Bài tập 2. Phần bổ sung gồm kiểm thử quy tắc nghiệp vụ, ghi nhận lỗi và cách sửa, đóng gói bằng Docker và chuẩn bị tài liệu bàn giao.

## Kết quả kiểm thử

| Nội dung | Kết quả | Minh chứng |
|---|---|---|
| Unit test cho hạn cam kết, tạo phiếu, chuyển trạng thái và xử lý lỗi | 15/15 PASS | [Ảnh chạy Docker](packaging-evidence/screenshots/docker-unit-tests.png) |
| Bộ 12 case với Express và PostgreSQL thật | 12/12 PASS | [Test Report](test-report.md), [ảnh kết quả](packaging-evidence/screenshots/docker-integration-tests.png) |
| Chuẩn hóa/trùng số điện thoại, che số theo vai trò, serial bắt buộc | PASS trong TC-02 | [Ảnh TC-02](packaging-evidence/screenshots/TC-02-docker.png) |
| Quyền xem phiếu theo trung tâm của nhân viên và quản lý | PASS trong TC-10 | [Ảnh TC-10](packaging-evidence/screenshots/TC-10-docker.png) |
| Kiểm tra lại lỗi đã sửa | 3 phép kiểm tra trước/sau PASS | [Bug Log](bug-log.md), [output](bug-evidence/regressions.txt) |
| Nạp lại migration và dữ liệu mẫu | Không lỗi, không tăng số bản ghi | TC-12 trong bộ integration |
| Cảnh báo phụ thuộc backend | 0 vulnerabilities | `npm audit --omit=dev`, ngày 12/11/2026 |

## Kết quả đóng gói

Hệ thống được dựng từ bản xuất Git `ca4ce2a` trong thư mục mới, dùng project và volume Docker riêng. Hai bước dựng là sao chép `.env.example` thành `.env`, sau đó chạy Docker Compose để build và khởi động. Migration và seed được thực hiện tự động khi ứng dụng khởi động.

App và PostgreSQL đều ở trạng thái `healthy`; `/health` trả `{"status":"ok","db":"ok"}`. Giao diện mở được tại `http://localhost:8000`. Unit test và bộ 12 case integration đều PASS trong container. [Ảnh healthcheck](packaging-evidence/screenshots/docker-health.png), [ảnh giao diện](packaging-evidence/screenshots/frontend-login.png), [chi tiết môi trường](packaging-evidence/README.md).

## Bộ tài liệu bàn giao

- [Test Plan](test-plan.md) và [Test Report](test-report.md).
- [Bug Log](bug-log.md).
- [Deployment Guide](deployment-guide.md) và [API Documentation](api-docs.md), viết bằng tiếng Anh.
- [Checklist bảo mật](checklist-bao-mat.md), [khai báo AI](ai-disclosure.md) và [thay đổi thiết kế](thay-doi-thiet-ke.md).
- [Báo cáo tổng hợp](BT3_2374802010270_TranVanLe-review.html); PDF cùng tên nằm trong thư mục `docs/`.

## Những việc còn lại trước khi nộp

1. Bổ sung mã lớp và ngày nộp, kiểm tra bố cục PDF.
2. Tự chạy lại test và đọc Bug Log để giải thích dữ liệu vào, kết quả mong đợi và nguyên nhân lỗi. Phần AI hỗ trợ được khai báo riêng, không thay cho việc tự kiểm chứng.
3. Đưa các commit đã chọn lên GitHub và kiểm tra link commit trong Bug Log.
4. Phát hành tag `v1.0`, clone đúng tag vào thư mục trống rồi kiểm tra lại theo Deployment Guide. Lượt đóng gói hiện tại kiểm bản xuất Git local, chưa kiểm tag công khai.

Phạm vi hiện tại là prototype cục bộ. Những mục bảo mật còn thiếu được ghi trong checklist; hệ thống chưa được đánh giá để sử dụng với dữ liệu khách hàng thật.
