import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/api';
import { getToken, removeToken, setToken } from '../utils/auth';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  adress: string;
  profilePicture: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    phone: string;
    adress: string;
  }) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = async () => {
    try {
      console.log('=== Vérification du token ===');
      const token = await getToken();

      if (!token) {
        console.log('Pas de token trouvé');
        setUser(null);
        setIsInitialized(true);
        return false;
      }

      console.log('Token trouvé, configuration des headers');
      // Configure le token dans les headers pour toutes les requêtes futures
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        console.log('Récupération du profil utilisateur');
        const response = await api.get('/user/profile');

        if (response.data?.data) {
          console.log('Profil utilisateur récupéré');
          setUser(response.data.data);
          setIsInitialized(true);
          return true;
        }
      } catch (profileError) {
        console.log('Erreur lors de la récupération du profil:', profileError);
        // Si l'erreur est 401 ou 403, le token n'est plus valide
        await removeToken();
        api.defaults.headers.common['Authorization'] = '';
        setUser(null);
        setIsInitialized(true);
        return false;
      }

      // Si on arrive ici, le token n'est plus valide
      console.log('Token invalide ou expiré');
      await removeToken();
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      setIsInitialized(true);
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      // En cas d'erreur, on nettoie tout
      await removeToken();
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      setIsInitialized(true);
      return false;
    }
  };

  // Effet pour vérifier l'authentification au démarrage
  useEffect(() => {
    const initAuth = async () => {
      console.log('=== Initialisation de l\'authentification ===');
      try {
        const isAuthenticated = await checkAuth();
        console.log('Authentification vérifiée:', isAuthenticated);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
      } finally {
        console.log('Initialisation terminée');
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('=== Tentative de connexion ===');
      const response = await api.post('/user/login', { email, password });

      if (response.data.message === "Connexion réussie") {
        if (!response.data.token?.token) {
          throw new Error('Token manquant dans la réponse du serveur');
        }

        const token = response.data.token.token;
        await setToken(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const userResponse = await api.get('/user/profile');

        if (!userResponse.data.data) {
          throw new Error('Données utilisateur manquantes dans la réponse');
        }

        setUser(userResponse.data.data);
        console.log('Connexion réussie, redirection vers l\'accueil');
        router.replace('/(tabs)/accueil');
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      throw new Error(error.response?.data?.message || 'Une erreur est survenue lors de la connexion');
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
      api.defaults.headers.common['Authorization'] = '';
      router.replace('/connexion');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const register = async (userData: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    phone: string;
    adress: string;
  }) => {
    try {
      const response = await api.post('/user/register', userData);

      if (response.data.message === "Inscription réussie") {
        await login(userData.email, userData.password);
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      throw new Error(error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  };

  // Si l'authentification n'est pas encore initialisée, on ne rend rien
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitialized,
        login,
        logout,
        register,
        checkAuth,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 