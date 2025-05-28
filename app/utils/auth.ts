import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'userToken';

export const getToken = async (): Promise<string | null> => {
  try {
    let token: string | null = null;

    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
    } else {
      // Sur mobile, on essaie d'abord SecureStore
      try {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch (secureStoreError) {
        console.log('auth.ts - SecureStore non disponible, utilisation de AsyncStorage');
        // Si SecureStore échoue, on utilise AsyncStorage comme fallback
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
    }

    if (!token) {
      console.log('auth.ts - getToken : Aucun token trouvé');
      return null;
    }

    // Vérifier que le token est bien formaté
    if (!token.startsWith('Bearer ')) {
      console.log('auth.ts - getToken : Formatage du token');
      return `Bearer ${token}`;
    }

    console.log('auth.ts - getToken : Token trouvé');
    return token;
  } catch (error) {
    console.error('auth.ts - Erreur lors de la récupération du token:', error);
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    console.log('=== DÉBUT SAUVEGARDE TOKEN ===');
    console.log('Plateforme:', Platform.OS);

    // Supprimer le préfixe Bearer si présent
    const cleanToken = token.replace('Bearer ', '');
    console.log('Token nettoyé:', cleanToken ? 'Présent' : 'Absent');

    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, cleanToken);
      console.log('Token sauvegardé dans localStorage');
    } else {
      // Sur mobile, on essaie d'abord SecureStore
      try {
        console.log('Tentative de sauvegarde dans SecureStore...');
        await SecureStore.setItemAsync(TOKEN_KEY, cleanToken);
        console.log('Token sauvegardé avec succès dans SecureStore');
      } catch (secureStoreError) {
        console.error('Erreur SecureStore:', secureStoreError);
        console.log('Tentative de sauvegarde dans AsyncStorage...');
        // Si SecureStore échoue, on utilise AsyncStorage comme fallback
        await AsyncStorage.setItem(TOKEN_KEY, cleanToken);
        console.log('Token sauvegardé avec succès dans AsyncStorage');
      }
    }

    console.log('=== FIN SAUVEGARDE TOKEN ===');
  } catch (error: any) {
    console.error('=== ERREUR SAUVEGARDE TOKEN ===');
    console.error('Type:', error?.constructor?.name);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    throw error;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      // Sur mobile, nettoyer les deux stockages par sécurité
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (secureStoreError) {
        console.log('auth.ts - SecureStore non disponible pour la suppression');
      }
      await AsyncStorage.removeItem(TOKEN_KEY);
    }

    console.log('auth.ts - Token supprimé');
  } catch (error) {
    console.error('auth.ts - Erreur lors de la suppression du token:', error);
    throw error;
  }
};