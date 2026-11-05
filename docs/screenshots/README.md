# Ảnh chụp kiểm thử Buổi 14

Thư mục này có đủ 12 ảnh chụp terminal thật: `TC-01.png` … `TC-12.png`, tương ứng 12 test case trong [`../test-report-buoi14.md`](../test-report-buoi14.md). Mỗi ảnh chụp bằng `Win+Shift+S` trực tiếp từ cửa sổ PowerShell đang chạy lệnh, không phải ảnh dựng từ output hay chỉnh sửa lại. Ảnh TC-01–TC-09 chụp liên tục trong một phiên; TC-10–TC-12 chụp tiếp trong phiên kế, cùng cách chạy.

Để tái lập hoặc chụp lại khi có thay đổi, mở PowerShell tại thư mục gốc repo, xác nhận `.env` đang dùng đúng cơ sở dữ liệu kiểm thử riêng (tên chứa `test`/`thu`/`workshop`), rồi chạy:

```powershell
$env:DB_NAME='baohanh_l2_thu'
$env:WORKSHOP_ALLOW_DB_WRITE='1'
node scripts\run-workshop-integration.js TC-01
```

Lặp lại với `TC-02` đến `TC-12` **trong cùng một cửa sổ PowerShell** (hai biến môi trường trên không giữ lại nếu mở cửa sổ/tab mới), lưu đè ảnh lần lượt thành `TC-01.png` … `TC-12.png` trong thư mục này. Mỗi lệnh chỉ chạy đúng test case được chọn; runner tự dọn dữ liệu tạm sau test có ghi dữ liệu. Không đưa mật khẩu, token hoặc dữ liệu cá nhân thật vào ảnh.
