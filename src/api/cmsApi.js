const BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'cms_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

export async function requestOtp(email) {
  return authFetch('/api/cms/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function verifyOtp(email, otp) {
  return authFetch('/api/cms/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });
}

export async function listQr({ used, limit = 20, skip = 0 } = {}) {
  const params = new URLSearchParams({ limit, skip });
  if (used !== undefined) params.set('used', String(used));
  return authFetch(`/api/cms/qrcodes?${params}`);
}

export async function generateQr({ count = 1, product = {} } = {}) {
  return authFetch('/api/cms/qrcodes/generate', {
    method: 'POST',
    body: JSON.stringify({ count: Number(count), product })
  });
}

export async function getQrDetails(id) {
  return authFetch(`/api/cms/qrcodes/${id}`);
}

export async function updateQrUsed(id, used) {
  return authFetch(`/api/cms/qrcodes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ used })
  });
}

export async function exportPdf(ids) {
  const token = getToken();
  const res = await fetch(`${BASE}/api/cms/qrcodes/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ids })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Export failed');
  }
  return res.blob();
}

// ── Admin user management ──────────────────────────────────────────────────

export async function listAdmins() {
  return authFetch('/api/cms/admins');
}

export async function createAdminUser(email) {
  return authFetch('/api/cms/admins', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function toggleAdminUser(id, isActive) {
  return authFetch(`/api/cms/admins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
}
