# Sơ đồ kiến trúc thực tế

Sơ đồ dưới đây mô tả cách các phần của chương trình đang kết nối với nhau.

```mermaid
flowchart LR
    U["Nhân viên tiếp nhận<br/>Quản lý"]

    subgraph FE["Frontend — React + Vite"]
        UI["Các màn hình<br/>Đăng nhập · Danh sách phiếu<br/>Tạo phiếu · Chi tiết phiếu<br/>Tài khoản"]
        CLIENT["API client<br/>frontend/src/api/client.js"]
        UI --> CLIENT
    end

    subgraph APP["Backend — Node.js + Express"]
        HTTP["Express app<br/>Nhận request · kiểm tra đăng nhập"]
        ROUTES["Routes<br/>auth · customers · devices<br/>tickets · users · categories"]
        VALID["Validators"]
        SERVICES["Services<br/>auth · customer · device · ticket<br/>user · category"]
        DOMAIN["Phân loại sự cố<br/>Tính hạn cam kết"]
        REPOS["Repositories<br/>customer · device · ticket<br/>user · category"]

        HTTP --> ROUTES
        ROUTES --> VALID
        ROUTES --> SERVICES
        SERVICES --> DOMAIN
        SERVICES --> REPOS
    end

    DB[("PostgreSQL<br/>baohanh_l2")]
    MIG["Migrations + seeds"]
    TEST["Kiểm thử<br/>Luồng đúng · giá trị biên · dữ liệu sai"]

    U --> UI
    CLIENT -->|"JSON /api · Bearer JWT"| HTTP
    REPOS -->|"Truy vấn SQL<br/>Dùng transaction khi cần"| DB
    MIG --> DB
    TEST -.-> SERVICES
    HTTP -.->|"Chạy chung với giao diện đã build"| FE
```

## Cách chương trình hoạt động

- Khi người dùng thao tác, giao diện gửi yêu cầu qua API client. Backend nhận yêu cầu ở route, kiểm tra dữ liệu, xử lý trong service rồi repository đọc hoặc ghi PostgreSQL.
- Các quy tắc phân loại sự cố và tính hạn cam kết nằm trong `src/services/classifier.js` và `src/services/deadline.js`.
- Route xử lý phần HTTP; service xử lý nghiệp vụ; repository chứa câu lệnh SQL. Nhờ tách như vậy, service có thể kiểm thử bằng repository giả mà không cần kết nối database.
- Khi tạo phiếu hoặc đổi trạng thái, hệ thống ghi phiếu và lịch sử trong cùng transaction để tránh lưu dở một phần.
- Migrations tạo bảng, seeds thêm dữ liệu mẫu. Có thể chạy lại các lệnh này theo hướng dẫn trong README.
- Khi build frontend, Express có thể phục vụ cả giao diện lẫn API. Lúc phát triển, Vite chạy riêng và chuyển các yêu cầu `/api` sang backend.

## Tệp triển khai chính

| Thành phần | Tệp/thư mục |
| --- | --- |
| Ghép các phần backend và khởi động máy chủ | `src/app.js`, `src/server.js` |
| Các màn hình và thành phần giao diện | `frontend/src/pages/`, `frontend/src/components/` |
| API client | `frontend/src/api/client.js` |
| Routes | `src/routes/` |
| Services và quy tắc nghiệp vụ | `src/services/` |
| Repositories | `src/repositories/` |
| Kiểm tra đầu vào | `src/validators/` |
| Cấu trúc và dữ liệu mẫu | `migrations/`, `seeds/` |
| Kiểm thử | `tests/` |
