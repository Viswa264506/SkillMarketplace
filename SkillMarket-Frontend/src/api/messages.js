import API from './axios';

export const getMessages = (bookingId) => API.get(`/messages/${bookingId}`);
export const sendMessage = (bookingId, content) => API.post(`/messages/${bookingId}`, { content });
export const getUnreadCount = () => API.get('/messages/unread-count');
export const getUnreadByBooking = () => API.get('/messages/unread-by-booking');