const AppError = require('../errors/AppError');

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

// page bat dau tu 1, size mac dinh 20, toi da 100
function parsePaging(query = {}) {
  const fields = {};
  const page = query.page === undefined ? 1 : Number(query.page);
  const size = query.size === undefined ? DEFAULT_SIZE : Number(query.size);

  if (!Number.isInteger(page) || page < 1) fields.page = 'page phai la so nguyen tu 1 tro len';
  if (!Number.isInteger(size) || size < 1 || size > MAX_SIZE) {
    fields.size = `size phai la so nguyen tu 1 den ${MAX_SIZE}`;
  }
  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Tham so phan trang khong hop le', fields);
  }
  return { page, size, limit: size, offset: (page - 1) * size };
}

function parseId(value, fieldName = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError('VALIDATION_ERROR', 'Ma dinh danh khong hop le', {
      [fieldName]: `${fieldName} phai la so nguyen duong`,
    });
  }
  return id;
}

module.exports = { parsePaging, parseId };
