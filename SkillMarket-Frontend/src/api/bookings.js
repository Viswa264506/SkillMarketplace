import API from './axios';

export const createBooking = (data) => API.post('/bookings', data);
export const getMyBookings = () => API.get('/bookings/my-bookings');
export const getProviderBookings = () => API.get('/bookings/provider-bookings');
export const updateBookingStatus = (id, status) => API.put(`/bookings/${id}/status?status=${status}`);
export const cancelBooking = (id) => API.put(`/bookings/${id}/cancel`);