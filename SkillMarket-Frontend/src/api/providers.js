import api from './axios';

export const getProviderProfile = (providerId) => api.get(`/providers/${providerId}`);