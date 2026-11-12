# Tài nguyên báo cáo Word BT3

`bt2-cover-background.png` giữ phần khung và logo của trang bìa PDF BT2 do sinh viên cung cấp. Nội dung chữ và số trang gốc được loại khỏi lớp nền; các dòng chữ trên trang bìa được dựng lại dưới dạng văn bản chỉnh sửa được trong Word.

Hai bản bàn giao:

- `docs/BT3_2374802010270_TranVanLe.docx`: bản Word hiện đại, dùng để chỉnh sửa chính.
- `docs/BT3_2374802010270_TranVanLe.doc`: bản Word 97–2003 theo định dạng được yêu cầu.

Không tạo mục lục. Bìa giữ nguyên nội dung BT2 để sinh viên tự sửa; nội dung từ trang 2 là báo cáo BT3. Các trang bảng rộng và minh chứng dùng hướng ngang, các trang văn bản dùng hướng dọc. Số trang tự động nằm giữa chân trang.

Script tạo bản DOCX: `scripts/build-bt3-word.py`, cần python-docx và PyMuPDF. Có thể truyền đường dẫn PDF mẫu làm tham số. Bản DOC được chuyển đổi từ DOCX bằng LibreOffice; đã mở lại cả hai bản để kiểm tra bố cục, mỗi bản 23 trang tại môi trường kiểm tra. Số trang có thể thay đổi sau khi chỉnh nội dung hoặc đổi máy/phông chữ.
