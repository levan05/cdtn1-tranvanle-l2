const AppError = require('../errors/AppError');
const { parsePaging } = require('./common.validator');

const { normalizePhone } = require('./customer.validator');

const STATUSES = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT', 'DA_DONG'];
const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const MAX_ISSUE_DESC = 2000;

function toPositiveInt(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function validateIssueDesc(value) {
  if (typeof value !== 'string' || value.trim() === '') return 'Mo ta loi la bat buoc';
  if (value.trim().length > MAX_ISSUE_DESC) return `Mo ta loi toi da ${MAX_ISSUE_DESC} ky tu`;
  return null;
}

function validateTicketInput(body = {}) {
  const fields = {};

  const customerId = toPositiveInt(body.customer_id);
  if (customerId === null) fields.customer_id = 'customer_id phai la so nguyen duong';

  const deviceId = toPositiveInt(body.device_id);
  if (deviceId === null) fields.device_id = 'device_id phai la so nguyen duong';

  const descError = validateIssueDesc(body.issue_desc);
  if (descError) fields.issue_desc = descError;

  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Du lieu phieu bao hanh khong hop le', fields);
  }
  return { customer_id: customerId, device_id: deviceId, issue_desc: body.issue_desc.trim() };
}

function validatePreviewInput(body = {}) {
  const descError = validateIssueDesc(body.issue_desc);
  if (descError) throw new AppError('VALIDATION_ERROR', 'Mo ta loi khong hop le', { issue_desc: descError });
  return { issue_desc: body.issue_desc.trim() };
}

function validateStatusInput(body = {}) {
  if (!STATUSES.includes(body.to_status)) {
    throw new AppError('VALIDATION_ERROR', 'Trang thai moi khong hop le', {
      to_status: `to_status phai thuoc: ${STATUSES.join(', ')}`,
    });
  }
  return { to_status: body.to_status };
}

// Bo loc danh sach: status, priority (tuy chon), sort=due_date (mac dinh), kem phan trang
function validateTicketListQuery(query = {}) {
  const fields = {};
  if (query.status !== undefined && !STATUSES.includes(query.status)) {
    fields.status = `status phai thuoc: ${STATUSES.join(', ')}`;
  }
  if (query.priority !== undefined && !PRIORITIES.includes(query.priority)) {
    fields.priority = `priority phai thuoc: ${PRIORITIES.join(', ')}`;
  }
  let phone = null;
  if (query.phone !== undefined && query.phone !== '') {
    phone = normalizePhone(query.phone);
    if (phone === null) fields.phone = 'So dien thoai phai gom 10 chu so bat dau bang 0';
  }
  if (query.category !== undefined && query.category !== '' && !/^[1-9]\d{0,8}$/.test(String(query.category))) {
    fields.category = 'category phai la ma nhom su co (so nguyen duong)';
  }
  if (query.sort !== undefined && query.sort !== 'due_date') {
    fields.sort = 'sort chi ho tro due_date';
  }
  if (Object.keys(fields).length > 0) {
    throw new AppError('VALIDATION_ERROR', 'Bo loc danh sach phieu khong hop le', fields);
  }
  return {
    status: query.status || null,
    priority: query.priority || null,
    phone,
    category: query.category ? Number(query.category) : null,
    ...parsePaging(query),
  };
}

module.exports = { STATUSES, PRIORITIES, validateTicketInput, validatePreviewInput, validateStatusInput, validateTicketListQuery };
