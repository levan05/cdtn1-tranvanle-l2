const AppError = require('../errors/AppError');
const { validateNewUserInput } = require('../validators/user.validator');

const ROLE_MANAGER = 'QUAN_LY';
const ROLE_STAFF = 'NHAN_VIEN_TIEP_NHAN';

function requireManager(user) {
  if (!user || user.role !== ROLE_MANAGER) {
    throw new AppError('FORBIDDEN', 'Chi quan ly moi duoc quan ly tai khoan');
  }
}

function createUserService({ userRepo }) {
  return {
    // Quan ly chi tao duoc nhan vien tiep nhan, trong trung tam cua chinh minh
    async create(body, user) {
      requireManager(user);
      const input = validateNewUserInput(body);
      if (await userRepo.findByUsername(input.username)) {
        throw new AppError('USERNAME_EXISTS', 'Ten dang nhap da ton tai', { username: 'Ten dang nhap da ton tai' });
      }
      try {
        return await userRepo.insert({ ...input, role: ROLE_STAFF, center_id: user.center_id });
      } catch (err) {
        // hai yeu cau cung luc co the vuot qua buoc kiem tra tren, rang buoc UNIQUE la chot cuoi
        if (err.code === '23505') {
          throw new AppError('USERNAME_EXISTS', 'Ten dang nhap da ton tai', { username: 'Ten dang nhap da ton tai' });
        }
        throw err;
      }
    },

    async list(user) {
      requireManager(user);
      return { data: await userRepo.listByCenter(user.center_id) };
    },
  };
}

module.exports = createUserService;
