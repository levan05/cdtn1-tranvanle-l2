-- Migration 002: nguoi dung he thong cho dang nhap co ban (them moi so voi BT1)
-- Mat khau luu dang bam bcrypt qua pgcrypto: kiem tra bang crypt(mat_khau, password_hash)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_user (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL
        CHECK (role IN ('NHAN_VIEN_TIEP_NHAN', 'QUAN_LY')),
    center_id BIGINT NOT NULL
        REFERENCES service_center(center_id)
);

CREATE INDEX IF NOT EXISTS idx_app_user_center
    ON app_user(center_id);
