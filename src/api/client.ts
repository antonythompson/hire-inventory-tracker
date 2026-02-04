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

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: number;
  email: string;
  username: string | null;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    request<{ token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }
    ),

  getMe: () =>
    request<User>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

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

  addItemToOrder: (orderId: number, data: {
    catalogItemId?: number;
    customItemName?: string;
    quantity: number;
  }) =>
    request<{ id: number }>(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
      imageUrl: string | null;
      isActive: boolean;
    }>>('/items'),

  createCatalogItem: (data: {
    name: string;
    category?: string;
    description?: string;
    imageUrl?: string;
  }) =>
    request<{ id: number }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCatalogItem: (id: number, data: Partial<{
    name: string;
    category: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
  }>) =>
    request<{ success: boolean }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCatalogItem: (id: number) =>
    request<{ success: boolean }>(`/items/${id}`, { method: 'DELETE' }),

  // Images
  uploadImage: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json() as Promise<{ url: string; filename: string }>;
  },

  deleteImage: (path: string) =>
    request<{ success: boolean }>(`/images/${path}`, { method: 'DELETE' }),

  // Users
  getUsers: () =>
    request<User[]>('/users'),

  getUser: (id: number) =>
    request<User>(`/users/${id}`),

  createUser: (data: {
    email: string;
    username?: string;
    password: string;
    name: string;
    role: UserRole;
  }) =>
    request<{ id: number }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: Partial<{
    email: string;
    username: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  }>) =>
    request<{ success: boolean }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  changeUserPassword: (id: number, newPassword: string) =>
    request<{ success: boolean }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),
};
