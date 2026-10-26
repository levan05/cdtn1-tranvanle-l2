// Ba trang thai bat buoc cua moi man hinh lay du lieu: dang tai, rong, loi ket noi

export function LoadingState({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="state-box">
      <div className="state-icon" aria-hidden="true">
        ∅
      </div>
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const offline = error?.code === 'NETWORK_ERROR';
  return (
    <div className="state-box state-error" role="alert">
      <div className="state-icon" aria-hidden="true">
        !
      </div>
      <h3>{offline ? 'Không kết nối được máy chủ' : 'Không tải được dữ liệu'}</h3>
      <p className="muted">{error?.message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}