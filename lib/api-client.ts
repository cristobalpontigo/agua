// API client service for all CRUD operations
const API_BASE_URL = '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Generic fetch wrapper
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error || 'An error occurred',
      status: response.status,
    };
  } catch (error: any) {
    return {
      error: error.message || 'Network error',
      status: 500,
    };
  }
}

// Clients API
export const clientsApi = {
  getAll: () => apiCall('/clients'),
  getById: (id: string) => apiCall(`/clients/${id}`),
  create: (data: any) => apiCall('/clients', 'POST', data),
  update: (id: string, data: any) => apiCall(`/clients/${id}`, 'PUT', data),
  delete: (id: string) => apiCall(`/clients/${id}`, 'DELETE'),
};

// Sales API
export const salesApi = {
  getAll: (params?: { clientId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.status) query.append('status', params.status);
    return apiCall(`/sales${query.toString() ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiCall(`/sales/${id}`),
  create: (data: any) => apiCall('/sales', 'POST', data),
  update: (id: string, data: any) => apiCall(`/sales/${id}`, 'PUT', data),
  delete: (id: string) => apiCall(`/sales/${id}`, 'DELETE'),
};

// Payments API
export const paymentsApi = {
  getAll: (params?: { clientId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.status) query.append('status', params.status);
    return apiCall(`/payments${query.toString() ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiCall(`/payments/${id}`),
  create: (data: any) => apiCall('/payments', 'POST', data),
  update: (id: string, data: any) => apiCall(`/payments/${id}`, 'PUT', data),
  delete: (id: string) => apiCall(`/payments/${id}`, 'DELETE'),
};
