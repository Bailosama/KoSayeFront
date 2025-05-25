import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from '../../config';

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
    let token = null;

    if (Platform.OS !== 'web' && !isAuthRoute) {
      try {
        token = await SecureStore.getItemAsync('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération du token (SecureStore):', error);
      }
    } else if (Platform.OS === 'web' && !isAuthRoute) {
      token = localStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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