const AppError = require('../errors/AppError');

// QT-03: so gio cam ket theo muc uu tien
const SLA_HOURS = { CAO: 24, TRUNG_BINH: 72, THAP: 120 };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Cua hang o Viet Nam (UTC+7, khong doi gio mua he), ngay lam viec tinh theo gio dia phuong
const LOCAL_OFFSET_MS = 7 * HOUR_MS;

// Chu Nhat la ngay nghi duy nhat (Thu Hai - Thu Bay deu lam viec)
function isSunday(localMs) {
  return new Date(localMs).getUTCDay() === 0;
}

function startOfNextDay(localMs) {
  return Math.floor(localMs / DAY_MS) * DAY_MS + DAY_MS;
}

// Cong `hours` gio lam viec vao moc `receivedAt`. Chu Nhat khong duoc tinh gio nao:
// moc roi vao Chu Nhat thi bat dau dem tu 00:00 Thu Hai, dang dem gap Chu Nhat thi nhay qua.
function tinhHanCamKet(receivedAt, priority) {
  const hours = SLA_HOURS[priority];
  if (hours === undefined) {
    throw new AppError('VALIDATION_ERROR', 'Muc uu tien khong hop le', {
      priority: 'priority phai la CAO, TRUNG_BINH hoac THAP',
    });
  }
  const start = new Date(receivedAt);
  if (Number.isNaN(start.getTime())) {
    throw new AppError('VALIDATION_ERROR', 'Thoi diem tiep nhan khong hop le', {
      received_at: 'received_at khong phai thoi diem hop le',
    });
  }

  let cursor = start.getTime() + LOCAL_OFFSET_MS;
  let remaining = hours * HOUR_MS;

  while (remaining > 0) {
    if (isSunday(cursor)) {
      cursor = startOfNextDay(cursor);
      continue;
    }
    const room = startOfNextDay(cursor) - cursor;
    if (remaining <= room) {
      cursor += remaining;
      remaining = 0;
    } else {
      remaining -= room;
      cursor += room;
    }
  }
  return new Date(cursor - LOCAL_OFFSET_MS);
}

module.exports = { tinhHanCamKet, SLA_HOURS };
