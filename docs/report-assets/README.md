# Tài nguyên báo cáo Word BT3

`bt2-cover-background.png` giữ phần khung và logo của trang bìa PDF BT2 do sinh viên cung cấp. Nội dung chữ và số trang gốc được loại khỏi lớp nền; các dòng chữ trên trang bìa được dựng lại dưới dạng văn bản chỉnh sửa được trong Word.

Bản Word được chỉnh sửa riêng; các bản Word cũ đã được gỡ khỏi repo. [Báo cáo BT3 PDF](../BT3_2374802010270_TranVanLe.pdf) được lưu trong `docs/`. Thư mục này giữ tài nguyên và nội dung đầu vào cho script tạo báo cáo.

Script tạo bản nháp khổ A4 dọc (21 × 29,7 cm), lề 2 cm, số trang tự động nằm giữa chân trang. Bảng và ảnh được giới hạn trong chiều rộng vùng nội dung. Bìa và mục lục được hoàn thiện trong bản báo cáo riêng.

Nội dung báo cáo trình bày bằng tiếng Việt theo yêu cầu của sinh viên; tên API, trường JSON, mã lỗi, lệnh và chữ trong ảnh thật được giữ nguyên để đối chiếu. Bản Deployment Guide và API docs tiếng Anh theo yêu cầu đề BT3 vẫn có trong repo.

Script tạo DOCX: `scripts/build-bt3-word.py`, cần python-docx và PyMuPDF; phần trình bày API tiếng Việt ở `scripts/report_api_vi.py`. Có thể truyền đường dẫn PDF mẫu làm tham số. Bản DOC được chuyển đổi từ DOCX bằng LibreOffice. Các tệp `huong-dan-trien-khai-vi.md` và `api-mo-ta-vi.json` cung cấp nội dung tiếng Việt cho bản Word; ví dụ API vẫn lấy trực tiếp từ `docs/api-examples.json`. Số trang có thể thay đổi sau khi chỉnh nội dung hoặc đổi máy/phông chữ.
