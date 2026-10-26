export const STATUS_LABEL = {
  MOI: 'Mới',
  DA_PHAN_CONG: 'Đã phân công',
  DANG_XU_LY: 'Đang xử lý',
  HOAN_TAT: 'Hoàn tất',
  DA_DONG: 'Đã đóng',
};

export const PRIORITY_LABEL = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };

// API tra gio UTC, hien thi theo gio Viet Nam (TD5)
export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}