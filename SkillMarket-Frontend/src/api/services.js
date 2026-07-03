import API from './axios';

export const createService = (data) => API.post('/services', data);
export const getAllServices = () => API.get('/services');
export const searchServices = (keyword) => API.get(`/services/search?keyword=${keyword}`);
export const getByCategory = (category) => API.get(`/services/category/${category}`);
export const getMyServices = () => API.get('/services/my-services');
export const deleteService = (id) => API.delete(`/services/${id}`);
export const getRecommendations = () => API.get('/recommendations');
export const getNearbyProviders = (lat, lng, radius = 10) => 
  API.get(`/services/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
export const getServiceById = (id) => API.get(`/services/${id}`);