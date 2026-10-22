const AppError = require('../errors/AppError');

// Doc token tu header Authorization: Bearer <token>, gan nguoi dung vao req.user
function authenticate(authService) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new AppError('UNAUTHENTICATED', 'Can dang nhap de thuc hien thao tac nay'));
    }
    try {
      req.user = authService.verify(token);
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'Ban khong co quyen thuc hien thao tac nay'));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
