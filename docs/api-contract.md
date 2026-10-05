API contract luồng L2 - Tiếp nhận và phân loại yêu cầu bảo hành



Sinh viên : Trần Văn Lễ, MSSV : 2374802010270  , track SE



Đây là bản nháp đầu tiên, có thể sẽ chỉnh sửa lại khi code thực tế ở BT2.





1\. GET /api/customers



Để tra cứu khách theo số điện thoại



Ví dụ gọi: GET /api/customers?phone=0901234567



Nếu có thì trả về:

{

&#x20; "customer\_id": 5,

&#x20; "full\_name": "Nguyen Van A",

&#x20; "phone": "0901234567",

&#x20; "address": "123 Le Loi, Q1"

}



Nếu không tìm thấy thì trả về lỗi 404.



Liên quan tới FR1, US1, UC1.





2\. POST /api/customers



Dùng khi số điện thoại chưa có trong hệ thống, tạo khách mới



Gửi lên:

{

&#x20; "full\_name": "Nguyen Van B",

&#x20; "phone": "0907654321"

}



Trả về 201 nếu tạo thành công:

{

&#x20; "customer\_id": 6,

&#x20; "full\_name": "Nguyen Van B",

&#x20; "phone": "0907654321"

}



Nếu số điện thoại đã tồn tại rồi thì trả lỗi 409.

Nếu thiếu tên hoặc số điện thoại thì trả lỗi 400.



Liên quan FR5, US7, UC3.





3\. POST /api/tickets



Đây là cái chính, dùng để tạo phiếu bảo hành mới



Gửi lên:

{

&#x20; "customer\_id": 5,

&#x20; "device\_id": 12,

&#x20; "issue\_desc": "May bi den man hinh, khong len nguon"

}



Hệ thống sẽ tự động gán nhóm sự cố, mức ưu tiên và tính hạn cam kết, trả về kiểu như:

{

&#x20; "ticket\_id": 101,

&#x20; "ticket\_code": "BH000101/2026",

&#x20; "status": "MOI",

&#x20; "category": "MAN\_HINH",

&#x20; "priority": "TRUNG\_BINH",

&#x20; "due\_date": "2026-10-04T09:00:00Z"

}



Nếu issue\_desc rỗng thì lỗi 400, nếu customer\_id hoặc device\_id không tồn tại thì lỗi 404.



Liên quan FR2, FR3, FR4, US2, US3, UC2.





4\. POST /api/devices



Cho trường hợp thiết bị không có trong lịch sử mua hàng, phải nhập tay



Gửi lên:

{

&#x20; "customer\_id": 5,

&#x20; "serial\_no": "IMEI123456789",

&#x20; "product\_name": "iPhone 13"

}



Trả về 201:

{

&#x20; "device\_id": 20,

&#x20; "serial\_no": "IMEI123456789"

}



Thiếu số serial thì báo lỗi 400.



Liên quan FR6, US8, UC5.





5\. PATCH /api/tickets/{id}/status



Để cập nhật trạng thái phiếu



Ví dụ: PATCH /api/tickets/101/status

{

&#x20; "to\_status": "DA\_PHAN\_CONG"

}



Trả về:

{

&#x20; "ticket\_id": 101,

&#x20; "status": "DA\_PHAN\_CONG"

}



Nếu chuyển trạng thái sai thứ tự (ví dụ đang đóng mà đổi về mới) thì trả lỗi 409.



Liên quan FR2, US6, UC6.





6\. GET /api/tickets



Để xem danh sách phiếu, lọc theo trạng thái



Ví dụ: GET /api/tickets?status=MOI\&sort=due\_date



Trả về:

{

&#x20; "total": 15,

&#x20; "tickets": \[

&#x20;   {

&#x20;     "ticket\_id": 101,

&#x20;     "ticket\_code": "BH000101/2026",

&#x20;     "status": "MOI",

&#x20;     "due\_date": "2026-10-04T09:00:00Z"

&#x20;   }

&#x20; ]

}



Liên quan FR2, US5, UC7.





Một số quy tắc chung em nghĩ cần áp dụng:

\- số điện thoại phải đúng 10 số, bắt đầu bằng 0 (theo QT-02)

\- mô tả lỗi không được để trống

\- số serial phải nhập khi tạo thiết bị thủ công, và phải là duy nhất

\- chuyển trạng thái phải đúng thứ tự vòng đời, không cho chuyển ngược (QT-06)



Phần này em chưa chắc sẽ giữ nguyên hết khi code thật, có thể sẽ phải sửa lại một vài chỗ cho hợp lí hơn

