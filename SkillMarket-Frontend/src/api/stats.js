import API from './axios';

export const getClientStats = () => API.get('/stats/client');
export const getProviderStats = () => API.get('/stats/provider');