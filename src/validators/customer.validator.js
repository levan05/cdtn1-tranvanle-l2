const AppError = require('../errors/AppError');

// QT-02: chuan hoa ve 10 chu so bat dau bang 0 (chap nhan 84xxxxxxxxx va +84xxxxxxxxx)
function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+84')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('84') && digits.length === 11) digits = '0' + digits.slice(2);
  return /^0\d{9}$/.test(digits) ? digits : null;
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

// Tra ve du lieu da lam sach, hoac nem AppError kem ten tung truong sai
function validateCustomerInput(body = {}) {
  const fields = {};

  if (isBlank(body.full_name)) fields.full_name = 'Ho ten la bat buoc';
  else if (body.full_name.trim().length > 120) fields.full_name = 'Ho ten toi da 120 ky tu';

  const phone = normalizePhone(body.phone);
  if (isBlank(body.phone)) fields.phone = 'So dien thoai la bat buoc';
  else if (phone === null) fields.phone = 'So dien thoai phai gom 10 chu so bat dau bang 0';

  if (body.address != null && (typeof body.address !== 'string' || body.address.length > 255)) {
    fields.address = 'Dia chi phai la chuoi toi da 255 ky tu';
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Du lieu khach hang khong hop le', fields);
  }

  return {
    full_name: body.full_name.trim(),
    phone,
    address: body.address ? body.address.trim() : null,
  };
}

module.exports = { normalizePhone, validateCustomerInput };
