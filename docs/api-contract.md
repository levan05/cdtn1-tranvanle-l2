API contract luồng L2 - Tiếp nhận và phân loại yêu cầu bảo hành





Sinh viên : Trần Văn Lễ, MSSV : 2374802010270, Track SE





Đây là bản nháp đầu tiên, có thể sẽ chỉnh sửa lại khi code thực tế ở BT2.





1\. DANH SÁCH ENDPOINT





GET /api/customers?phone={phone}



Tra cứu khách hàng theo số điện thoại.



Liên quan FR1, US1, UC1.





POST /api/customers



Tạo khách hàng mới khi số điện thoại chưa tồn tại.



Liên quan FR5, US7, UC3.





GET /api/customers/{id}/devices



Lấy danh sách thiết bị đã có của khách hàng để chọn khi tạo phiếu.



Liên quan FR2, US2, UC2.





POST /api/devices



Nhập thông tin thiết bị thủ công khi thiết bị không có trong lịch sử mua hàng.



Liên quan FR6, US2, UC5.





POST /api/tickets



Tạo phiếu bảo hành mới, hệ thống tự phân loại nhóm sự cố, xác định mức ưu tiên và sinh hạn cam kết.



Liên quan FR2, FR3, FR4, US2, US3, UC2, UC4.





PATCH /api/tickets/{id}/status



Cập nhật trạng thái phiếu theo đúng vòng đời.



Liên quan FR7, US6, UC6.





GET /api/tickets?status={status}\&sort={sort}



Xem danh sách phiếu theo trạng thái và hạn cam kết.



Liên quan FR8, US5, UC7.





2\. QUY ƯỚC CHUNG





Định dạng trao đổi: JSON, mã hóa UTF-8.



Tên trường dùng snake\_case và khớp với tên cột trong mô hình dữ liệu.



Thời gian dùng chuẩn ISO 8601 kèm múi giờ, ví dụ 2026-10-07T14:30:00+07:00.



Phân trang: tham số page bắt đầu từ 1 và size, mặc định 20, tối đa 100.



Mọi lỗi trả về cùng một cấu trúc:



{

&#x20; "error": {

&#x20;   "code": "...",

&#x20;   "message": "...",

&#x20;   "fields": {}

&#x20; }

}





3\. CHI TIẾT ENDPOINT





3.1. GET /api/customers?phone={phone}





Mục đích: Tra cứu khách hàng theo số điện thoại.





Ví dụ gọi:



GET /api/customers?phone=0901234567





Nếu tìm thấy:



{

&#x20; "customer\_id": 5,

&#x20; "full\_name": "Nguyen Van A",

&#x20; "phone": "0901234567",

&#x20; "address": "123 Le Loi, Q1"

}





Nếu không tìm thấy:



404 Not Found



{

&#x20; "error": {

&#x20;   "code": "CUSTOMER\_NOT\_FOUND",

&#x20;   "message": "Khong tim thay khach hang",

&#x20;   "fields": {}

&#x20; }

}





Liên quan FR1, US1, UC1.





3.2. POST /api/customers





Mục đích: Tạo khách hàng mới khi số điện thoại chưa tồn tại.





REQUEST BODY



{

&#x20; "full\_name": "Nguyen Van B",

&#x20; "phone": "0907654321"

}





RESPONSE 201 Created



{

&#x20; "customer\_id": 6,

&#x20; "full\_name": "Nguyen Van B",

&#x20; "phone": "0907654321"

}





Nếu dữ liệu không hợp lệ:



400 Bad Request





Nếu số điện thoại đã tồn tại:



409 Conflict





Liên quan FR5, US7, UC3.





3.3. GET /api/customers/{id}/devices





Mục đích: Lấy danh sách thiết bị đã có của khách hàng.





Ví dụ gọi:



GET /api/customers/5/devices





RESPONSE 200 OK



{

&#x20; "customer\_id": 5,

&#x20; "devices": \[

&#x20;   {

&#x20;     "device\_id": 12,

&#x20;     "serial\_no": "IMEI123456789",

&#x20;     "product\_name": "iPhone 13"

&#x20;   }

&#x20; ]

}





Nếu customer\_id không tồn tại:



404 Not Found





Liên quan FR2, US2, UC2.





3.4. POST /api/devices





Mục đích: Nhập thiết bị thủ công khi thiết bị không có trong lịch sử mua hàng.





REQUEST BODY



{

&#x20; "customer\_id": 5,

&#x20; "serial\_no": "IMEI123456789",

&#x20; "product\_name": "iPhone 13"

}





RESPONSE 201 Created



{

&#x20; "device\_id": 20,

&#x20; "serial\_no": "IMEI123456789",

&#x20; "product\_name": "iPhone 13"

}





Nếu thiếu số serial:



400 Bad Request





Nếu serial đã tồn tại:



409 Conflict





Liên quan FR6, US2, UC5.





3.5. POST /api/tickets





Mục đích: Tạo phiếu bảo hành mới.





REQUEST BODY



{

&#x20; "customer\_id": 5,

&#x20; "device\_id": 12,

&#x20; "issue\_desc": "May bi den man hinh, khong len nguon"

}





RESPONSE 201 Created



{

&#x20; "ticket\_id": 101,

&#x20; "ticket\_code": "BH000101/2026",

&#x20; "status": "MOI",

&#x20; "category": "MAN\_HINH",

&#x20; "priority": "TRUNG\_BINH",

&#x20; "received\_at": "2026-10-07T09:00:00+07:00",

&#x20; "due\_date": "2026-10-10T09:00:00+07:00"

}





Nếu issue\_desc rỗng:



400 Bad Request





Nếu customer\_id hoặc device\_id không tồn tại:



404 Not Found





Liên quan FR2, FR3, FR4, US2, US3, UC2, UC4.





3.6. PATCH /api/tickets/{id}/status





Mục đích: Cập nhật trạng thái phiếu theo đúng vòng đời.





Ví dụ:



PATCH /api/tickets/101/status





REQUEST BODY



{

&#x20; "to\_status": "DA\_PHAN\_CONG"

}





RESPONSE 200 OK



{

&#x20; "ticket\_id": 101,

&#x20; "status": "DA\_PHAN\_CONG"

}





Nếu phiếu không tồn tại:



404 Not Found





Nếu chuyển sai thứ tự hoặc chuyển ngược trạng thái:



409 Conflict





Liên quan FR7, US6, UC6.





3.7. GET /api/tickets?status={status}\&sort={sort}





Mục đích: Xem danh sách phiếu theo trạng thái và hạn cam kết.





Ví dụ:



GET /api/tickets?status=MOI\&sort=due\_date





RESPONSE 200 OK



{

&#x20; "total": 15,

&#x20; "tickets": \[

&#x20;   {

&#x20;     "ticket\_id": 101,

&#x20;     "ticket\_code": "BH000101/2026",

&#x20;     "status": "MOI",

&#x20;     "due\_date": "2026-10-10T09:00:00+07:00"

&#x20;   }

&#x20; ]

}





Liên quan FR8, US5, UC7.





4\. BẢNG VALIDATION





POST /api/customers



full\_name: bắt buộc, chuỗi, không để trống.



phone: bắt buộc, chuỗi 10 chữ số bắt đầu bằng 0 theo QT-02, không trùng theo QT-01.





POST /api/devices



customer\_id: bắt buộc, số nguyên dương, phải tồn tại.



serial\_no: bắt buộc, chuỗi, không để trống, phải duy nhất.



product\_name: bắt buộc, chuỗi, không để trống.





POST /api/tickets



customer\_id: bắt buộc, số nguyên dương, phải tồn tại.



device\_id: bắt buộc, số nguyên dương, phải tồn tại.



issue\_desc: bắt buộc, chuỗi, không để trống.



priority: hệ thống tự xác định, thuộc CAO / TRUNG\_BINH / THAP.



status: khi tạo mới mặc định là MOI.





PATCH /api/tickets/{id}/status



to\_status: bắt buộc, thuộc các trạng thái MOI / DA\_PHAN\_CONG / DANG\_XU\_LY / HOAN\_TAT / DA\_DONG.



Chỉ được chuyển theo đúng thứ tự vòng đời theo QT-04.





5\. QUY TẮC LIÊN QUAN





Số điện thoại khách hàng là duy nhất trong hệ thống theo QT-01.



Số điện thoại được chuẩn hóa về dạng 10 chữ số bắt đầu bằng 0 theo QT-02.



Hạn cam kết được sinh tự động theo mức ưu tiên theo QT-03.



Phiếu chỉ được chuyển trạng thái theo đúng vòng đời và phải ghi log theo QT-04.



Nhân viên tiếp nhận chỉ thấy số điện thoại dạng che theo QT-05.



Quản lý trung tâm chỉ xem được phiếu của trung tâm mình phụ trách theo QT-06.



Thiết bị nhập thủ công bắt buộc có số serial theo QT-07.

