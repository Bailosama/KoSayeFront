import { Linking } from 'react-native';
import api from './api';

export interface SocialAuthResponse {
  user: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    profilePicture: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export const authApi = {
  // Redirection vers Google
  redirectToGoogle: async () => {
    try {
      const url = `${api.defaults.baseURL}/auth/google`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error('Impossible d\'ouvrir le navigateur');
      }
    } catch (error) {
      console.error('Erreur lors de la redirection vers Google:', error);
      throw new Error('Erreur lors de la redirection vers Google');
    }
  },

  // Redirection vers Facebook
  redirectToFacebook: () => {
    window.location.href = `${api.defaults.baseURL}/auth/facebook`;
  },

  // Gérer le callback de Google
  handleGoogleCallback: async (code: string): Promise<SocialAuthResponse> => {
    try {
      const response = await api.get(`/auth/google/callback?code=${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'authentification Google:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'authentification Google');
    }
  },

  // Gérer le callback de Facebook
  handleFacebookCallback: async (code: string): Promise<SocialAuthResponse> => {
    try {
      const response = await api.get(`/auth/facebook/callback?code=${code}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'authentification Facebook:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'authentification Facebook');
    }
  }
}; 