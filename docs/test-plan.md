# BT3 — Test Plan rút gọn (L2, SE)

## 1. Phạm vi và giới hạn

Kiểm đăng nhập, tạo phiếu và log nguyên tử, phân loại/hạn cam kết, chuyển trạng thái một chiều, kiểm trung tâm sở hữu, thiết bị thuộc khách và migration/seed chạy lại. Dùng 12 case của buổi 14, giữ nguyên minh chứng gốc; xem [báo cáo BT3](test-report.md).

Chưa kiểm đầy đủ QT-01 (trùng điện thoại), QT-02 (chuẩn hóa), QT-05 (che điện thoại) và QT-07 (serial bắt buộc) bằng case chuyên biệt trong bộ 12 case. Đây là khoảng trống cần bổ sung trước khi kết luận mọi quy tắc được phủ. Không kiểm tải, pentest, gửi thông báo, phân công kỹ thuật viên thực, giao diện đa trình duyệt vì ngoài phạm vi module/prototype. Phép thử Docker máy trắng là kiểm tra đóng gói riêng, chưa PASS.

## 2. Loại test và số lượng

- `npm test`: 15 unit test (5 deadline, 3 error handler, 5 dữ liệu/trạng thái sai, 2 luồng đúng); repository giả, không tính là integration.
- Bộ báo cáo: 12 case, gồm 10 case gọi API Express/PostgreSQL thật (TC-01–03,05–11), 1 biên hàm nghiệp vụ (TC-04), 1 integration migration/seed (TC-12).
- TC-05 kiểm cả hai phía cùng ranh giới 2000/2001 ký tự. TC-06–08 kiểm dữ liệu sai; TC-10 kiểm quyền theo trung tâm; TC-12 kiểm tái lập.

## 3. Tiêu chí thành công đo được

15/15 unit và 12/12 case báo cáo PASS; hai test sai phải kiểm HTTP, mã lỗi, thông báo; mỗi quy tắc đã hiện thực có ít nhất một case đúng và truy vết được; không còn Critical mở; dựng bằng ≤2 lệnh, cả hai dịch vụ healthy, unit test trong container PASS. Chỉ kết luận hoàn tất khi tất cả tiêu chí đều có minh chứng. Kết quả buổi 14 không tự chứng minh Docker chạy được.

Truy vết hiện có: tạo phiếu/log → TC-02; QT-03 → TC-04 và unit deadline; QT-04 → TC-03/08; QT-06 → TC-10; quan hệ thiết bị/khách → TC-11; giới hạn mô tả → TC-05/06. Các khoảng trống ở mục 1 vẫn mở.

## 4. Môi trường và dữ liệu

Minh chứng cũ: Windows, Node 24.18.0, PostgreSQL 18, DB `baohanh_l2_thu`. Lượt unit BT3: Node 24.19.0. Docker dự kiến Node 20 Alpine/PostgreSQL 16 Alpine, chưa chạy tại máy này. Seed sạch: 2 trung tâm, 6 nhóm, 2 tài khoản, 3 khách/thiết bị/phiếu/log; DB cũ có thêm dữ liệu nên TC-12 so sánh trước/sau, không coi số dòng cũ là baseline sạch.

Chạy unit bằng `npm test`. Runner yêu cầu DB riêng có tên chứa `test`, `thu` hoặc `workshop` và `WORKSHOP_ALLOW_DB_WRITE=1`; sau migrate/seed chạy `node scripts/run-workshop-integration.js`. Runner tự dựng Express trên cổng ngẫu nhiên, dọn fixture theo ID, không reset dữ liệu thật. Tham khảo [kế hoạch gốc](test-plan-buoi14.md) và [deployment guide](deployment-guide.md).
