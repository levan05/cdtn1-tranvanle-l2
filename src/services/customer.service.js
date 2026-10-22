const AppError = require('../errors/AppError');
const { normalizePhone, validateCustomerInput } = require('../validators/customer.validator');
const { parsePaging, parseId } = require('../validators/common.validator');

const ROLE_MANAGER = 'QUAN_LY';

// QT-05: chi quan ly xem duoc so day du, vai tro khac chi thay 4 so cuoi
function maskPhone(phone) {
  return '******' + phone.slice(-4);
}

function presentCustomer(customer, user) {
  if (user && user.role === ROLE_MANAGER) return customer;
  return { ...customer, phone: maskPhone(customer.phone) };
}

function notFound() {
  return new AppError('CUSTOMER_NOT_FOUND', 'Khong tim thay khach hang');
}

function createCustomerService({ customerRepo }) {
  return {
    async findByPhone(rawPhone, user) {
      const phone = normalizePhone(rawPhone);
      if (phone === null) {
        throw new AppError('VALIDATION_ERROR', 'So dien thoai khong hop le', {
          phone: 'So dien thoai phai gom 10 chu so bat dau bang 0',
        });
      }
      const customer = await customerRepo.findByPhone(phone);
      if (!customer) throw notFound();
      return presentCustomer(customer, user);
    },

    async list(query, user) {
      const { page, size, limit, offset } = parsePaging(query);
      const rows = await customerRepo.list({ limit, offset });
      return { page, size, customers: rows.map((c) => presentCustomer(c, user)) };
    },

    async getById(rawId, user) {
      const customer = await customerRepo.findById(parseId(rawId));
      if (!customer) throw notFound();
      return presentCustomer(customer, user);
    },

    // QT-01: so dien thoai la duy nhat
    async create(body, user) {
      const data = validateCustomerInput(body);
      const existing = await customerRepo.findByPhone(data.phone);
      if (existing) {
        throw new AppError('PHONE_EXISTS', 'So dien thoai da ton tai, hay dung ho so co san', {
          phone: 'So dien thoai da duoc dang ky',
        });
      }
      return presentCustomer(await customerRepo.insert(data), user);
    },

    async update(rawId, body, user) {
      const id = parseId(rawId);
      const data = validateCustomerInput(body);
      const owner = await customerRepo.findByPhone(data.phone);
      if (owner && owner.customer_id !== id) {
        throw new AppError('PHONE_EXISTS', 'So dien thoai da thuoc ve khach hang khac', {
          phone: 'So dien thoai da duoc dang ky',
        });
      }
      const updated = await customerRepo.update(id, data);
      if (!updated) throw notFound();
      return presentCustomer(updated, user);
    },

    // Khong xoa khach da co thiet bi hoac phieu de giu lich su bao hanh
    async remove(rawId) {
      const id = parseId(rawId);
      if (!(await customerRepo.findById(id))) throw notFound();
      const usage = await customerRepo.countDevicesAndTickets(id);
      if (usage.devices > 0 || usage.tickets > 0) {
        throw new AppError('CUSTOMER_IN_USE', 'Khach hang da co thiet bi hoac phieu bao hanh nen khong the xoa', {
          devices: usage.devices,
          tickets: usage.tickets,
        });
      }
      await customerRepo.remove(id);
    },
  };
}

module.exports = createCustomerService;
