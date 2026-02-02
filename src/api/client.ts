const BASE_URL = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string; name: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),

  getMe: () =>
    request<{ id: number; email: string; name: string }>('/auth/me'),

  // Dashboard
  getDashboard: () =>
    request<{
      itemsOut: number;
      overdueOrders: number;
      activeOrders: number;
      recentActivity: Array<{
        id: number;
        type: 'checkout' | 'checkin';
        orderName: string;
        itemCount: number;
        timestamp: string;
      }>;
    }>('/dashboard'),

  // Orders
  getOrders: (status?: string) =>
    request<Array<{
      id: number;
      customerName: string;
      status: string;
      eventDate: string | null;
      expectedReturnDate: string | null;
      itemCount: number;
    }>>(`/orders${status ? `?status=${status}` : ''}`),

  getOrder: (id: number) =>
    request<{
      id: number;
      customerName: string;
      customerPhone: string | null;
      customerEmail: string | null;
      deliveryAddress: string | null;
      eventDate: string | null;
      outDate: string | null;
      expectedReturnDate: string | null;
      actualReturnDate: string | null;
      status: string;
      notes: string | null;
      items: Array<{
        id: number;
        name: string;
        quantity: number;
        quantityCheckedOut: number;
        quantityCheckedIn: number;
        notes: string | null;
      }>;
    }>(`/orders/${id}`),

  createOrder: (data: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
    eventDate?: string;
    expectedReturnDate?: string;
    notes?: string;
    items: Array<{
      catalogItemId?: number;
      customItemName?: string;
      quantity: number;
    }>;
  }) =>
    request<{ id: number }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrder: (id: number, data: Partial<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress: string;
    eventDate: string;
    expectedReturnDate: string;
    status: string;
    notes: string;
  }>) =>
    request<{ success: boolean }>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteOrder: (id: number) =>
    request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),

  checkoutOrder: (id: number, items: Array<{ itemId: number; quantity: number }>) =>
    request<{ success: boolean }>(`/orders/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  checkinOrder: (id: number, items: Array<{ itemId: number; quantity: number }>) =>
    request<{ success: boolean }>(`/orders/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // Catalog
  getCatalogItems: () =>
    request<Array<{
      id: number;
      name: string;
      category: string | null;
      description: string | null;
      isActive: boolean;
    }>>('/items'),

  createCatalogItem: (data: {
    name: string;
    category?: string;
    description?: string;
  }) =>
    request<{ id: number }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCatalogItem: (id: number, data: Partial<{
    name: string;
    category: string;
    description: string;
    isActive: boolean;
  }>) =>
    request<{ success: boolean }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCatalogItem: (id: number) =>
    request<{ success: boolean }>(`/items/${id}`, { method: 'DELETE' }),
};
