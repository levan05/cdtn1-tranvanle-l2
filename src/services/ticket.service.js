const AppError = require('../errors/AppError');
const { parseId } = require('../validators/common.validator');
const { validateTicketInput, validatePreviewInput, validateStatusInput, validateTicketListQuery, STATUSES } = require('../validators/ticket.validator');
const { phanLoaiSuCo } = require('./classifier');
const { tinhHanCamKet } = require('./deadline');

const LOCAL_OFFSET_MS = 7 * 60 * 60 * 1000;

const ROLE_MANAGER = 'QUAN_LY';
const NEAR_DUE_MS = 24 * 60 * 60 * 1000;
const FINISHED = ['HOAN_TAT', 'DA_DONG'];

// QT-05: chi quan ly xem so day du, vai tro khac chi thay 4 so cuoi
function presentPhone(phone, user) {
  return user.role === ROLE_MANAGER ? phone : '******' + phone.slice(-4);
}

function notFound() {
  return new AppError('TICKET_NOT_FOUND', 'Khong tim thay phieu bao hanh');
}

// Ma phieu dang BH + 6 chu so cua ticket_id + / + nam tiep nhan theo gio Viet Nam, vd BH000101/2026
function sinhMaPhieu(ticketId, receivedAt) {
  const year = new Date(receivedAt.getTime() + LOCAL_OFFSET_MS).getUTCFullYear();
  return `BH${String(ticketId).padStart(6, '0')}/${year}`;
}

function createTicketService({ ticketRepo, customerRepo, deviceRepo, now = () => new Date() }) {
  return {
    // Cho giao dien hien nhom su co, uu tien, han cam ket truoc khi luu; dung chung luat voi create
    preview(body) {
      const { issue_desc: issueDesc } = validatePreviewInput(body);
      const category = phanLoaiSuCo(issueDesc);
      return {
        category_id: category.category_id,
        category_name: category.category_name,
        priority: category.priority,
        due_date: tinhHanCamKet(now(), category.priority).toISOString(),
      };
    },

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

    // QT-06: luon loc theo trung tam cua nguoi dang nhap, khong nhan center tu client
    async list(query, user) {
      const filter = validateTicketListQuery(query);
      const { total, rows } = await ticketRepo.list({
        centerId: user.center_id,
        status: filter.status,
        priority: filter.priority,
        phone: filter.phone,
        category: filter.category,
        limit: filter.limit,
        offset: filter.offset,
      });
      const nowMs = now().getTime();
      const tickets = rows.map((t) => {
        const remaining = new Date(t.due_date).getTime() - nowMs;
        const open = !FINISHED.includes(t.status);
        return {
          ...t,
          customer_phone: presentPhone(t.customer_phone, user),
          is_overdue: open && remaining < 0,
          is_near_due: open && remaining >= 0 && remaining <= NEAR_DUE_MS,
        };
      });
      return { total, page: filter.page, size: filter.size, tickets };
    },

    // Chi tiet phieu kem lich su trang thai; phieu cua trung tam khac coi nhu khong ton tai (QT-06)
    async getById(rawId, user) {
      const id = parseId(rawId);
      const ticket = await ticketRepo.findById(id);
      if (!ticket || ticket.center_id !== user.center_id) throw notFound();
      const logs = await ticketRepo.listLogs(id);
      return { ...ticket, customer_phone: presentPhone(ticket.customer_phone, user), logs };
    },

    // QT-04: chi duoc chuyen sang trang thai ke tiep, khong nhay coc, khong quay lai; moi lan chuyen ghi log
    async changeStatus(rawId, body, user) {
      const id = parseId(rawId);
      const { to_status: toStatus } = validateStatusInput(body);

      return ticketRepo.runInTransaction(async (tx) => {
        const ticket = await tx.findForUpdate(id);
        // Phieu cua trung tam khac coi nhu khong ton tai (QT-06)
        if (!ticket || ticket.center_id !== user.center_id) throw notFound();

        const expected = STATUSES[STATUSES.indexOf(ticket.status) + 1];
        if (toStatus !== expected) {
          throw new AppError(
            'INVALID_TRANSITION',
            `Khong the chuyen tu ${ticket.status} sang ${toStatus}`,
            { to_status: expected ? `Trang thai ke tiep hop le la ${expected}` : 'Phieu da dong, khong the chuyen tiep' }
          );
        }

        await tx.updateStatus(id, toStatus);
        await tx.insertLog({ ticket_id: id, from_status: ticket.status, to_status: toStatus, changed_by: user.username });
        return { ticket_id: id, status: toStatus };
      });
    },
  };
}

module.exports = createTicketService;
module.exports.sinhMaPhieu = sinhMaPhieu;
