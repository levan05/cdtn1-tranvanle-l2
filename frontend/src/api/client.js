const TOKEN_KEY = 'mekong.token';
const USER_KEY = 'mekong.user';
const BASE = import.meta.env?.VITE_API_BASE ?? '';

// Loi tu API hoac loi mang, giu ma loi va ten tung truong sai de giao dien hien thi
export class ApiError extends Error {
  constructor(code, message, status = 0, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, path, { query, body } = {}) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const url = `${BASE}${path}${params.toString() ? `?${params}` : ''}`;

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = session.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng rồi thử lại.');
  }

  // Backend tat thi proxy cua Vite hoac may chu trung gian tra 502/503/504, coi nhu mat ket noi
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiError('NETWORK_ERROR', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng rồi thử lại.', response.status);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const err = data?.error;
    if (response.status === 401 && token) {
      session.clear();
      onUnauthorized();
    }
    throw new ApiError(
      err?.code || 'UNKNOWN_ERROR',
      err?.message || 'Hệ thống gặp sự cố, vui lòng thử lại sau.',
      response.status,
      err?.fields || {}
    );
  }
  return data;
}

export const api = {
  login: (username, password) => request('POST', '/api/auth/login', { body: { username, password } }),

  listTickets: (query) => request('GET', '/api/tickets', { query }),
  getTicket: (id) => request('GET', `/api/tickets/${id}`),
  createTicket: (body) => request('POST', '/api/tickets', { body }),
  previewTicket: (issueDesc) => request('POST', '/api/tickets/preview', { body: { issue_desc: issueDesc } }),
  changeTicketStatus: (id, toStatus) => request('PATCH', `/api/tickets/${id}/status`, { body: { to_status: toStatus } }),

  findCustomerByPhone: (phone) => request('GET', '/api/customers', { query: { phone } }),
  createCustomer: (body) => request('POST', '/api/customers', { body }),
  listCustomerDevices: (customerId) => request('GET', `/api/customers/${customerId}/devices`),
  createDevice: (body) => request('POST', '/api/devices', { body }),

  listUsers: () => request('GET', '/api/users'),
  listCategories: () => request('GET', '/api/categories'),
  createUser: (body) => request('POST', '/api/users', { body }),
};
