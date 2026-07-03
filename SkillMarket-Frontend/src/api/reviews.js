import api from './axios';

export const submitReview = (serviceId, data) => api.post(`/reviews/${serviceId}`, data);
export const getReviews = (serviceId) => api.get(`/reviews/${serviceId}`);