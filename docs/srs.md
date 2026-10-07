SRS rút gọn luồng L2 Tiếp nhận và phân loại yêu cầu bảo hành

&#x20;

Sinh viên : Trần Văn Lễ MSSV:  2374802010270  Track SE

Học phần : Chuyên đề Tốt nghiệp 1 HK1 2026 2027

&#x20;

&#x20;

1\. GIỚI THIỆU VÀ PHẠM VI

&#x20;

Mekong Mobile hiện tiếp nhận yêu cầu bảo hành bằng giấy, không theo dõi được trạng thái và hạn cam kết, mô tả lỗi ghi tự do nên không phân loại được. Luồng L2 giải quyết vấn đề này bằng cách nhân viên tiếp nhận tra cứu khách theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, hệ thống tự phân loại nhóm sự cố, mức ưu tiên và sinh hạn cam kết, theo dõi trạng thái phiếu đến khi đóng.

&#x20;

Em chủ ý không làm phần phân công kỹ thuật viên cụ thể vì thuộc luồng L4, không làm quản lý tồn kho linh kiện vì thuộc luồng L5. Đây là mức WON'T.

&#x20;

Bảng thuật ngữ em dùng trong tài liệu này.

Khách hàng là người đã mua hoặc đang dùng dịch vụ của Mekong Mobile.

Thiết bị là máy cụ thể của khách, xác định bằng số serial hoặc IMEI.

Phiếu bảo hành là một yêu cầu bảo hành, có mã riêng và vòng đời trạng thái.

Nhóm sự cố là phân loại nguyên nhân lỗi, gồm màn hình, pin, sạc, phần mềm, nước vào, khác.

Hạn cam kết là thời điểm chậm nhất phải xử lý xong phiếu.

Trung tâm là điểm tiếp nhận và bảo hành của Mekong Mobile.

Trạng thái phiếu là trạng thái hiện tại của phiếu trong quá trình xử lý.

&#x20;

&#x20;

2\. CÁC BÊN LIÊN QUAN VÀ VAI TRÒ

&#x20;

Nhân viên tiếp nhận tra cứu khách, tạo phiếu, cập nhật thông tin phiếu. Không được xem số điện thoại đầy đủ của khách, chỉ thấy dạng che theo quy tắc QT-05.

&#x20;

Quản lý trung tâm xem toàn bộ phiếu của trung tâm mình phụ trách, xem báo cáo quá hạn. Không được xem phiếu của trung tâm khác, theo quy tắc QT-06.

&#x20;

&#x20;

3\. YÊU CẦU CHỨC NĂNG VÀ USER STORY

&#x20;

Các yêu cầu chức năng.

&#x20;

FR1 Hệ thống cho phép nhân viên tiếp nhận tra cứu khách hàng theo số điện thoại và hiển thị thông tin nếu đã tồn tại.

FR2 Hệ thống cho phép nhân viên tiếp nhận tạo phiếu bảo hành mới với các trường bắt buộc là khách hàng, thiết bị, mô tả lỗi.

FR3 Hệ thống tự động phân loại nhóm sự cố và đề xuất mức ưu tiên dựa trên mô tả lỗi.

FR4 Hệ thống tự động sinh hạn cam kết theo mức ưu tiên, cụ thể CAO là 24 giờ, TRUNG BÌNH là 72 giờ, THẤP là 120 giờ, chỉ tính ngày làm việc.

FR5 Hệ thống cho phép tạo hồ sơ khách hàng mới khi số điện thoại chưa tồn tại.

FR6 Hệ thống cho phép nhập thông tin thiết bị thủ công kèm số serial khi thiết bị không có trong lịch sử mua hàng.

FR7 Hệ thống cho phép nhân viên tiếp nhận cập nhật trạng thái phiếu theo đúng vòng đời và ghi lại lịch sử mỗi lần chuyển trạng thái.

FR8 Hệ thống cho phép quản lý trung tâm xem danh sách phiếu theo trạng thái và hạn cam kết của trung tâm mình phụ trách.

&#x20;

User Story.

&#x20;

US1 mức MUST. Là nhân viên tiếp nhận, tôi muốn tra cứu khách hàng theo số điện thoại để không phải hỏi lại thông tin khách đã có sẵn.

&#x20;

US2 mức MUST. Là nhân viên tiếp nhận, tôi muốn tạo phiếu bảo hành mới với thông tin thiết bị và mô tả lỗi, kể cả khi thiết bị không có trong lịch sử mua hàng của khách, để vẫn tiếp nhận được các trường hợp khách mua ở nơi khác hoặc không có hóa đơn.

&#x20;

US3 mức MUST. Là nhân viên tiếp nhận, tôi muốn hệ thống tự sinh hạn cam kết theo mức ưu tiên để không phải tính tay.

&#x20;

US4 mức SHOULD. Là nhân viên tiếp nhận, tôi muốn hệ thống gợi ý nhóm sự cố dựa trên mô tả lỗi để phân loại nhất quán hơn.

&#x20;

US5 mức SHOULD. Là quản lý trung tâm, tôi muốn xem danh sách phiếu theo trạng thái để biết phiếu nào sắp quá hạn.

&#x20;

US6 mức MUST. Là nhân viên tiếp nhận, tôi muốn cập nhật trạng thái phiếu theo đúng vòng đời để mọi người biết phiếu đang ở bước nào.

&#x20;

US7 mức MUST. Là nhân viên tiếp nhận, tôi muốn tạo hồ sơ khách hàng mới ngay khi số điện thoại chưa tồn tại để không phải dừng quy trình tiếp nhận lại giữa chừng.

&#x20;

Tiêu chí chấp nhận Given When Then cho các story.

&#x20;

US1.

Giả sử số điện thoại đã có trong hệ thống, khi nhân viên nhập số này vào ô tìm khách, thì hệ thống tự điền tên, địa chỉ và lịch sử mua hàng của khách đó.

Giả sử số điện thoại chưa có trong hệ thống, khi nhân viên nhập số này, thì hệ thống báo khách mới và chuyển sang US7.

&#x20;

US2.

Giả sử đã có thông tin khách và thiết bị, khi nhân viên nhập mô tả lỗi và bấm Lưu, thì hệ thống sinh mã phiếu và lưu ở trạng thái MỚI.

Trường hợp ngoại lệ, giả sử nhân viên chưa nhập mô tả lỗi, khi bấm Lưu, thì hệ thống từ chối lưu và hiện thông báo nêu rõ trường còn thiếu.

Giả sử thiết bị không có trong lịch sử mua hàng của khách, khi nhân viên chọn nhập thiết bị thủ công, thì hệ thống bắt buộc nhập số serial trước khi cho lưu phiếu.

&#x20;

US3.

Giả sử phiếu đã được gán mức ưu tiên CAO, khi phiếu được tạo, thì hệ thống tự động tính hạn cam kết là 24 giờ làm việc kể từ lúc tiếp nhận.

Trường hợp ngoại lệ, giả sử ngày tiếp nhận là Chủ Nhật, khi tính hạn cam kết, thì hệ thống chỉ tính ngày làm việc từ Thứ Hai đến Thứ Bảy, không tính Chủ Nhật.

&#x20;

US4.

Giả sử mô tả lỗi có chứa từ liên quan đến màn hình, khi hệ thống phân tích mô tả lỗi, thì hệ thống đề xuất nhóm sự cố là Màn hình.

&#x20;

US5.

Giả sử có phiếu sắp đến hạn cam kết trong 24 giờ tới, khi quản lý mở danh sách phiếu, thì hệ thống hiển thị phiếu đó ở đầu danh sách kèm cảnh báo sắp quá hạn.

&#x20;

US6.

Giả sử phiếu đang ở trạng thái MỚI, khi nhân viên chuyển sang ĐÃ PHÂN CÔNG, thì hệ thống ghi lại lịch sử chuyển trạng thái kèm thời điểm và người thực hiện.

Trường hợp ngoại lệ, giả sử phiếu đang ở trạng thái ĐÃ ĐÓNG, khi có ai cố gắng chuyển ngược về trạng thái trước đó, thì hệ thống từ chối và báo phải tạo phiếu mới liên kết tới phiếu cũ.

&#x20;

US7.

Giả sử số điện thoại chưa tồn tại, khi nhân viên xác nhận tạo khách mới, thì hệ thống lưu hồ sơ khách với số điện thoại đã chuẩn hóa về dạng 0xxxxxxxxx.

Trường hợp ngoại lệ, giả sử nhân viên nhập số điện thoại dạng 84xxxxxxxxx, khi lưu, thì hệ thống tự chuẩn hóa về dạng 0xxxxxxxxx trước khi lưu.

&#x20;

&#x20;

4\. YÊU CẦU PHI CHỨC NĂNG

&#x20;

NFR1 về hiệu năng. Danh sách phiếu bảo hành hiển thị dưới 2 giây với 1000 bản ghi, trên máy 8GB RAM.

&#x20;

NFR2 về bảo mật. Chỉ vai trò Quản lý xem được số điện thoại đầy đủ của khách, nhân viên tiếp nhận chỉ thấy dạng che, chỉ hiển thị 4 số cuối, theo quy tắc QT-05.

&#x20;

NFR3 về khả dụng. Nhân viên tiếp nhận mới tạo được một phiếu bảo hành đúng trong dưới 3 phút, không cần hỏi đồng nghiệp.

&#x20;

&#x20;

5\. RÀNG BUỘC VÀ QUY TẮC NGHIỆP VỤ

&#x20;

QT-01. Số điện thoại khách hàng là duy nhất trong hệ thống. Nhập số đã tồn tại thì hiện hồ sơ có sẵn thay vì tạo mới.

&#x20;

QT-02. Số điện thoại được chuẩn hóa về dạng 10 chữ số bắt đầu bằng 0 trước khi lưu.

&#x20;

QT-03. Hạn cam kết sinh tự động theo mức ưu tiên, CAO là 24 giờ, TRUNG BÌNH là 72 giờ, THẤP là 120 giờ, chỉ tính ngày làm việc từ Thứ Hai đến Thứ Bảy.

&#x20;

QT-04. Phiếu chỉ được chuyển trạng thái theo đúng vòng đời, không được quay lại trạng thái trước. Mỗi lần chuyển phải ghi log gồm thời điểm và người thực hiện.

&#x20;

QT-05. Nhân viên tiếp nhận chỉ thấy số điện thoại khách dạng che, chỉ hiển thị 4 số cuối; chỉ vai trò Quản lý được xem số điện thoại đầy đủ.

&#x20;

QT-06. Quản lý trung tâm chỉ xem được phiếu của trung tâm mình phụ trách, không xem phiếu của trung tâm khác.

&#x20;

QT-07. Thiết bị nhập thủ công không có trong lịch sử mua hàng của khách bắt buộc có số serial trước khi lưu phiếu.

&#x20;

&#x20;

6\. BẢNG TRUY VẾT YÊU CẦU

&#x20;

FR1 tra cứu khách theo số điện thoại, liên quan User Story US1, Use Case UC1, mức MUST.

&#x20;

FR2 tạo phiếu bảo hành mới, liên quan User Story US2, Use Case UC2, mức MUST.

&#x20;

FR3 phân loại nhóm sự cố và ưu tiên, liên quan User Story US4, Use Case UC4, mức SHOULD.

&#x20;

FR4 sinh hạn cam kết tự động, liên quan User Story US3, Use Case UC2, mức MUST.

&#x20;

FR5 tạo khách hàng mới khi chưa tồn tại, liên quan User Story US7, Use Case UC3, mức MUST.

&#x20;

FR6 nhập thiết bị thủ công khi không có lịch sử mua, liên quan User Story US2, Use Case UC5, mức MUST.

&#x20;

FR7 cập nhật trạng thái phiếu và ghi log, liên quan User Story US6, Use Case UC6, mức MUST.

&#x20;

FR8 xem danh sách phiếu theo trạng thái và hạn cam kết, liên quan User Story US5, Use Case UC7, mức SHOULD.

&#x20;

&#x20;

&#x20;

&#x20;

7\. ĐẶC TẢ USE CASE: UC2 - TẠO PHIẾU BẢO HÀNH MỚI

&#x20;

Actor chính: Nhân viên tiếp nhận

Mục tiêu: Ghi nhận một yêu cầu bảo hành vào hệ thống để theo dõi đến khi đóng.

Điều kiện trước: Nhân viên đã đăng nhập và có quyền tiếp nhận.

Điều kiện sau: Một phiếu bảo hành ở trạng thái MỚI đã được lưu, có mã phiếu duy nhất.

Liên quan: US1, US2, US3. Mức ưu tiên: MUST.

&#x20;

Luồng chính.

1\. Nhân viên chọn chức năng Tạo phiếu bảo hành mới.

2\. Nhân viên nhập số điện thoại khách hàng.

3\. Hệ thống tra cứu và hiển thị thông tin khách (dùng UC1).

4\. Nhân viên chọn thiết bị từ danh sách thiết bị khách đã mua.

5\. Nhân viên nhập mô tả lỗi.

6\. Hệ thống đề xuất nhóm sự cố và mức ưu tiên (dùng UC4).

7\. Hệ thống tự tính hạn cam kết theo mức ưu tiên.

8\. Nhân viên xác nhận, bấm Lưu.

9\. Hệ thống sinh mã phiếu, lưu phiếu ở trạng thái MỚI.

&#x20;

Luồng ngoại lệ.

3a. Khách hàng chưa tồn tại trong hệ thống.

Hệ thống mở form tạo khách mới với số điện thoại đã điền sẵn (dùng UC3).

Sau khi lưu khách mới, quay lại bước 4.

&#x20;

4a. Thiết bị không nằm trong lịch sử mua hàng của khách.

Cho phép nhập thiết bị ngoài, bắt buộc nhập số serial (dùng UC5).

&#x20;

5a. Mô tả lỗi để trống.

Hệ thống từ chối lưu, hiện thông báo nêu rõ trường còn thiếu.

