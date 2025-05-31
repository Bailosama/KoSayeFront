import axios from 'axios';
import { API_URL } from '../../config';
import { getToken } from '../utils/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const isAuthRoute = ['/user/register', '/user/login'].includes(config.url);

    if (!isAuthRoute) {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = token;
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération du token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;