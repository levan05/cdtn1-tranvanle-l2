import { useCallback, useEffect, useState } from 'react';
import { session, setUnauthorizedHandler } from './api/client.js';
import Layout from './components/Layout.jsx';
import { EmptyState } from './components/StateViews.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import Login from './pages/Login.jsx';
import TicketCreate from './pages/TicketCreate.jsx';
import TicketList from './pages/TicketList.jsx';

export default function App() {
  const [user, setUser] = useState(() => (session.getToken() ? session.getUser() : null));
  const path = useHashRoute();

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
    <Layout user={user} path={path} onLogout={logout}>
      {path === '/tickets' ? (
        <TicketList user={user} />
      ) : path === '/tickets/new' && user.role === 'NHAN_VIEN_TIEP_NHAN' ? (
        <TicketCreate />
      ) : (
        <EmptyState title="Màn hình đang được xây dựng" hint={`Đường dẫn hiện tại: ${path}`} />
      )}
    </Layout>
  );
}