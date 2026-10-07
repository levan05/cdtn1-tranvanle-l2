-- SQL DDL skeleton
-- Track: SE
-- Luồng: L2 - Tiếp nhận và phân loại yêu cầu bảo hành
-- PostgreSQL

CREATE TABLE service_center (
    center_id BIGSERIAL PRIMARY KEY,
    center_name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL
);

CREATE TABLE issue_category (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE customer (
    customer_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE device (
    device_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL
        REFERENCES customer(customer_id),
    serial_no VARCHAR(80) NOT NULL UNIQUE,
    imei VARCHAR(30),
    product_name VARCHAR(120) NOT NULL
);

CREATE TABLE ticket (
    ticket_id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL
        REFERENCES customer(customer_id),
    device_id BIGINT NOT NULL
        REFERENCES device(device_id),
    center_id BIGINT NOT NULL
        REFERENCES service_center(center_id),
    category_id INT
        REFERENCES issue_category(category_id),
    issue_desc TEXT NOT NULL
        CHECK (length(issue_desc) > 0),
    priority VARCHAR(12) NOT NULL
        CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status VARCHAR(20) NOT NULL DEFAULT 'MOI'
        CHECK (status IN (
            'MOI',
            'DA_PHAN_CONG',
            'DANG_XU_LY',
            'HOAN_TAT',
            'DA_DONG'
        )),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE ticket_status_log (
    log_id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL
        REFERENCES ticket(ticket_id),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL
        CHECK (to_status IN (
            'MOI',
            'DA_PHAN_CONG',
            'DANG_XU_LY',
            'HOAN_TAT',
            'DA_DONG'
        )),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by VARCHAR(120) NOT NULL
);

-- INDEX phục vụ tra cứu và danh sách phiếu
CREATE INDEX idx_customer_phone
    ON customer(phone);

CREATE INDEX idx_ticket_center_status_due
    ON ticket(center_id, status, due_date);

CREATE INDEX idx_ticket_status_due
    ON ticket(status, due_date);

CREATE INDEX idx_ticket_status_log
    ON ticket_status_log(ticket_id, changed_at);

-- Truy vết:
-- customer: FR1, FR5
-- device: FR2, FR6
-- issue_category: FR3
-- service_center: FR8
-- ticket: FR2, FR3, FR4, FR7, FR8
-- ticket_status_log: FR7
