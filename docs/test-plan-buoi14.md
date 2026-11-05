# Test Plan rút gọn — Luồng L2

## 1. Phạm vi kiểm thử

Kiểm tra luồng tiếp nhận và phân loại yêu cầu bảo hành qua API và các quy tắc nghiệp vụ cốt lõi:

- Đăng nhập và xác thực JWT.
- Tạo phiếu, phân loại sự cố, tính hạn cam kết, lưu phiếu cùng log đầu.
- Chuyển trạng thái đúng thứ tự và từ chối nhảy cóc.
- Lọc phiếu theo trung tâm của người đăng nhập.
- Kiểm tra đầu vào, quan hệ khách hàng–thiết bị và tác dụng phụ khi thao tác thất bại.
- Khả năng chạy lại migration và seed.

Không kiểm thử trong phạm vi này: hiệu năng với dữ liệu lớn, khả năng chịu tải đồng thời, Docker/deployment, kiểm thử giao diện tự động và kiểm thử bảo mật chuyên sâu. Việc ghi rõ ngoài phạm vi không có nghĩa các nội dung này đã đạt.

## 2. Loại kiểm thử và số lượng

Dự kiến thực hiện 12 test case, gồm đủ năm loại theo checklist Buổi 14:

| Loại | Số lượng | Mã test |
|---|---:|---|
| Luồng đúng | 3 | TC-01–TC-03 |
| Giá trị biên | 2 | TC-04–TC-05 |
| Dữ liệu sai | 3 | TC-06–TC-08 |
| Bảo mật / chất lượng dữ liệu | 3 | TC-09–TC-11 |
| Tái lập | 1 | TC-12 |
| **Tổng** | **12** | |

### Danh sách test case dự kiến

| Mã | Ưu tiên | Mục tiêu | Kết quả mong đợi chính |
|---|---|---|---|
| TC-01 | Cao | Đăng nhập bằng tài khoản seed qua API Express | HTTP 200; JWT chứa đúng vai trò và trung tâm |
| TC-02 | Cao | Tạo phiếu hợp lệ qua API với PostgreSQL cục bộ | HTTP 201; phiếu và log đầu tồn tại trong DB, test dọn dữ liệu tạm sau khi xác minh |
| TC-03 | Cao | Chuyển phiếu sang đúng trạng thái kế tiếp qua API | HTTP 200; trạng thái đổi và log trong DB có đúng người thực hiện |
| TC-04 | Cao | Tính hạn CAO khi nhận sát cuối ngày Thứ Bảy | Hạn bỏ qua toàn bộ Chủ Nhật, đúng quy tắc QT-03 |
| TC-05 | Vừa | Mô tả lỗi có độ dài 2000 và 2001 ký tự qua API | 2000 được nhận; 2001 bị từ chối với lỗi validation |
| TC-06 | Cao | Tạo phiếu thiếu mô tả lỗi | HTTP 400, chỉ rõ `issue_desc`, không tạo phiếu/log |
| TC-07 | Cao | Tạo phiếu với khách hàng không tồn tại | HTTP 404 `CUSTOMER_NOT_FOUND`, không tạo phiếu/log |
| TC-08 | Cao | Nhảy cóc trạng thái từ MOI sang DANG_XU_LY | HTTP 409 `INVALID_TRANSITION`, không đổi trạng thái/ghi log |
| TC-09 | Cao | Gọi endpoint phiếu không có JWT | HTTP 401, không trả dữ liệu phiếu |
| TC-10 | Cao | Nhân viên trung tâm này truy cập phiếu thuộc trung tâm khác | Không đọc được phiếu ngoài trung tâm; truy vấn danh sách nhận center từ JWT |
| TC-11 | Cao | Tạo phiếu với thiết bị không thuộc khách hàng đã chọn | HTTP 400, không có bản ghi phiếu/log một phần |
| TC-12 | Vừa | Chạy migration và seed lần thứ hai | Không lỗi; số dòng dữ liệu seed không tăng |

Các kết quả trong bảng là kết quả mong đợi, không phải kết quả đã chạy. Chỉ chuyển từng test sang PASS/FAIL sau khi thực hiện và ghi bằng chứng.

## 3. Tiêu chí thành công

- Mỗi test case có tiền điều kiện, các bước, kết quả mong đợi và kết quả thực tế cụ thể.
- Chỉ đánh PASS khi kết quả thực tế khớp hoàn toàn; ghi mã HTTP, mã lỗi/thông báo và số bản ghi trước/sau nếu test có tác động dữ liệu.
- Test lỗi phải xác nhận không tạo hoặc sửa dữ liệu ngoài mong muốn.
- Có đủ 12 kết quả chạy thật, đủ năm loại test, ảnh chụp tương ứng trong `docs/screenshots/`.
- Sau các thay đổi sửa lỗi, chạy `npm test`; chỉ ghi đạt khi toàn bộ kiểm thử kết thúc với `fail 0`.
- Kết quả chưa chạy hoặc chưa có ảnh phải ghi rõ là chưa hoàn tất, không suy ra PASS từ việc code có vẻ đúng.

## 4. Môi trường và dữ liệu thử

- Hệ điều hành: Windows; Node.js phiên bản 20 trở lên; PostgreSQL 16 trở lên.
- Backend: Express tại `http://localhost:8000`; frontend đã build được phục vụ cùng backend.
- Bộ kiểm thử tự động hiện có: `npm test` (`node --test`).
- Dùng một cơ sở dữ liệu kiểm thử riêng, khởi tạo bằng `npm run migrate` và `npm run seed`; không dùng dữ liệu thật hoặc cơ sở dữ liệu đang vận hành để thử thao tác ghi/xóa. Runner tích hợp từ chối DB không có tên chứa `test`, `thu` hoặc `workshop` và chỉ cho phép ghi khi đặt `WORKSHOP_ALLOW_DB_WRITE=1`.
- Dữ liệu seed gồm hai trung tâm, hai tài khoản mẫu cùng trung tâm Ninh Kiều, ba khách, ba thiết bị và ba phiếu. TC-10 cần tạo dữ liệu thử riêng cho trung tâm khác và dọn theo đúng phạm vi cơ sở dữ liệu kiểm thử.
- Tài khoản mẫu chỉ dùng trên môi trường kiểm thử: `nv.tiepnhan01` và `ql.ninhkieu`; mật khẩu lấy từ seed demo. Không đưa thông tin bí mật thực tế vào báo cáo hoặc ảnh.
- Chạy từng test qua `node scripts/run-workshop-integration.js TC-01` … `TC-12`; chụp ảnh kết quả thật ngay sau mỗi lệnh và lưu theo mã test, ví dụ `docs/screenshots/TC-01.png`. Không dùng ảnh kết xuất từ output thay cho ảnh chụp terminal.
