# BT3 — Checklist bảo mật

Đánh giá ngày 12/11/2026; phạm vi prototype cục bộ. Không coi cấu hình demo là cấu hình triển khai công khai.

| Mục | Trạng thái | Minh chứng và giới hạn |
|---|---|---|
| 1. Không có secret thật trong repo | ĐÃ LÀM (phạm vi đã kiểm) | `.gitignore` loại `.env`; `git log --all -- .env` không có kết quả; `.env.example`, Compose và seed chỉ có giá trị demo công khai. Chưa chạy công cụ quét secret toàn lịch sử, không khẳng định đã quét mọi blob. |
| 2. Kiểm đầu vào ở ứng dụng | ĐÃ LÀM | `src/validators/`; TC-05/06 kiểm 2000/2001 ký tự và mô tả rỗng; TC-06/07 kiểm HTTP, code và message; PostgreSQL bổ sung ràng buộc. |
| 3. Kiểm quyền theo chủ sở hữu | CHƯA LÀM đầy đủ | `ticket.service.js` giới hạn phiếu theo trung tâm; TC-10 PASS cho list/detail. Khách/thiết bị dùng chung toàn hệ thống và cập nhật không kiểm quyền sở hữu theo trung tâm; không đánh đồng với quyền phiếu. |
| 4. Băm/mã hóa mật khẩu và dữ liệu nhạy cảm | CHƯA LÀM đầy đủ | `user.repository.js`, seed dùng pgcrypto `crypt`/bcrypt; không trả password_hash. Điện thoại/địa chỉ chưa mã hóa ở DB, HTTP demo chưa TLS; che điện thoại không phải mã hóa. |
| 5. Lỗi không lộ cấu trúc bên trong | ĐÃ LÀM | `src/routes/http-errors.js` trả thông báo chung khi lỗi lạ; 3 test `http-errors.test.js` PASS, gồm lỗi giả có nội dung thư viện. |
| 6. Nhật ký không ghi secret/PII không cần thiết | CHƯA LÀM đầy đủ | Không log header/token/password ở các lệnh log đã đọc; error handler còn ghi `err.message`, có thể chứa dữ liệu lỗi SQL; chưa có lọc/redaction tập trung. |
| 7. Ghim phụ thuộc và kiểm advisory | ĐÃ LÀM (npm) | `package-lock.json` và `frontend/package-lock.json`, Docker dùng `npm ci`; `npm audit --omit=dev` backend ngày 12/11/2026: 0 vulnerabilities. Chưa audit frontend trong lượt này, chưa ghim digest image Docker. |

Giới hạn bổ sung: JWT 8 giờ không thu hồi được; không rate limit; tài khoản demo công khai. Không dùng với dữ liệu khách thật trước khi xử lý các mục còn thiếu.
