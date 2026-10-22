const AppError = require('../errors/AppError');
const { validateDeviceInput } = require('../validators/device.validator');
const { parseId } = require('../validators/common.validator');

function notFound() {
  return new AppError('DEVICE_NOT_FOUND', 'Khong tim thay thiet bi');
}

function createDeviceService({ deviceRepo, customerRepo }) {
  async function assertCustomerExists(customerId) {
    if (!(await customerRepo.findById(customerId))) {
      throw new AppError('CUSTOMER_NOT_FOUND', 'Khong tim thay khach hang');
    }
  }

  async function assertSerialFree(serialNo, exceptId) {
    const existing = await deviceRepo.findBySerial(serialNo);
    if (existing && existing.device_id !== exceptId) {
      throw new AppError('SERIAL_EXISTS', 'Serial/IMEI da ton tai', { serial_no: 'Serial/IMEI da ton tai' });
    }
  }

  return {
    async listByCustomer(rawCustomerId) {
      const customerId = parseId(rawCustomerId, 'customer_id');
      await assertCustomerExists(customerId);
      return { customer_id: customerId, devices: await deviceRepo.listByCustomer(customerId) };
    },

    async getById(rawId) {
      const device = await deviceRepo.findById(parseId(rawId));
      if (!device) throw notFound();
      return device;
    },

    async create(body) {
      const data = validateDeviceInput(body);
      await assertCustomerExists(data.customer_id);
      await assertSerialFree(data.serial_no, null);
      return deviceRepo.insert(data);
    },

    async update(rawId, body) {
      const id = parseId(rawId);
      const data = validateDeviceInput(body);
      if (!(await deviceRepo.findById(id))) throw notFound();
      await assertCustomerExists(data.customer_id);
      await assertSerialFree(data.serial_no, id);
      return deviceRepo.update(id, data);
    },

    async remove(rawId) {
      const id = parseId(rawId);
      if (!(await deviceRepo.findById(id))) throw notFound();
      if ((await deviceRepo.countTickets(id)) > 0) {
        throw new AppError('DEVICE_IN_USE', 'Thiet bi da co phieu bao hanh, khong the xoa');
      }
      await deviceRepo.remove(id);
    },
  };
}

module.exports = createDeviceService;