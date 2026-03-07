const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('eco_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(res);
  }
}

export const api = new ApiClient(API_URL);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { businessName: string; email: string; password: string; tier: string }) =>
    api.post<{ success: boolean; data: { token: string; user: any } }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; data: { token: string; user: any } }>('/auth/login', data),

  // /auth/me returns { success, data: <user object> }
  me: () =>
    api.get<{ success: boolean; data: any }>('/auth/me'),

  // /auth/upgrade returns { success, data: <user object> }
  upgrade: (data: { tier: string; paymentMethod?: string }) =>
    api.patch<{ success: boolean; data: any }>('/auth/upgrade', data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get<{ success: boolean; data: any }>('/dashboard/stats'),
};

// ─── Suppliers ───────────────────────────────────────────────────────────────
export const suppliersApi = {
  getAll: () =>
    api.get<{ success: boolean; data: any[] }>('/suppliers'),

  getMetrics: () =>
    api.get<{ success: boolean; data: any }>('/suppliers/metrics/summary'),

  create: (data: { name: string; category: string; email: string }) =>
    api.post<{ success: boolean; data: any }>('/suppliers', data),

  update: (id: string, data: Partial<any>) =>
    api.patch<{ success: boolean; data: any }>(`/suppliers/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/suppliers/${id}`),
};

// ─── Analysis ────────────────────────────────────────────────────────────────
export const analysisApi = {
  runAudit: (transactions: string) =>
    api.post<{ success: boolean; data: any }>('/analysis/audit', { transactions }),

  getReports: () =>
    api.get<{ success: boolean; data: any[] }>('/analysis/reports'),

  chat: (history: { role: string; parts: { text: string }[] }[]) =>
    api.post<{ success: boolean; data: { response: string } }>('/analysis/chat', { history }),
};

// ─── Carbon ──────────────────────────────────────────────────────────────────
export const carbonApi = {
  getAll: () =>
    api.get<{ success: boolean; data: any }>('/carbon'),

  create: (data: any) =>
    api.post<{ success: boolean; data: any }>('/carbon', data),

  verify: (id: string) =>
    api.patch<{ success: boolean; data: any }>(`/carbon/${id}/verify`),

  listOnMarket: (id: string) =>
    api.patch<{ success: boolean; data: any }>(`/carbon/${id}/list`),

  sell: (id: string) =>
    api.patch<{ success: boolean; data: any }>(`/carbon/${id}/sell`),

  valuate: (id: string) =>
    api.post<{ success: boolean; data: any }>(`/carbon/${id}/valuate`),
};

// ─── Marketplace ─────────────────────────────────────────────────────────────
export const marketplaceApi = {
  getFunds: () =>
    api.get<{ success: boolean; data: any[] }>('/marketplace/funds'),

  applyToFund: (fundId: string) =>
    api.post<{ success: boolean; data: any }>(`/marketplace/apply/${fundId}`),

  getApplications: () =>
    api.get<{ success: boolean; data: any[] }>('/marketplace/applications'),

  getDashboardSummary: () =>
    api.get<{ success: boolean; data: any }>('/marketplace/dashboard-summary'),
};