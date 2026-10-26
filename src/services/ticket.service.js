const AppError = require('../errors/AppError');
const { validateTicketInput } = require('../validators/ticket.validator');
const { phanLoaiSuCo } = require('./classifier');
const { tinhHanCamKet } = require('./deadline');

const LOCAL_OFFSET_MS = 7 * 60 * 60 * 1000;

// Ma phieu dang BH + 6 chu so cua ticket_id + / + nam tiep nhan theo gio Viet Nam, vd BH000101/2026
function sinhMaPhieu(ticketId, receivedAt) {
  const year = new Date(receivedAt.getTime() + LOCAL_OFFSET_MS).getUTCFullYear();
  return `BH${String(ticketId).padStart(6, '0')}/${year}`;
}

function createTicketService({ ticketRepo, customerRepo, deviceRepo, now = () => new Date() }) {
  return {
    async create(body, user) {
      const data = validateTicketInput(body);

      if (!(await customerRepo.findById(data.customer_id))) {
        throw new AppError('CUSTOMER_NOT_FOUND', 'Khong tim thay khach hang');
      }
      const device = await deviceRepo.findById(data.device_id);
      if (!device) throw new AppError('DEVICE_NOT_FOUND', 'Khong tim thay thiet bi');
      if (device.customer_id !== data.customer_id) {
        throw new AppError('VALIDATION_ERROR', 'Thiet bi khong thuoc khach hang nay', {
          device_id: 'Thiet bi khong thuoc khach hang da chon',
        });
      }

      const category = phanLoaiSuCo(data.issue_desc);
      const receivedAt = now();
      const dueDate = tinhHanCamKet(receivedAt, category.priority);

      // Phieu va dong log dau (NULL -> MOI) phai cung thanh cong hoac cung that bai
      const ticketId = await ticketRepo.runInTransaction(async (tx) => {
        const id = await tx.nextTicketId();
        await tx.insert({
          ticket_id: id,
          ticket_code: sinhMaPhieu(id, receivedAt),
          customer_id: data.customer_id,
          device_id: data.device_id,
          center_id: user.center_id,
          category_id: category.category_id,
          issue_desc: data.issue_desc,
          priority: category.priority,
          status: 'MOI',
          received_at: receivedAt,
          due_date: dueDate,
        });
        await tx.insertLog({ ticket_id: id, from_status: null, to_status: 'MOI', changed_by: user.username });
        return id;
      });

      return {
        ticket_id: ticketId,
        ticket_code: sinhMaPhieu(ticketId, receivedAt),
        status: 'MOI',
        category: category.category_code,
        priority: category.priority,
        received_at: receivedAt.toISOString(),
        due_date: dueDate.toISOString(),
      };
    },
  };
}

module.exports = createTicketService;
module.exports.sinhMaPhieu = sinhMaPhieu;
