-- Seed 001: du lieu mau. Chay lai nhieu lan khong nhan doi du lieu.

INSERT INTO service_center (center_id, center_name, address) VALUES
    (1, 'Trung tam Ninh Kieu', '12 Nguyen Trai, Ninh Kieu, Can Tho'),
    (2, 'Trung tam Cai Rang', '45 Quang Trung, Cai Rang, Can Tho')
ON CONFLICT (center_id) DO NOTHING;

-- Id chen thu cong khong tang sequence, can dong bo de lan chen sau khong trung khoa
SELECT setval(pg_get_serial_sequence('service_center', 'center_id'),
              (SELECT MAX(center_id) FROM service_center));

INSERT INTO issue_category (category_id, category_name) VALUES
    (1, 'Màn hình'),
    (2, 'Pin'),
    (3, 'Sạc'),
    (4, 'Phần mềm'),
    (5, 'Nước vào'),
    (6, 'Khác')
ON CONFLICT (category_id) DO NOTHING;

-- Mat khau demo cua ca hai tai khoan: Demo@123 (chi dung de chay thu)
INSERT INTO app_user (username, password_hash, full_name, role, center_id) VALUES
    ('nv.tiepnhan01', crypt('Demo@123', gen_salt('bf')), 'Tran Van Le', 'NHAN_VIEN_TIEP_NHAN', 1),
    ('ql.ninhkieu', crypt('Demo@123', gen_salt('bf')), 'Nguyen Thi Hoa', 'QUAN_LY', 1)
ON CONFLICT (username) DO NOTHING;

INSERT INTO customer (full_name, phone, address) VALUES
    ('Nguyen Van An', '0909123456', '12 Nguyen Trai, Can Tho'),
    ('Le Thi Binh', '0912347788', '88 Hoa Binh, Can Tho'),
    ('Pham Quoc Cuong', '0933450021', '5 Tran Hung Dao, Can Tho')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO device (customer_id, serial_no, imei, product_name)
SELECT c.customer_id, v.serial_no, v.imei, v.product_name
FROM (VALUES
    ('0909123456', 'SN-A52-778901', '351234567890123', 'Galaxy A52'),
    ('0912347788', 'SN-IP12-550012', '352234567890124', 'iPhone 12'),
    ('0933450021', 'SN-RN11-330045', '353234567890125', 'Redmi Note 11')
) AS v(phone, serial_no, imei, product_name)
JOIN customer c ON c.phone = v.phone
ON CONFLICT (serial_no) DO NOTHING;

INSERT INTO ticket (ticket_code, customer_id, device_id, center_id, category_id,
                    issue_desc, priority, status, received_at, due_date)
SELECT v.ticket_code, c.customer_id, d.device_id, 1, v.category_id,
       v.issue_desc, v.priority, 'MOI',
       v.received_at::timestamptz, v.due_date::timestamptz
FROM (VALUES
    ('BH000001/2026', '0909123456', 'SN-A52-778901', 3,
     'May khong len nguon sau khi sac', 'CAO',
     '2026-10-19 09:00:00+07', '2026-10-20 09:00:00+07'),
    ('BH000002/2026', '0912347788', 'SN-IP12-550012', 1,
     'Man hinh bi soc doc, mat cam ung mot goc', 'TRUNG_BINH',
     '2026-10-19 10:30:00+07', '2026-10-22 10:30:00+07'),
    ('BH000003/2026', '0933450021', 'SN-RN11-330045', 2,
     'Pin tut nhanh, hao 30 phan tram moi gio', 'THAP',
     '2026-10-20 14:00:00+07', '2026-10-26 14:00:00+07')
) AS v(ticket_code, phone, serial_no, category_id, issue_desc, priority, received_at, due_date)
JOIN customer c ON c.phone = v.phone
JOIN device d ON d.serial_no = v.serial_no
ON CONFLICT (ticket_code) DO NOTHING;

-- Dong log dau tien (NULL -> MOI) cho moi phieu, chi them neu phieu chua co log
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by)
SELECT t.ticket_id, NULL, 'MOI', t.received_at, 'nv.tiepnhan01'
FROM ticket t
WHERE NOT EXISTS (
    SELECT 1 FROM ticket_status_log l WHERE l.ticket_id = t.ticket_id
);
