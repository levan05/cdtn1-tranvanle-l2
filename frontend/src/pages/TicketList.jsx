import { useState } from 'react';
import { api } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { navigate } from '../hooks/useHashRoute.js';
import { PRIORITY_LABEL, STATUS_LABEL, formatDateTime } from '../utils/format.js';

const PAGE_SIZE = 10;
const NO_FILTER = { phone: '', status: '', category: '', priority: '' };

// Phieu sap/qua han dua len dau trang (wireframe M1, muc 7), cac phieu con lai giu thu tu theo han
function urgentFirst(tickets) {
  const rank = (t) => (t.is_overdue ? 0 : t.is_near_due ? 1 : 2);
  return [...tickets].sort((a, b) => rank(a) - rank(b));
}

function rowClass(t) {
  if (t.is_overdue) return 'row-overdue';
  if (t.is_near_due) return 'row-near';
  return '';
}

export default function TicketList({ user }) {
  const [draft, setDraft] = useState(NO_FILTER);
  const [filters, setFilters] = useState(NO_FILTER);
  const [page, setPage] = useState(1);

  const categories = useAsync(() => api.listCategories(), []);
  const tickets = useAsync(() => api.listTickets({ ...filters, page, size: PAGE_SIZE, sort: 'due_date' }), [filters, page]);

  const hasFilter = Object.values(filters).some((v) => v !== '');

  function apply(next) {
    setFilters(next);
    setPage(1);
  }

  function onSubmit(event) {
    event.preventDefault();
    apply(draft);
  }

  function onSelect(key, value) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    apply(next);
  }

  function clear() {
    setDraft(NO_FILTER);
    apply(NO_FILTER);
  }

  const total = tickets.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const phoneError = tickets.error?.fields?.phone;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Phiếu bảo hành</h1>
          <p className="muted">
            {user.role === 'QUAN_LY' ? 'Các phiếu thuộc trung tâm bạn phụ trách' : 'Các phiếu của trung tâm bạn'}
          </p>
        </div>
        {user.role === 'NHAN_VIEN_TIEP_NHAN' && (
          <a className="btn btn-primary" href="#/tickets/new">
            + Tạo phiếu
          </a>
        )}
      </div>

      <form className="filters card" onSubmit={onSubmit}>
        <label className="field">
          <span>Số điện thoại</span>
          <input
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            placeholder="0901234567"
            inputMode="tel"
            className={phoneError ? 'invalid' : ''}
          />
          {phoneError && <small className="field-error">{phoneError}</small>}
        </label>
        <label className="field">
          <span>Trạng thái</span>
          <select value={draft.status} onChange={(e) => onSelect('status', e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Nhóm sự cố</span>
          <select value={draft.category} onChange={(e) => onSelect('category', e.target.value)}>
            <option value="">Tất cả</option>
            {(categories.data?.data || []).map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Mức ưu tiên</span>
          <select value={draft.priority} onChange={(e) => onSelect('priority', e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button className="btn btn-primary" type="submit">
            Lọc
          </button>
          {hasFilter && (
            <button className="btn btn-ghost" type="button" onClick={clear}>
              Xóa lọc
            </button>
          )}
        </div>
      </form>

      <div className="card table-card">
        {tickets.loading && <LoadingState text="Đang tải danh sách phiếu..." />}

        {!tickets.loading && tickets.error && !phoneError && <ErrorState error={tickets.error} onRetry={tickets.reload} />}

        {!tickets.loading && phoneError && (
          <EmptyState title="Số điện thoại chưa hợp lệ" hint="Nhập đủ 10 chữ số bắt đầu bằng 0 rồi bấm Lọc." />
        )}

        {!tickets.loading && !tickets.error && total === 0 && (
          <EmptyState
            title={hasFilter ? 'Không có phiếu nào khớp bộ lọc' : 'Chưa có phiếu bảo hành nào'}
            hint={hasFilter ? 'Thử đổi hoặc xóa bộ lọc để xem thêm phiếu.' : 'Phiếu mới sẽ xuất hiện ở đây sau khi được tạo.'}
            action={
              hasFilter ? (
                <button className="btn btn-ghost" onClick={clear}>
                  Xóa bộ lọc
                </button>
              ) : user.role === 'NHAN_VIEN_TIEP_NHAN' ? (
                <a className="btn btn-primary" href="#/tickets/new">
                  Tạo phiếu đầu tiên
                </a>
              ) : null
            }
          />
        )}

        {!tickets.loading && !tickets.error && total > 0 && (
          <>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Khách hàng</th>
                    <th>Số điện thoại</th>
                    <th>Thiết bị</th>
                    <th>Nhóm sự cố</th>
                    <th>Ưu tiên</th>
                    <th>Trạng thái</th>
                    <th>Hạn cam kết</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentFirst(tickets.data.tickets).map((t) => (
                    <tr key={t.ticket_id} className={rowClass(t)} onClick={() => navigate(`/tickets/${t.ticket_id}`)}>
                      <td>
                        <a href={`#/tickets/${t.ticket_id}`} className="code">
                          {t.ticket_code}
                        </a>
                      </td>
                      <td>{t.customer_name}</td>
                      <td className="mono">{t.customer_phone}</td>
                      <td>{t.product_name}</td>
                      <td>{t.category_name}</td>
                      <td>
                        <span className={`badge prio-${t.priority}`}>{PRIORITY_LABEL[t.priority] || t.priority}</span>
                      </td>
                      <td>
                        <span className={`badge st-${t.status}`}>{STATUS_LABEL[t.status] || t.status}</span>
                      </td>
                      <td>
                        {formatDateTime(t.due_date)}
                        {t.is_overdue && <span className="flag flag-overdue">Quá hạn</span>}
                        {t.is_near_due && <span className="flag flag-near">Sắp quá hạn</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted">
                {total} phiếu · Trang {page}/{pages}
              </span>
              <div>
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ‹ Trước
                </button>
                <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Sau ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}