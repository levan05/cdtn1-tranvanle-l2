# API Documentation - L2 warranty intake

Base URL: http://localhost:8000. JSON requests/responses. Protected endpoints use `Authorization: Bearer <token>`. Common errors: 401 UNAUTHENTICATED for absent/invalid JWT; 503 DATABASE_UNAVAILABLE for database connection failure; 500 INTERNAL_ERROR for unknown failures. Error shape: `{ "error": { "code": "...", "message": "...", "fields": {} } }`.

Examples below were captured from Express/PostgreSQL on 2026-11-12T06:01:09.855Z using v24.19.0; see [raw exchanges](api-examples.json) and [capture script](../scripts/capture-api-examples.js). Only JWT and passwords are redacted. IDs/timestamps are from that run and must be replaced when repeating. Examples use synthetic data.

## GET /health

1. Business purpose: Check database readiness.
2. Authentication: None.
3. Parameters and body: None.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 503: database unavailable. |
| Common | 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Does not check frontend assets.

7. Actual request/response:

```http
GET /health

```

HTTP 200

```json
{
  "status": "ok",
  "db": "ok"
}
```

## POST /api/auth/login

1. Business purpose: Authenticate and obtain an 8-hour JWT.
2. Authentication: Public.
3. Parameters and body: JSON: username, password (required strings).
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 401 INVALID_CREDENTIALS. |
| Common | 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: No refresh, revocation or rate limiting.

7. Actual request/response:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "ql.ninhkieu",
  "password": "<demo password redacted>"
}
```

HTTP 200

```json
{
  "token": "<JWT redacted>",
  "user": {
    "user_id": 2,
    "username": "ql.ninhkieu",
    "full_name": "Nguyen Thi Hoa",
    "role": "QUAN_LY",
    "center_id": 1
  }
}
```

## GET /api/categories

1. Business purpose: List issue categories.
2. Authentication: JWT.
3. Parameters and body: None.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 401 UNAUTHENTICATED. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Global catalog, not scoped by center.

7. Actual request/response:

```http
GET /api/categories
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "data": [
    {
      "category_id": 1,
      "category_name": "Màn hình"
    },
    {
      "category_id": 2,
      "category_name": "Pin"
    },
    {
      "category_id": 3,
      "category_name": "Sạc"
    },
    {
      "category_id": 4,
      "category_name": "Phần mềm"
    },
    {
      "category_id": 5,
      "category_name": "Nước vào"
    },
    {
      "category_id": 6,
      "category_name": "Khác"
    }
  ]
}
```

## GET /api/users

1. Business purpose: List accounts of the manager's center.
2. Authentication: Manager JWT.
3. Parameters and body: None.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 401 UNAUTHENTICATED; 403 FORBIDDEN. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: No user update/delete API.

7. Actual request/response:

```http
GET /api/users
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "data": [
    {
      "user_id": 1,
      "username": "nv.tiepnhan01",
      "full_name": "Tran Van Le",
      "role": "NHAN_VIEN_TIEP_NHAN",
      "center_id": 1
    },
    {
      "user_id": 2,
      "username": "ql.ninhkieu",
      "full_name": "Nguyen Thi Hoa",
      "role": "QUAN_LY",
      "center_id": 1
    }
  ]
}
```

## POST /api/users

1. Business purpose: Create intake staff in the manager's center.
2. Authentication: Manager JWT.
3. Parameters and body: JSON: username (3-50 ASCII letters/digits/._-), password (8+ characters, max 72 bytes), full_name (1-120).
4. Success: HTTP 201; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 403 FORBIDDEN; 409 USERNAME_EXISTS. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Client cannot choose role or center.

7. Actual request/response:

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "bt3_1794463269570",
  "password": "<demo password redacted>",
  "full_name": "API capture fixture"
}
```

HTTP 201

```json
{
  "user_id": 38,
  "username": "bt3_1794463269570",
  "full_name": "API capture fixture",
  "role": "NHAN_VIEN_TIEP_NHAN",
  "center_id": 1
}
```

## GET /api/customers

1. Business purpose: List customers, or look up a normalized phone.
2. Authentication: JWT.
3. Parameters and body: Query: phone (lookup); otherwise page>=1 and size=1..100, default 1/20.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND for phone lookup. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Shared customer directory; staff see masked phones. Lookup returns one object; listing returns page,size,customers.

7. Actual request/response:

```http
GET /api/customers?page=1&size=1
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "page": 1,
  "size": 1,
  "customers": [
    {
      "customer_id": 1,
      "full_name": "Nguyen Van An",
      "phone": "0909123456",
      "address": "12 Nguyen Trai, Can Tho",
      "created_at": "2026-10-28T17:20:36.686Z"
    }
  ]
}
```

```http
GET /api/customers?phone=0863269570
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "customer_id": 103,
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture",
  "created_at": "2026-11-12T06:01:09.603Z"
}
```

## GET /api/customers/:id

1. Business purpose: Read a customer.
2. Authentication: JWT.
3. Parameters and body: Path id: positive integer.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Shared directory; staff see masked phones.

7. Actual request/response:

```http
GET /api/customers/103
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "customer_id": 103,
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture",
  "created_at": "2026-11-12T06:01:09.603Z"
}
```

## POST /api/customers

1. Business purpose: Register a customer.
2. Authentication: JWT.
3. Parameters and body: JSON: full_name (1-120), phone (10 digits starting 0; accepts +84/84), optional address (max 255).
4. Success: HTTP 201; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 409 PHONE_EXISTS. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Phone normalized and unique; shared across centers.

7. Actual request/response:

```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture"
}
```

HTTP 201

```json
{
  "customer_id": 103,
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture",
  "created_at": "2026-11-12T06:01:09.603Z"
}
```

## PUT /api/customers/:id

1. Business purpose: Replace customer fields.
2. Authentication: JWT.
3. Parameters and body: Path id; JSON same required fields as POST /api/customers.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND; 409 PHONE_EXISTS. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Full replacement, not PATCH; shared directory.

7. Actual request/response:

```http
PUT /api/customers/103
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture"
}
```

HTTP 200

```json
{
  "customer_id": 103,
  "full_name": "API capture fixture",
  "phone": "0863269570",
  "address": "Synthetic fixture",
  "created_at": "2026-11-12T06:01:09.603Z"
}
```

## DELETE /api/customers/:id

1. Business purpose: Delete an unused customer.
2. Authentication: Manager JWT.
3. Parameters and body: Path id: positive integer; no body.
4. Success: HTTP 204; actual body below (empty).
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 403 FORBIDDEN; 404 CUSTOMER_NOT_FOUND; 409 CUSTOMER_IN_USE. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Rejected if any device or ticket references the customer.

7. Actual request/response:

```http
DELETE /api/customers/103
Authorization: Bearer <token>

```

HTTP 204

```json

```

## GET /api/customers/:id/devices

1. Business purpose: List a customer's devices.
2. Authentication: JWT.
3. Parameters and body: Path id: positive customer ID.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Shared device directory; no pagination.

7. Actual request/response:

```http
GET /api/customers/103/devices
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "customer_id": 103,
  "devices": [
    {
      "device_id": 97,
      "customer_id": 103,
      "serial_no": "BT3-1794463269570",
      "imei": null,
      "product_name": "Demo device"
    }
  ]
}
```

## GET /api/devices/:id

1. Business purpose: Read a device.
2. Authentication: JWT.
3. Parameters and body: Path id: positive integer.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 DEVICE_NOT_FOUND. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Devices are not scoped by center.

7. Actual request/response:

```http
GET /api/devices/97
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "device_id": 97,
  "customer_id": 103,
  "serial_no": "BT3-1794463269570",
  "imei": null,
  "product_name": "Demo device"
}
```

## POST /api/devices

1. Business purpose: Register a device for an existing customer.
2. Authentication: JWT.
3. Parameters and body: JSON: customer_id (positive integer), serial_no (1-80), product_name (1-120), optional imei (max 30).
4. Success: HTTP 201; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND; 409 SERIAL_EXISTS. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: serial_no is required even if imei is provided.

7. Actual request/response:

```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 103,
  "serial_no": "BT3-1794463269570",
  "product_name": "Demo device"
}
```

HTTP 201

```json
{
  "device_id": 97,
  "customer_id": 103,
  "serial_no": "BT3-1794463269570",
  "imei": null,
  "product_name": "Demo device"
}
```

## PUT /api/devices/:id

1. Business purpose: Replace device fields.
2. Authentication: JWT.
3. Parameters and body: Path id; JSON same as POST /api/devices.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 DEVICE_NOT_FOUND/CUSTOMER_NOT_FOUND; 409 SERIAL_EXISTS. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Allows customer reassignment; existing ticket consistency is not enforced here.

7. Actual request/response:

```http
PUT /api/devices/97
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 103,
  "serial_no": "BT3-1794463269570",
  "product_name": "Demo device"
}
```

HTTP 200

```json
{
  "device_id": 97,
  "customer_id": 103,
  "serial_no": "BT3-1794463269570",
  "imei": null,
  "product_name": "Demo device"
}
```

## DELETE /api/devices/:id

1. Business purpose: Delete an unused device.
2. Authentication: Manager JWT.
3. Parameters and body: Path id: positive integer.
4. Success: HTTP 204; actual body below (empty).
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 403 FORBIDDEN; 404 DEVICE_NOT_FOUND; 409 DEVICE_IN_USE. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Devices referenced by tickets cannot be deleted.

7. Actual request/response:

```http
DELETE /api/devices/97
Authorization: Bearer <token>

```

HTTP 204

```json

```

## GET /api/tickets

1. Business purpose: List tickets in the current center.
2. Authentication: JWT.
3. Parameters and body: Query: page>=1, size=1..100 (default 20), status, priority, phone, category (positive ID), sort=due_date only.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Cannot override center; staff phones masked. Flags overdue/near_due depend on current time.

7. Actual request/response:

```http
GET /api/tickets?phone=0863269570
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "total": 1,
  "page": 1,
  "size": 20,
  "tickets": [
    {
      "ticket_id": 92,
      "ticket_code": "BH000092/2026",
      "status": "MOI",
      "priority": "THAP",
      "issue_desc": "Mat nguon",
      "received_at": "2026-11-12T06:01:09.761Z",
      "due_date": "2026-11-18T06:01:09.761Z",
      "center_id": 1,
      "center_name": "Trung tam Ninh Kieu",
      "category_id": 6,
      "category_name": "Khác",
      "customer_id": 103,
      "customer_name": "API capture fixture",
      "customer_phone": "0863269570",
      "customer_address": "Synthetic fixture",
      "device_id": 97,
      "serial_no": "BT3-1794463269570",
      "imei": null,
      "product_name": "Demo device",
      "is_overdue": false,
      "is_near_due": false
    }
  ]
}
```

## GET /api/tickets/:id

1. Business purpose: Read ticket details and status history.
2. Authentication: JWT.
3. Parameters and body: Path id: positive integer.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 TICKET_NOT_FOUND. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Other-center tickets also return 404.

7. Actual request/response:

```http
GET /api/tickets/92
Authorization: Bearer <token>

```

HTTP 200

```json
{
  "ticket_id": 92,
  "ticket_code": "BH000092/2026",
  "status": "MOI",
  "priority": "THAP",
  "issue_desc": "Mat nguon",
  "received_at": "2026-11-12T06:01:09.761Z",
  "due_date": "2026-11-18T06:01:09.761Z",
  "center_id": 1,
  "center_name": "Trung tam Ninh Kieu",
  "category_id": 6,
  "category_name": "Khác",
  "customer_id": 103,
  "customer_name": "API capture fixture",
  "customer_phone": "0863269570",
  "customer_address": "Synthetic fixture",
  "device_id": 97,
  "serial_no": "BT3-1794463269570",
  "imei": null,
  "product_name": "Demo device",
  "logs": [
    {
      "log_id": 63,
      "from_status": null,
      "to_status": "MOI",
      "changed_at": "2026-11-12T06:01:09.762Z",
      "changed_by": "ql.ninhkieu"
    }
  ]
}
```

## POST /api/tickets/preview

1. Business purpose: Preview keyword classification and due date without saving.
2. Authentication: JWT.
3. Parameters and body: JSON: issue_desc (trimmed 1-2000 characters).
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Uses current server time; priority CAO=24, TRUNG_BINH=72, THAP=120 working hours, skips Sundays in UTC+7.

7. Actual request/response:

```http
POST /api/tickets/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "issue_desc": "Mat nguon"
}
```

HTTP 200

```json
{
  "category_id": 6,
  "category_name": "Khác",
  "priority": "THAP",
  "due_date": "2026-11-18T06:01:09.743Z"
}
```

## POST /api/tickets

1. Business purpose: Create a ticket and its initial status log atomically.
2. Authentication: JWT.
3. Parameters and body: JSON: customer_id, device_id (positive integers), issue_desc (trimmed 1-2000).
4. Success: HTTP 201; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 CUSTOMER_NOT_FOUND/DEVICE_NOT_FOUND. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Device must belong to customer. Center taken from JWT; starts MOI.

7. Actual request/response:

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 103,
  "device_id": 97,
  "issue_desc": "Mat nguon"
}
```

HTTP 201

```json
{
  "ticket_id": 92,
  "ticket_code": "BH000092/2026",
  "status": "MOI",
  "category": "KHAC",
  "priority": "THAP",
  "received_at": "2026-11-12T06:01:09.761Z",
  "due_date": "2026-11-18T06:01:09.761Z"
}
```

## PATCH /api/tickets/:id/status

1. Business purpose: Advance a ticket and append an audit log atomically.
2. Authentication: JWT.
3. Parameters and body: Path id; JSON to_status: MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT or DA_DONG.
4. Success: HTTP 200; actual body below.
5. Error codes:

| HTTP/code | Condition |
|---|---|
| Endpoint-specific | 400 VALIDATION_ERROR; 404 TICKET_NOT_FOUND; 409 INVALID_TRANSITION. |
| Common | 401 UNAUTHENTICATED; 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |

6. Limitations: Only next state allowed: MOI -> DA_PHAN_CONG -> DANG_XU_LY -> HOAN_TAT -> DA_DONG. Row lock serializes transitions.

7. Actual request/response:

```http
PATCH /api/tickets/92/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "to_status": "DA_PHAN_CONG"
}
```

HTTP 200

```json
{
  "ticket_id": 92,
  "status": "DA_PHAN_CONG"
}
```

The frontend is served at `/` when built assets exist; it is a static document rather than a JSON API. Unknown routes return 404 NOT_FOUND. No ticket delete, refresh token or assignment-to-technician endpoint exists.
