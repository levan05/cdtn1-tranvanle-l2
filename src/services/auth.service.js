const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');

const TOKEN_TTL = '8h';

function createAuthService({ userRepo, secret }) {
  return {
    async login(username, password) {
      const fields = {};
      if (typeof username !== 'string' || username.trim() === '') fields.username = 'Ten dang nhap la bat buoc';
      if (typeof password !== 'string' || password === '') fields.password = 'Mat khau la bat buoc';
      if (Object.keys(fields).length > 0) {
        throw new AppError('VALIDATION_ERROR', 'Thieu thong tin dang nhap', fields);
      }

      const user = await userRepo.findByCredentials(username.trim(), password);
      // Thong bao chung, khong tiet lo ten dang nhap co ton tai hay khong
      if (!user) throw new AppError('INVALID_CREDENTIALS', 'Ten dang nhap hoac mat khau khong dung');

      const payload = { sub: user.user_id, username: user.username, role: user.role, center_id: user.center_id };
      return { token: jwt.sign(payload, secret, { expiresIn: TOKEN_TTL }), user };
    },

    verify(token) {
      try {
        return jwt.verify(token, secret);
      } catch {
        throw new AppError('UNAUTHENTICATED', 'Phien dang nhap khong hop le hoac da het han');
      }
    },
  };
}

module.exports = createAuthService;
