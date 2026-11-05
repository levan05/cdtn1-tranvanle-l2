# Bug Log — Checklist Buổi 14, luồng L2

Các lỗi dưới đây đã được sửa trước buổi workshop; mỗi lỗi trỏ tới một commit sửa riêng. Phân loại mức độ dựa trên ảnh hưởng tới khả năng tiếp nhận phiếu và khả năng phát hiện sự cố; không ghi bug giả để đủ số lượng.

## BUG-01 — Major: ID PostgreSQL BIGINT làm giao dịch tạo phiếu hợp lệ bị từ chối

1. **Mã và mức độ:** BUG-01 · Major.
2. **Phát hiện bởi:** Kiểm tra tương thích giữa kiểu ID PostgreSQL và dữ liệu số mà validator/service sử dụng.
3. **Triệu chứng:** PostgreSQL driver mặc định trả `BIGINT` dạng chuỗi; service so sánh `device.customer_id` với `customer_id` dạng số bằng so sánh nghiêm ngặt. Thiết bị đúng khách có thể bị báo không thuộc khách hàng, chặn luồng tạo phiếu cốt lõi.
4. **Cách tái lập trước khi sửa:** Tạo/lấy khách và thiết bị đã lưu trong PostgreSQL; gửi tạo phiếu với `customer_id` và `device_id` hợp lệ; API nhận ID số trong request nhưng repository trả `customer_id` kiểu chuỗi; phép so sánh không bằng nhau và phiếu không tạo được.
5. **Nguyên nhân:** `pg` không tự chuyển OID 20 (`int8`/`BIGINT`) thành số, trong khi validator chuẩn hóa ID đầu vào thành số.
6. **Cách sửa:** Đặt parser OID 20 trong `src/db.js` để trả ID dạng số; giới hạn hiện tại của hệ thống nằm trong miền số nguyên an toàn của JavaScript.
7. **Commit và xác nhận:** [af99f3b](https://github.com/levan05/cdtn1-tranvanle-l2/commit/af99f3b457b750af7ebefd9bd0da32fddaf9ff6e). Regression check ở TC-02 xác nhận parser trả kiểu `number`; `npm test` hiện tại PASS.

## BUG-02 — Minor: Lỗi mất PostgreSQL bị trả HTTP 500 chung

1. **Mã và mức độ:** BUG-02 · Minor.
2. **Phát hiện bởi:** Thử chạy API với cổng PostgreSQL không có dịch vụ lắng nghe.
3. **Triệu chứng:** API trả lỗi 500 `INTERNAL_ERROR` khi không kết nối được PostgreSQL, không phân biệt sự cố kết nối tạm thời với lỗi nội bộ khác; client/monitoring khó quyết định thử lại hoặc chẩn đoán.
4. **Cách tái lập trước khi sửa:** Tạm cấu hình `DB_PORT` tới cổng không hoạt động, gọi endpoint cần database; quan sát phản hồi 500 thay vì mã lỗi riêng cho dịch vụ database.
5. **Nguyên nhân:** Error handler chưa nhận diện mã lỗi kết nối của Node/PostgreSQL và SQLSTATE nhóm 08.
6. **Cách sửa:** Nhận diện các mã mất kết nối, ghi log phía server và trả 503 `DATABASE_UNAVAILABLE` với thông báo không lộ chi tiết driver.
7. **Commit và xác nhận:** [50c4b7d](https://github.com/levan05/cdtn1-tranvanle-l2/commit/50c4b7d9092a6ba5e7060bff1eeeb551f665ed73). `tests/http-errors.test.js` có kiểm thử ECONNREFUSED, AggregateError và lỗi nội bộ; hai test mất kết nối PASS.

## BUG-03 — Minor: Giao diện không phân biệt mất database với lỗi kết nối máy chủ

1. **Mã và mức độ:** BUG-03 · Minor.
2. **Phát hiện bởi:** Kiểm tra luồng phản hồi 503 từ API tới API client của giao diện.
3. **Triệu chứng:** Khi backend báo `DATABASE_UNAVAILABLE`, giao diện chỉ hiện thông báo chung “Không kết nối được máy chủ”, không giúp nhân viên biết đây là sự cố database.
4. **Cách tái lập trước khi sửa:** Cho backend trả 503 `DATABASE_UNAVAILABLE`; tải dữ liệu trên giao diện; quan sát thông báo lỗi chung, không nêu tình trạng cơ sở dữ liệu.
5. **Nguyên nhân:** API client xử lý mọi phản hồi 502/503/504 như cùng một loại lỗi kết nối.
6. **Cách sửa:** Đọc mã lỗi trong JSON của phản hồi 503; hiện thông báo riêng về cơ sở dữ liệu, vẫn giữ thông báo chung cho lỗi proxy/máy chủ.
7. **Commit và xác nhận:** [faeb474](https://github.com/levan05/cdtn1-tranvanle-l2/commit/faeb474bdc300d578d947c9553993d87ef14e59b). `npm run build --prefix frontend` đã chạy thành công khi xác minh thay đổi.
