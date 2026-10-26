import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { navigate } from '../hooks/useHashRoute.js';
import { PRIORITY_LABEL, formatDateTime } from '../utils/format.js';

const NEW_DEVICE = 'new';

function FieldError({ message }) {
  return message ? <small className="field-error">{message}</small> : null;
}

// Buoc 1: tra cuu khach theo SDT (UC1), chua co thi tao khach moi (UC3)
function CustomerStep({ customer, onFound }) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [missing, setMissing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  async function search(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMissing(false);
    try {
      onFound(await api.findCustomerByPhone(phone));
    } catch (err) {
      if (err.code === 'CUSTOMER_NOT_FOUND') setMissing(true);
      else setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function createCustomer(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api.createCustomer({ full_name: newName, phone, address: newAddress || undefined });
      setMissing(false);
      onFound(created);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card step">
      <h2>1. Khách hàng</h2>
      <form className="inline-form" onSubmit={search}>
        <label className="field grow">
          <span>Số điện thoại</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setMissing(false);
              if (customer) onFound(null);
            }}
            placeholder="0901234567"
            inputMode="tel"
            className={error?.fields?.phone ? 'invalid' : ''}
          />
          <FieldError message={error?.fields?.phone} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy || phone.trim() === ''}>
          {busy ? 'Đang tra...' : 'Tra cứu'}
        </button>
      </form>

      {error && !error.fields?.phone && !error.fields?.full_name && (
        <div className="alert alert-danger" role="alert">
          {error.message}
        </div>
      )}

      {customer && (
        <dl className="info-grid">
          <div>
            <dt>Họ tên</dt>
            <dd>{customer.full_name}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd className="mono">{customer.phone}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{customer.address || 'Chưa có'}</dd>
          </div>
        </dl>
      )}

      {missing && (
        <form className="notice" onSubmit={createCustomer}>
          <p>
            <strong>Khách hàng chưa tồn tại.</strong> Nhập thông tin để tạo khách mới với số điện thoại này.
          </p>
          <div className="inline-form">
            <label className="field grow">
              <span>Họ tên</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={error?.fields?.full_name ? 'invalid' : ''}
              />
              <FieldError message={error?.fields?.full_name} />
            </label>
            <label className="field grow">
              <span>Địa chỉ</span>
              <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Tạo khách mới
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Buoc 2: chon thiet bi da co hoac nhap thiet bi moi (QT-07: bat buoc serial)
function DeviceStep({ customerId, deviceChoice, setDeviceChoice, newDevice, setNewDevice, errors }) {
  const devices = useAsync(() => api.listCustomerDevices(customerId), [customerId]);
  const list = devices.data?.devices || [];

  useEffect(() => {
    if (devices.data && list.length === 0 && deviceChoice === '') setDeviceChoice(NEW_DEVICE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.data]);

  if (devices.loading) return <LoadingState text="Đang tải thiết bị của khách..." />;
  if (devices.error) return <ErrorState error={devices.error} onRetry={devices.reload} />;

  const set = (key) => (e) => setNewDevice({ ...newDevice, [key]: e.target.value });

  return (
    <>
      <label className="field">
        <span>Thiết bị</span>
        <select
          value={deviceChoice}
          onChange={(e) => setDeviceChoice(e.target.value)}
          className={errors.device_id ? 'invalid' : ''}
        >
          <option value="">-- Chọn thiết bị --</option>
          {list.map((d) => (
            <option key={d.device_id} value={d.device_id}>
              {d.product_name} · {d.serial_no}
            </option>
          ))}
          <option value={NEW_DEVICE}>+ Thiết bị khác (nhập thủ công)</option>
        </select>
        <FieldError message={errors.device_id} />
      </label>

      {deviceChoice === NEW_DEVICE && (
        <div className="notice">
          {list.length === 0 && <p className="muted">Khách này chưa có thiết bị trong hệ thống, hãy nhập thiết bị.</p>}
          <div className="grid-3">
            <label className="field">
              <span>Tên sản phẩm</span>
              <input
                value={newDevice.product_name}
                onChange={set('product_name')}
                className={errors.product_name ? 'invalid' : ''}
              />
              <FieldError message={errors.product_name} />
            </label>
            <label className="field">
              <span>Số serial (bắt buộc)</span>
              <input
                value={newDevice.serial_no}
                onChange={set('serial_no')}
                className={errors.serial_no ? 'invalid' : ''}
              />
              <FieldError message={errors.serial_no} />
            </label>
            <label className="field">
              <span>IMEI</span>
              <input value={newDevice.imei} onChange={set('imei')} className={errors.imei ? 'invalid' : ''} />
              <FieldError message={errors.imei} />
            </label>
          </div>
        </div>
      )}
    </>
  );
}

// Goi y nhom su co, uu tien, han cam ket tu mo ta loi (FR3, FR4), cho nguoi dung ngung go 400ms
function useSuggestion(issueDesc) {
  const [state, setState] = useState({ data: null, loading: false });
  useEffect(() => {
    if (issueDesc.trim() === '') {
      setState({ data: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(() => {
      api
        .previewTicket(issueDesc)
        .then((data) => !cancelled && setState({ data, loading: false }))
        .catch(() => !cancelled && setState({ data: null, loading: false }));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [issueDesc]);
  return state;
}

export default function TicketCreate() {
  const [customer, setCustomer] = useState(null);
  const [deviceChoice, setDeviceChoice] = useState('');
  const [newDevice, setNewDevice] = useState({ product_name: '', serial_no: '', imei: '' });
  const [issueDesc, setIssueDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const suggestion = useSuggestion(issueDesc);

  const errors = error?.fields || {};

  function handleCustomer(found) {
    setCustomer(found);
    setDeviceChoice('');
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let deviceId = deviceChoice;
      if (deviceChoice === NEW_DEVICE) {
        const device = await api.createDevice({
          customer_id: customer.customer_id,
          product_name: newDevice.product_name,
          serial_no: newDevice.serial_no,
          imei: newDevice.imei || undefined,
        });
        deviceId = device.device_id;
      }
      const ticket = await api.createTicket({
        customer_id: customer.customer_id,
        device_id: Number(deviceId),
        issue_desc: issueDesc,
      });
      navigate(`/tickets/${ticket.ticket_id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const generalError = error && Object.keys(errors).length === 0 ? error : null;

  return (
    <section className="narrow">
      <div className="page-head">
        <div>
          <h1>Tạo phiếu bảo hành</h1>
          <p className="muted">Tra cứu khách, chọn thiết bị, mô tả lỗi. Hệ thống tự phân loại và tính hạn cam kết.</p>
        </div>
      </div>

      <CustomerStep customer={customer} onFound={handleCustomer} />

      {customer && (
        <form onSubmit={submit} noValidate>
          <div className="card step">
            <h2>2. Thiết bị</h2>
            <DeviceStep
              customerId={customer.customer_id}
              deviceChoice={deviceChoice}
              setDeviceChoice={setDeviceChoice}
              newDevice={newDevice}
              setNewDevice={setNewDevice}
              errors={errors}
            />
          </div>

          <div className="card step">
            <h2>3. Mô tả lỗi</h2>
            <label className="field">
              <span>Khách báo gì về thiết bị?</span>
              <textarea
                rows={4}
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="Ví dụ: máy bị đen màn hình, không lên nguồn"
                className={errors.issue_desc ? 'invalid' : ''}
              />
              <FieldError message={errors.issue_desc} />
            </label>

            <div className="suggest">
              <div>
                <small>Nhóm sự cố (đề xuất)</small>
                <strong>{suggestion.data?.category_name || '—'}</strong>
              </div>
              <div>
                <small>Mức ưu tiên</small>
                <strong>
                  {suggestion.data ? (
                    <span className={`badge prio-${suggestion.data.priority}`}>
                      {PRIORITY_LABEL[suggestion.data.priority]}
                    </span>
                  ) : (
                    '—'
                  )}
                </strong>
              </div>
              <div>
                <small>Hạn cam kết (dự kiến)</small>
                <strong>{suggestion.data ? formatDateTime(suggestion.data.due_date) : '—'}</strong>
              </div>
              {suggestion.loading && <small className="muted">Đang phân loại...</small>}
            </div>
          </div>

          {generalError && (
            <div className="alert alert-danger" role="alert">
              {generalError.message}
            </div>
          )}

          <div className="form-actions">
            <a className="btn btn-ghost" href="#/tickets">
              Hủy
            </a>
            <button className="btn btn-primary" type="submit" disabled={submitting || deviceChoice === ''}>
              {submitting ? 'Đang tạo phiếu...' : 'Tạo phiếu'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}