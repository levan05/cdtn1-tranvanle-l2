import { useState } from 'react';
import { api } from '../api/client.js';
import { ROLE_LABEL } from '../components/Layout.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useAsync } from '../hooks/useAsync.js';

const EMPTY = { username: '', password: '', full_name: '' };

export default function UserManage() {
  const users = useAsync(() => api.listUsers(), []);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const errors = error?.fields || {};
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const list = users.data?.data || [];

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const user = await api.createUser(form);
      setCreated(user);
      setForm(EMPTY);
      users.reload();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Tài khoản nhân viên</h1>
          <p className="muted">Tạo tài khoản nhân viên tiếp nhận cho trung tâm bạn phụ trách</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card table-card">
          {users.loading && !users.data && <LoadingState text="Đang tải danh sách tài khoản..." />}
          {users.error && <ErrorState error={users.error} onRetry={users.reload} />}
          {users.data && list.length === 0 && <EmptyState title="Chưa có tài khoản nào" hint="Hãy tạo tài khoản đầu tiên ở khung bên cạnh." />}
          {list.length > 0 && (
            <div className="table-scroll">
              <table className="table plain">
                <thead>
                  <tr>
                    <th>Tên đăng nhập</th>
                    <th>Họ tên</th>
                    <th>Vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.user_id}>
                      <td className="code">{u.username}</td>
                      <td>{u.full_name}</td>
                      <td>
                        <span className={`badge ${u.role === 'QUAN_LY' ? 'st-DA_PHAN_CONG' : 'st-MOI'}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="card step" onSubmit={submit} noValidate>
          <h2>Tạo tài khoản mới</h2>
          {created && (
            <div className="alert alert-success" role="status">
              Đã tạo tài khoản <strong>{created.username}</strong>
            </div>
          )}
          {error && Object.keys(errors).length === 0 && (
            <div className="alert alert-danger" role="alert">
              {error.message}
            </div>
          )}
          <label className="field">
            <span>Tên đăng nhập</span>
            <input value={form.username} onChange={set('username')} autoComplete="off" className={errors.username ? 'invalid' : ''} />
            {errors.username && <small className="field-error">{errors.username}</small>}
          </label>
          <label className="field">
            <span>Họ tên</span>
            <input value={form.full_name} onChange={set('full_name')} className={errors.full_name ? 'invalid' : ''} />
            {errors.full_name && <small className="field-error">{errors.full_name}</small>}
          </label>
          <label className="field">
            <span>Mật khẩu (tối thiểu 8 ký tự)</span>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" className={errors.password ? 'invalid' : ''} />
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>
          <p className="muted small">Vai trò là nhân viên tiếp nhận, thuộc trung tâm của bạn.</p>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </section>
  );
}