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
};

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
  // Loi la: ghi log chi tiet o server, tra ve thong bao chung, khong lo loi thu vien
  logger.error('Loi khong xac dinh', { path: req.path, detail: err.message });
  return res.status(500).json(errorBody('INTERNAL_ERROR', 'He thong gap su co, vui long thu lai sau'));
}

function notFoundHandler(req, res) {
  res.status(404).json(errorBody('NOT_FOUND', 'Khong tim thay duong dan yeu cau'));
}

module.exports = { errorHandler, notFoundHandler };
