// Loi nghiep vu co ma ro rang. Lop routes dich ma nay sang ma HTTP,
// lop services chi can nem AppError ma khong biet gi ve HTTP.
class AppError extends Error {
  constructor(code, message, fields = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fields = fields;
  }
}

module.exports = AppError;
