# BT3 — Checklist bảo mật

Đánh giá ngày 12/11/2026; phạm vi prototype cục bộ. Không coi cấu hình demo là cấu hình triển khai công khai.

| Mục | Trạng thái | Minh chứng và giới hạn |
|---|---|---|
| 1. Không có secret thật trong repo | ĐÃ LÀM | `.gitignore` loại `.env`; `git log --all -- .env` không có kết quả; `.env.example`, Compose và seed chỉ có giá trị demo công khai. Phạm vi kiểm tra là tệp cấu hình và lịch sử `.env`; chưa dùng công cụ quét secret toàn lịch sử. |
| 2. Kiểm đầu vào ở ứng dụng | ĐÃ LÀM | `src/validators/`; TC-05/06 kiểm 2000/2001 ký tự và mô tả rỗng; TC-06/07 kiểm HTTP, code và message; PostgreSQL bổ sung ràng buộc. |
| 3. Kiểm quyền theo chủ sở hữu | CHƯA LÀM | Phiếu đã giới hạn theo trung tâm ở `ticket.service.js`; TC-10 PASS cho nhân viên và quản lý. Khách/thiết bị là danh mục dùng chung, cập nhật chưa giới hạn theo trung tâm. |
| 4. Băm/mã hóa mật khẩu và dữ liệu nhạy cảm | CHƯA LÀM | Mật khẩu đã băm bằng pgcrypto `crypt`/bcrypt ở `user.repository.js` và seed; API không trả password_hash. Điện thoại/địa chỉ chưa mã hóa tại DB, HTTP demo chưa TLS. |
| 5. Lỗi không lộ cấu trúc bên trong | ĐÃ LÀM | `src/routes/http-errors.js` trả thông báo chung khi lỗi lạ; 3 test `http-errors.test.js` PASS, gồm lỗi giả có nội dung thư viện. |
| 6. Nhật ký không ghi secret/PII không cần thiết | CHƯA LÀM | Các lệnh log đã kiểm không ghi header/token/password; error handler còn ghi `err.message`, có thể chứa dữ liệu lỗi SQL; chưa có bộ lọc dữ liệu nhạy cảm tập trung. |
| 7. Ghim phụ thuộc và kiểm advisory | ĐÃ LÀM | Có `package-lock.json` và `frontend/package-lock.json`, Docker cài bằng `npm ci`; audit backend ngày 12/11/2026: 0 vulnerabilities. Chưa ghim digest image Docker; kết quả audit là tại thời điểm kiểm. |

Giới hạn bổ sung: JWT 8 giờ không thu hồi được; không rate limit; tài khoản demo công khai. Không dùng với dữ liệu khách thật trước khi xử lý các mục còn thiếu.
