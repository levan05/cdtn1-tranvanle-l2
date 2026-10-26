import { useState } from 'react';
import { api } from '../api/client.js';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { PRIORITY_LABEL, STATUS_LABEL, formatDateTime } from '../utils/format.js';

const FLOW = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT', 'DA_DONG'];

function Info({ label, children }) {
  return (
    <div className="info-item">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

// Vong doi mot chieu (QT-04): chi hien buoc ke tiep, khong co lua chon quay lai
function StatusPanel({ ticket, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const index = FLOW.indexOf(ticket.status);
  const next = FLOW[index + 1];

  async function advance() {
    setBusy(true);
    setError(null);
    try {
      await api.changeTicketStatus(ticket.ticket_id, next);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card step">
      <h2>Cập nhật trạng thái</h2>
      <ol className="stepper">
        {FLOW.map((s, i) => (
          <li key={s} className={i < index ? 'done' : i === index ? 'current' : ''}>
            <span className="dot">{i < index ? '✓' : i + 1}</span>
            <span>{STATUS_LABEL[s]}</span>
          </li>
        ))}
      </ol>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error.fields?.to_status || error.message}
        </div>
      )}

      {next ? (
        <div className="status-action">
          <button className="btn btn-primary" onClick={advance} disabled={busy}>
            {busy ? 'Đang cập nhật...' : `Chuyển sang "${STATUS_LABEL[next]}"`}
          </button>
          <small className="muted">Trạng thái chỉ đi tiến theo thứ tự, không được chuyển ngược lại.</small>
        </div>
      ) : (
        <p className="muted">Phiếu đã đóng, không thể chuyển trạng thái tiếp.</p>
      )}
    </div>
  );
}

export default function TicketDetail({ ticketId }) {
  const state = useAsync(() => api.getTicket(ticketId), [ticketId]);
  const t = state.data;

  return (
    <section>
      <a className="back-link" href="#/tickets">
        ‹ Danh sách phiếu
      </a>

      {state.loading && !t && <LoadingState text="Đang tải chi tiết phiếu..." />}

      {state.error?.code === 'TICKET_NOT_FOUND' && (
        <EmptyState
          title="Không tìm thấy phiếu"
          hint="Phiếu không tồn tại hoặc không thuộc trung tâm của bạn."
          action={
            <a className="btn btn-primary" href="#/tickets">
              Về danh sách phiếu
            </a>
          }
        />
      )}
      {state.error && state.error.code !== 'TICKET_NOT_FOUND' && <ErrorState error={state.error} onRetry={state.reload} />}

      {t && (
        <>
          <div className="page-head">
            <div>
              <h1>{t.ticket_code}</h1>
              <p className="muted">Tiếp nhận lúc {formatDateTime(t.received_at)}</p>
            </div>
            <div className="head-badges">
              <span className={`badge prio-${t.priority}`}>Ưu tiên {PRIORITY_LABEL[t.priority]}</span>
              <span className={`badge st-${t.status}`}>{STATUS_LABEL[t.status]}</span>
            </div>
          </div>

          <div className="detail-grid">
            <div>
              <div className="card step">
                <h2>Khách hàng</h2>
                <dl className="info-list">
                  <Info label="Họ tên">{t.customer_name}</Info>
                  <Info label="Số điện thoại">
                    <span className="mono">{t.customer_phone}</span>
                  </Info>
                  <Info label="Địa chỉ">{t.customer_address}</Info>
                </dl>
              </div>

              <div className="card step">
                <h2>Thiết bị</h2>
                <dl className="info-list">
                  <Info label="Tên sản phẩm">{t.product_name}</Info>
                  <Info label="IMEI">{t.imei}</Info>
                  <Info label="Số serial">{t.serial_no}</Info>
                </dl>
              </div>

              <div className="card step">
                <h2>Sự cố</h2>
                <dl className="info-list">
                  <Info label="Nhóm sự cố">{t.category_name}</Info>
                  <Info label="Trung tâm">{t.center_name}</Info>
                  <Info label="Hạn cam kết">{formatDateTime(t.due_date)}</Info>
                </dl>
                <div>
                  <small className="muted">Mô tả lỗi</small>
                  <p className="issue-desc">{t.issue_desc}</p>
                </div>
              </div>
            </div>

            <div>
              <StatusPanel ticket={t} onChanged={state.reload} />

              <div className="card step">
                <h2>Lịch sử trạng thái</h2>
                <ul className="timeline">
                  {[...t.logs].reverse().map((log) => (
                    <li key={log.log_id}>
                      <strong>
                        {log.from_status ? `${STATUS_LABEL[log.from_status]} → ` : 'Tạo phiếu → '}
                        {STATUS_LABEL[log.to_status]}
                      </strong>
                      <small className="muted">
                        {formatDateTime(log.changed_at)} · {log.changed_by}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}