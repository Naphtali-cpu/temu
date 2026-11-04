import { apiClient } from './client.js';

export const authApi = {
  login: (payload) => apiClient.post('/auth/login', payload).then((res) => res.data),
  register: (payload) => apiClient.post('/auth/register', payload).then((res) => res.data),
  me: () => apiClient.get('/auth/me').then((res) => res.data.user),
  logout: () => apiClient.post('/auth/logout'),
};

export const propertiesApi = {
  list: (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    return apiClient.get('/properties', { params }).then((res) => res.data);
  },
  get: (id) => apiClient.get(`/properties/${id}`).then((res) => res.data),
  create: (payload) => apiClient.post('/properties', payload).then((res) => res.data),
  update: (id, payload) => apiClient.put(`/properties/${id}`, payload).then((res) => res.data),
  setStatus: (id, status) => apiClient.patch(`/properties/${id}/status`, { status }).then((res) => res.data),
  reorder: (ids) => apiClient.post('/properties/reorder', { ids }).then((res) => res.data),
  remove: (id) => apiClient.delete(`/properties/${id}`),
};

export const inquiriesApi = {
  list: (status) => apiClient.get('/inquiries', { params: status ? { status } : {} }).then((res) => res.data),
  submit: (payload) => apiClient.post('/inquiries', payload).then((res) => res.data),
  setStatus: (id, status) => apiClient.patch(`/inquiries/${id}/status`, { status }).then((res) => res.data),
};

export const uploadsApi = {
  image: (dataUrl) => apiClient.post('/uploads', { dataUrl }).then((res) => res.data),
};

export const adminApi = {
  stats: () => apiClient.get('/admin/stats').then((res) => res.data),
};
