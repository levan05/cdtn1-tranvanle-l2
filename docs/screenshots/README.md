# Ảnh chụp kiểm thử Buổi 14

Thư mục này hiện chưa có ảnh chụp terminal thật. Không coi output dạng text hay ảnh kết xuất từ output là ảnh minh chứng.

Mở PowerShell tại thư mục gốc repo, xác nhận `.env` đang dùng đúng cơ sở dữ liệu kiểm thử riêng, rồi chạy:

```powershell
$env:DB_NAME='baohanh_l2_thu'
$env:WORKSHOP_ALLOW_DB_WRITE='1'
node scripts\run-workshop-integration.js TC-01
```

Chụp cửa sổ terminal hiển thị lệnh và kết quả `PASS` bằng `Win+Shift+S`. Lặp lại với `TC-02` đến `TC-12`, lưu ảnh lần lượt thành `TC-01.png` … `TC-12.png` trong thư mục này. Mỗi lệnh chỉ chạy test case được chọn; runner dọn dữ liệu tạm sau test có ghi dữ liệu. Không đưa mật khẩu, token hoặc dữ liệu cá nhân vào ảnh.
