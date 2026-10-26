import { useCallback, useEffect, useState } from 'react';
import { session, setUnauthorizedHandler } from './api/client.js';
import Login from './pages/Login.jsx';

export default function App() {
  const [user, setUser] = useState(() => (session.getToken() ? session.getUser() : null));

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  // Token het han thi backend tra 401, client xoa phien va day nguoi dung ve man hinh dang nhap
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  function handleLoggedIn(token, loggedInUser) {
    session.save(token, loggedInUser);
    setUser(loggedInUser);
  }

  if (!user) return <Login onLoggedIn={handleLoggedIn} />;

  return (
    <main className="splash">
      <div className="splash-logo">M</div>
      <h1>Xin chào, {user.full_name}</h1>
      <p>Các màn hình nghiệp vụ sẽ được thêm ở bước tiếp theo</p>
      <button className="btn btn-ghost" onClick={logout}>
        Đăng xuất
      </button>
    </main>
  );
}
