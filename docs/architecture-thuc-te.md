# Kiến trúc thực tế — luồng L2

Sơ đồ này mô tả mã đã hiện thực trong repo, không phải kiến trúc dự kiến ở Bài tập 1. Giao diện và API được phục vụ cùng một ứng dụng Express khi đã build frontend; khi phát triển, Vite chạy riêng và proxy `/api` sang backend.

```mermaid
flowchart LR
    U["Nhân viên tiếp nhận<br/>Quản lý trung tâm"]

    subgraph FE["Frontend — React + Vite"]
        UI["Login<br/>Danh sách phiếu<br/>Tạo phiếu<br/>Chi tiết phiếu<br/>Quản lý tài khoản"]
        CLIENT["API client<br/>frontend/src/api/client.js"]
        UI --> CLIENT
    end

    subgraph APP["Backend — Node.js + Express"]
        HTTP["Express app<br/>JSON · xác thực JWT · xử lý lỗi"]
        ROUTES["Routes<br/>auth · customers · devices<br/>tickets · users · categories"]
        VALID["Validators"]
        SERVICES["Services<br/>auth · customer · device · ticket<br/>user · category"]
        DOMAIN["Nghiệp vụ thuần<br/>classifier.js · deadline.js"]
        REPOS["Repositories<br/>customer · device · ticket<br/>user · category"]

        HTTP --> ROUTES
        ROUTES --> VALID
        ROUTES --> SERVICES
        SERVICES --> DOMAIN
        SERVICES --> REPOS
    end

    DB[("PostgreSQL<br/>baohanh_l2")]
    MIG["Migrations + seeds"]
    TEST["Node test runner<br/>3 nhóm: luồng đúng · biên · dữ liệu sai"]

    U --> UI
    CLIENT -->|"JSON /api · Bearer JWT"| HTTP
    REPOS -->|"SQL qua pg Pool/client<br/>transaction khi tạo phiếu, đổi trạng thái"| DB
    MIG --> DB
    TEST -.-> SERVICES
    HTTP -.->|"phục vụ frontend/dist nếu đã build"| FE
```

## Luồng phụ thuộc

- Request nghiệp vụ đi từ giao diện qua API client, Express route, service, rồi repository đến PostgreSQL; kết quả đi ngược về client.
- Route chịu trách nhiệm HTTP. Service nhận dữ liệu và người dùng đã xác thực, thực hiện quy tắc nghiệp vụ, không nhận `req`/`res` và không chứa SQL. Repository nhận kết nối cơ sở dữ liệu qua tham số và thực hiện SQL.
- `classifier.js` và `deadline.js` là các hàm nghiệp vụ thuần được `ticket.service.js` gọi để phân loại sự cố và tính hạn cam kết.
- `authenticate` kiểm tra token trước các route cần đăng nhập. Service tiếp tục kiểm tra quyền quản lý và giới hạn trung tâm ở các thao tác tương ứng.
- Tạo phiếu và chuyển trạng thái dùng transaction để cập nhật phiếu cùng log trạng thái. Migrations tạo cấu trúc; seeds nạp dữ liệu mẫu có thể chạy lại.
- Unit tests chạy bằng `npm test` với repository giả, không cần kết nối PostgreSQL.

## Tệp triển khai chính

| Thành phần | Tệp/thư mục |
| --- | --- |
| Ứng dụng HTTP và ghép phụ thuộc | `src/app.js`, `src/server.js` |
| Giao diện | `frontend/src/pages/`, `frontend/src/components/` |
| API client | `frontend/src/api/client.js` |
| Routes | `src/routes/` |
| Services và quy tắc nghiệp vụ | `src/services/` |
| Repositories | `src/repositories/` |
| Kiểm tra đầu vào | `src/validators/` |
| Cấu trúc và dữ liệu mẫu | `migrations/`, `seeds/` |
| Kiểm thử | `tests/` |
