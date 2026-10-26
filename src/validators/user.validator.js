const AppError = require('../errors/AppError');

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;
const PASSWORD_MIN = 8;
// bcrypt chi xet 72 byte dau cua mat khau
const PASSWORD_MAX_BYTES = 72;

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

// Vai tro va trung tam khong lay tu client: service gan vai tro nhan vien va trung tam cua quan ly
function validateNewUserInput(body = {}) {
  const fields = {};

  if (isBlank(body.username)) fields.username = 'Ten dang nhap la bat buoc';
  else if (!USERNAME_PATTERN.test(body.username.trim())) {
    fields.username = 'Ten dang nhap gom 3 den 50 ky tu: chu, so, dau cham, gach duoi hoac gach ngang';
  }

  if (typeof body.password !== 'string' || body.password === '') fields.password = 'Mat khau la bat buoc';
  else if (body.password.length < PASSWORD_MIN) fields.password = `Mat khau toi thieu ${PASSWORD_MIN} ky tu`;
  else if (Buffer.byteLength(body.password) > PASSWORD_MAX_BYTES) {
    fields.password = `Mat khau toi da ${PASSWORD_MAX_BYTES} byte`;
  }

  if (isBlank(body.full_name)) fields.full_name = 'Ho ten la bat buoc';
  else if (body.full_name.trim().length > 120) fields.full_name = 'Ho ten toi da 120 ky tu';

  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Du lieu tai khoan khong hop le', fields);
  }
  return { username: body.username.trim(), password: body.password, full_name: body.full_name.trim() };
}

module.exports = { validateNewUserInput };
