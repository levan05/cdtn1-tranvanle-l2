# Khai báo sử dụng công cụ AI

Sinh viên: Trần Văn Lễ · MSSV: 2374802010270 · Track: SE · Luồng: L2 (Tiếp nhận và phân loại yêu cầu bảo hành)

## Bài tập 2: Hiện thực hoá module cốt lõi

Em dùng trợ lý lập trình AI (Claude, qua GitHub Copilot CLI) để viết phần lớn mã nguồn và tài liệu của Bài tập 2. Em chọn yêu cầu, đọc kết quả, tự chạy và thao tác thử trên hệ thống, rồi quyết định giữ hay sửa. Em tự quyết các điểm sau: phiếu nhận vào Chủ Nhật thì tính hạn từ 00:00 Thứ Hai; chỉ Quản lý được tạo tài khoản nhân viên cho trung tâm của mình; làm từng commit nhỏ, mỗi commit một việc.

| Công cụ | Dùng vào việc gì | Áp dụng ở tệp / hàm nào | Em đã kiểm chứng thế nào |
| --- | --- | --- | --- |
| Claude (Copilot CLI) | Viết hàm tính hạn cam kết (CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ, chỉ bỏ Chủ Nhật) | `src/services/deadline.js`, `tests/deadline.test.js` | Tự chạy `npm test`; viết thêm kiểm thử giá trị biên (đúng 24 giờ, qua Chủ Nhật, nhận vào Chủ Nhật) và đối chiếu với quy tắc QT-03 trong SRS |
| Claude (Copilot CLI) | Phân loại nhóm sự cố và mức ưu tiên theo từ khoá | `src/services/classifier.js` | Chạy thử các câu mô tả thật qua API; thấy câu "den man hinh, khong len nguon" ra mức CAO, khác ví dụ ở API contract nên đã ghi vào `docs/thay-doi-thiet-ke.md` (TĐ6) |
| Claude (Copilot CLI) | Tạo phiếu, sinh mã phiếu, chuyển trạng thái một chiều kèm log, danh sách và lọc theo trung tâm | `src/services/ticket.service.js`, `src/repositories/ticket.repository.js`, `src/routes/ticket.routes.js` | Chạy backend với PostgreSQL thật, gọi API tạo phiếu và chuyển trạng thái, xem bảng `ticket` và `ticket_status_log` trong pgAdmin; thử chuyển sai thứ tự và nhận lỗi 409; khi thử lọc theo nhóm sự cố gặp lỗi 500 do dùng sai cột, đã sửa sang lọc theo `category_id` |
| Claude (Copilot CLI) | CRUD khách hàng và thiết bị, đăng nhập JWT, phân quyền, che số điện thoại | `src/services/customer.service.js`, `src/services/device.service.js`, `src/services/auth.service.js`, `src/middleware/auth.js` | Đăng nhập bằng hai tài khoản mẫu, kiểm tra nhân viên chỉ thấy 4 số cuối còn Quản lý thấy đủ; gọi API bằng token sai và không có token |
| Claude (Copilot CLI) | Chức năng quản lý tài khoản | `src/services/user.service.js`, `src/repositories/user.repository.js`, `src/validators/user.validator.js` | Tạo tài khoản thử, đăng nhập bằng tài khoản mới, thử trùng tên (409), dữ liệu sai (400), gọi bằng tài khoản nhân viên (403); xoá tài khoản thử sau khi kiểm tra |
| Claude (Copilot CLI) | Migration và dữ liệu mẫu chạy lại được | `migrations/`, `seeds/`, `scripts/run-sql.js` | Chạy `npm run migrate` và `npm run seed` nhiều lần, đếm số dòng trong các bảng, không lỗi và không nhân đôi |
| Claude (Copilot CLI) | Bộ kiểm thử ba loại (luồng đúng, giá trị biên, dữ liệu sai) | `tests/` | Chạy `npm test`, 12 kiểm thử PASS; kiểm thử dùng đối tượng giả nên không cần PostgreSQL |
| Claude (Copilot CLI) | Giao diện React + Vite: đăng nhập, danh sách phiếu, tạo phiếu, chi tiết phiếu, quản lý tài khoản; lớp gọi API; ba trạng thái | `frontend/src/` | Chạy backend và giao diện, thao tác trên trình duyệt: lọc ra rỗng, tắt backend để thấy lỗi kết nối kèm nút thử lại, tạo phiếu cho số điện thoại mới rồi đối chiếu dữ liệu trong pgAdmin |
| Claude (Copilot CLI) | Dockerfile và docker-compose.yml | `Dockerfile`, `docker-compose.yml` | Chưa kiểm chứng: máy em chưa cài Docker nên chưa chạy thử; em không coi đây là phần đã được xác nhận |
| Claude (Copilot CLI) | Soạn README, sơ đồ kiến trúc thực tế, cập nhật API contract, ghi thay đổi thiết kế | `README.md`, `docs/architecture-thuc-te.md`, `docs/api-contract.md`, `docs/thay-doi-thiet-ke.md` | Đối chiếu với mã nguồn và kết quả chạy thật; các sai lệch so với Bài tập 1 đã ghi từ TĐ1 đến TĐ6 |

Em xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.

## Bài tập 1: Phân tích và thiết kế

Em dùng Claude để hỗ trợ ở các phần sau:

1. Chọn luồng nghiệp vụ. Em nhờ Claude giải thích case study và so sánh ba luồng L2, L4, L5 để chọn. Em đọc lại mục 7 của case study và tự trả lời các câu hỏi kiểm tra về luồng L2 để chắc là mình hiểu.
2. Phạm vi một câu (mục 2 của phiếu phạm vi). Em tự trả lời các câu hỏi dẫn dắt và tự ghép câu, Claude chỉ sửa lỗi chính tả và cách dùng từ.
3. User Story, tiêu chí Given-When-Then, yêu cầu chức năng, phi chức năng và bảng truy vết trong SRS. Claude soạn bản nháp, em đối chiếu lại với mô tả luồng L2, bảng các bên liên quan ở mục 2.2 và bảng quy tắc nghiệp vụ ở mục 9 của case study. Sau khi đọc, em đã gộp US8 vào US2 để còn 7 story cho đúng yêu cầu 5 đến 7.
4. Use Case Diagram và đặc tả UC2. Claude viết mã PlantUML và soạn đặc tả. Em dán vào PlantText và draw.io rồi lưu file .drawio vào repo.
5. Công nghệ dự kiến. Claude gợi ý Node.js, Express, PostgreSQL, Prisma, React. Em đối chiếu với bảng công nghệ gợi ý trong tài liệu tự học buổi 1 của track SE.
6. API contract, sơ đồ kiến trúc, ERD, SQL DDL và wireframe. Claude soạn bản nháp, em đối chiếu với SRS.
7. Tạo repo. Claude hướng dẫn các lệnh Git, cấu trúc thư mục, nội dung .gitignore và .env.example. Em tự gõ lệnh, tự kiểm tra bằng git status và xem lại kết quả trên GitHub.

Phần em tự làm ở Bài tập 1: đọc case study, tự chọn luồng L2, tự ghép câu phạm vi, tự gõ lệnh Git và đưa các file vào repo.

Ghi chú: commit của em dùng email cá nhân, không phải email trường.

Trần Văn Lễ, 2374802010270