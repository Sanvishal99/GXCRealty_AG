import { STORAGE_KEY } from './constants';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY.AUTH_TOKEN);
}

export function setToken(token: string) {
  localStorage.setItem(STORAGE_KEY.AUTH_TOKEN, token);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEY.USER_PROFILE);
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; phone: string; referralCode?: string }) =>
    request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validateInvite: (code: string) =>
    request<{ valid: boolean; referrerEmail: string; referrerName: string; code: string }>(`/auth/invite/${code}`),
};

// ── Users ────────────────────────────────────────────────────────────────────
export const users = {
  me: () => request<any>('/users/me'),
  list: (params?: { role?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/users${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => request<any>(`/users/${id}`),
  upline: (id: string) => request<any[]>(`/users/${id}/upline`),
  downline: (id: string) => request<any[]>(`/users/${id}/downline`),
  updateStatus: (id: string, status: string) =>
    request<any>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  resetPassword: (id: string, newPassword: string) =>
    request<any>(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  create: (data: { email: string; phone: string; password: string; role: string; status: string; referralCode?: string }) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Properties ───────────────────────────────────────────────────────────────
export const properties = {
  list: (params?: { city?: string; type?: string; stage?: string; minPrice?: number; maxPrice?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString();
    return request<any[]>(`/properties${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/properties/${id}`),
  mine: () => request<any[]>('/properties/company/mine'),
  adminAll: () => request<any[]>('/properties/admin/all'),
  create: (data: any) => request<any>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/properties/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  interests: (id: string, days = 30) => request<any[]>(`/properties/${id}/interests?days=${days}`),
};

// ── Leads ─────────────────────────────────────────────────────────────────────
export const leads = {
  list: () => request<any[]>('/leads'),
  create: (data: any) => request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/leads/${id}`, { method: 'DELETE' }),
  tagProperty: (leadId: string, propertyId: string) =>
    request<any>(`/leads/${leadId}/interested-properties`, { method: 'POST', body: JSON.stringify({ propertyId }) }),
  untagProperty: (leadId: string, propertyId: string) =>
    request<void>(`/leads/${leadId}/interested-properties/${propertyId}`, { method: 'DELETE' }),
  scheduleVisit: (leadId: string, data: any) =>
    request<any>(`/leads/${leadId}/schedule-visit`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Deals ─────────────────────────────────────────────────────────────────────
export const deals = {
  list: (params?: { agentId?: string; companyId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/deals${qs ? `?${qs}` : ''}`);
  },
  close: (data: { propertyId: string }) =>
    request<any>('/deals/close', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Visits ───────────────────────────────────────────────────────────────────
export const visits = {
  list: () => request<any[]>('/visits'),
  request: (data: { propertyId: string; clientName: string; clientPhone: string; scheduledAt: string }) =>
    request<any>('/visits', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/visits/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  complete: (id: string) =>
    request<any>(`/visits/${id}/complete`, { method: 'PATCH' }),
};

// ── KYC ──────────────────────────────────────────────────────────────────────
export const kyc = {
  submit: (data: { aadhaarNumber: string; panNumber: string; selfieUrl: string }) =>
    request<any>('/kyc/submit', { method: 'POST', body: JSON.stringify(data) }),
  verify: (userId: string, isVerified: boolean, rejectionReason?: string) =>
    request<any>(`/kyc/verify/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified, rejectionReason }),
    }),
};

// ── Wallet ───────────────────────────────────────────────────────────────────
export const wallet = {
  get: () => request<any>('/wallet'),
  withdraw: (amount: number) =>
    request<any>('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
};

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chat = {
  contacts: () => request<any[]>('/chat/contacts'),
  history: (userId: string) => request<any[]>(`/chat/history/${userId}`),
};

// ── Admin Analytics ───────────────────────────────────────────────────────────
export const analytics = {
  platform: () => request<any>('/analytics/platform'),
};

// ── Platform config ───────────────────────────────────────────────────────────
export const config = {
  get: () => request<any>('/config'),
  update: (data: any) => request<any>('/config', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const withdrawals = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`/withdrawals${qs}`);
  },
  request: (data: { amount: number; bankName?: string; accountNumber?: string; ifscCode?: string; accountName?: string; upiId?: string }) =>
    request<any>('/withdrawals', { method: 'POST', body: JSON.stringify(data) }),
  process: (id: string, action: 'APPROVE' | 'REJECT' | 'PAY', adminNote?: string) =>
    request<any>(`/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify({ action, adminNote }) }),
};

// ── Company Invites ───────────────────────────────────────────────────────────
export const companyInvites = {
  list: () => request<any[]>('/company-invites'),
  create: (data: { email?: string; note?: string }) =>
    request<any>('/company-invites', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/company-invites/${id}`, { method: 'DELETE' }),
  validate: (token: string) => request<any>(`/company-invites/validate/${token}`),
  registerCompany: (token: string, data: { email: string; password: string; phone: string }) =>
    request<any>('/auth/register-company', { method: 'POST', body: JSON.stringify({ token, ...data }) }),
};

// ── Agent Analytics ───────────────────────────────────────────────────────────
export const agentAnalytics = {
  me: () => request<any>('/analytics/me'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditLogs = {
  list: (entity?: string, take?: number) => {
    const params = new URLSearchParams();
    if (entity) params.set('entity', entity);
    if (take) params.set('take', String(take));
    const qs = params.toString();
    return request<any[]>(`/analytics/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

// ── Bulk Import ───────────────────────────────────────────────────────────────
export const bulkImport = {
  properties: (rows: any[]) =>
    request<any>('/properties/bulk-import', { method: 'POST', body: JSON.stringify({ rows }) }),
};

// ── Network / Downline ────────────────────────────────────────────────────────
export const network = {
  tree: () => request<any>('/network/tree'),
  node: (userId: string, depth?: number) =>
    request<any>(`/network/node/${userId}${depth ? `?depth=${depth}` : ''}`),
  summary: () => request<any>('/network/summary'),
  activity: (limit?: number) =>
    request<any[]>(`/network/activity${limit ? `?limit=${limit}` : ''}`),
};

// ── Access Requests ───────────────────────────────────────────────────────────
export const accessRequests = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<any[]>(`/access-requests${qs}`);
  },
  pendingCount: () => request<{ count: number }>('/access-requests/pending-count'),
  review: (id: string, status: string, adminNote?: string) =>
    request<any>(`/access-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }),
};
