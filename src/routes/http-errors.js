const logger = require('../logger');

// Lop routes dich ma loi nghiep vu sang ma HTTP. Services khong biet gi ve HTTP.
const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  CUSTOMER_NOT_FOUND: 404,
  PHONE_EXISTS: 409,
  CUSTOMER_IN_USE: 409,
  DEVICE_NOT_FOUND: 404,
  SERIAL_EXISTS: 409,
  DEVICE_IN_USE: 409,
  TICKET_NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  USERNAME_EXISTS: 409,
};

// Loi mat ket noi toi PostgreSQL: ma loi mang cua Node (co the nam trong AggregateError) hoac ma SQLSTATE nhom ket noi
const DB_DOWN_CODES = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', '57P01', '57P03', '53300'];

function isDatabaseDown(err) {
  const codes = [err.code, ...(Array.isArray(err.errors) ? err.errors.map((e) => e.code) : [])];
  return codes.some((c) => DB_DOWN_CODES.includes(c)) || /^08/.test(String(err.code));
}

function errorBody(code, message, fields = {}) {
  return { error: { code, message, fields } };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'AppError') {
    return res.status(STATUS_BY_CODE[err.code] || 400).json(errorBody(err.code, err.message, err.fields));
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(errorBody('VALIDATION_ERROR', 'Noi dung gui len khong phai JSON hop le'));
  }
  if (isDatabaseDown(err)) {
    logger.error('Mat ket noi co so du lieu', { path: req.path, detail: err.code });
    return res.status(503).json(errorBody('DATABASE_UNAVAILABLE', 'Khong ket noi duoc co so du lieu, vui long thu lai sau'));
  }
  // Loi la: ghi log chi tiet o server, tra ve thong bao chung, khong lo loi thu vien
  logger.error('Loi khong xac dinh', { path: req.path, detail: err.message });
  return res.status(500).json(errorBody('INTERNAL_ERROR', 'He thong gap su co, vui long thu lai sau'));
}

function notFoundHandler(req, res) {
  res.status(404).json(errorBody('NOT_FOUND', 'Khong tim thay duong dan yeu cau'));
}

module.exports = { errorHandler, notFoundHandler };
