import api from './axios';

export const getAdminStats = () => api.get('/admin/stats');
export const getAllUsers = () => api.get('/admin/users');
export const getAllServices = () => api.get('/admin/services');
export const getAllBookings = () => api.get('/admin/bookings');
export const toggleUserActive = (id) => api.put(`/admin/users/${id}/toggle-active`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const deleteService = (id) => api.delete(`/admin/services/${id}`);
export const deleteBooking = (id) => api.delete(`/admin/bookings/${id}`);
export const getPendingVerifications = () => api.get('/admin/pending-verifications');
export const verifyProvider = (id) => api.put(`/admin/users/${id}/verify-provider`);
export const rejectProvider = (id) => api.put(`/admin/users/${id}/reject-provider`);