export const ROLE_LABEL = {
  NHAN_VIEN_TIEP_NHAN: 'Nhân viên tiếp nhận',
  QUAN_LY: 'Quản lý',
};

// Menu theo vai tro: chi nhan vien tiep nhan tao phieu, chi quan ly quan ly tai khoan
function menuFor(role) {
  const items = [{ to: '/tickets', label: 'Phiếu bảo hành', match: (p) => p === '/tickets' || /^\/tickets\/\d+$/.test(p) }];
  if (role === 'NHAN_VIEN_TIEP_NHAN') items.push({ to: '/tickets/new', label: 'Tạo phiếu', match: (p) => p === '/tickets/new' });
  if (role === 'QUAN_LY') items.push({ to: '/users', label: 'Tài khoản', match: (p) => p === '/users' });
  return items;
}

export default function Layout({ user, path, onLogout, children }) {
  const initial = (user.full_name || user.username || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="topbar-brand" href="#/tickets">
          <span className="brand-dot">M</span>
          <span>Mekong Mobile</span>
        </a>
        <nav className="topbar-nav" aria-label="Điều hướng chính">
          {menuFor(user.role).map((item) => (
            <a key={item.to} href={`#${item.to}`} className={item.match(path) ? 'active' : ''}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="topbar-user">
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <div className="who">
            <strong>{user.full_name}</strong>
            <small>{ROLE_LABEL[user.role] || user.role}</small>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}