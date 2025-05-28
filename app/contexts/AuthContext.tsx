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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('=== DÉBUT VÉRIFICATION AUTH ===');
      const token = await getToken();
      console.log('Token récupéré:', token ? 'Présent' : 'Absent');

      if (!token) {
        console.log('Pas de token trouvé, déconnexion...');
        setUser(null);
        return false;
      }

      console.log('=== VÉRIFICATION PROFIL ===');
      console.log('URL API:', api.defaults.baseURL);
      console.log('Headers:', JSON.stringify(api.defaults.headers, null, 2));

      const response = await api.get('/user/profile');
      console.log('Réponse profil:', JSON.stringify(response.data, null, 2));

      if (response.data?.data) {
        console.log('Profil récupéré avec succès');
        setUser(response.data.data);
        return true;
      }

      console.log('Données profil invalides');
      return false;
    } catch (error: any) {
      console.error('=== ERREUR VÉRIFICATION AUTH ===');
      console.error('Message:', error.message);
      console.error('Réponse API:', JSON.stringify(error.response?.data, null, 2));
      console.error('Status:', error.response?.status);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('=== DÉBUT CONNEXION ===');
      console.log('Email de connexion:', email);

      const response = await api.post('/user/login', { email, password });
      console.log('=== RÉPONSE CONNEXION ===');
      console.log('Message:', response.data.message);
      console.log('Données complètes:', JSON.stringify(response.data, null, 2));

      if (response.data.message === "Connexion réussie") {
        // Vérifier si le token existe dans la réponse
        if (!response.data.token?.token) {
          console.error('Token manquant dans la réponse:', response.data);
          throw new Error('Token manquant dans la réponse du serveur');
        }

        const token = response.data.token.token;
        console.log('Token reçu:', token);

        await setToken(token);
        console.log('Token sauvegardé');

        // Configurer le token dans les headers de l'API
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Token configuré dans les headers de l\'API');

        // Récupérer les données de l'utilisateur via le profil
        console.log('=== RÉCUPÉRATION DONNÉES UTILISATEUR ===');
        const userResponse = await api.get('/user/profile');

        console.log('=== DONNÉES UTILISATEUR RÉCUPÉRÉES ===');
        console.log('Données complètes:', JSON.stringify(userResponse.data, null, 2));

        if (!userResponse.data.data) {
          throw new Error('Données utilisateur manquantes dans la réponse');
        }

        const userData = {
          id: userResponse.data.data.id,
          firstname: userResponse.data.data.firstname,
          lastname: userResponse.data.data.lastname,
          email: userResponse.data.data.email,
          phone: userResponse.data.data.phone,
          adress: userResponse.data.data.adress,
          profilePicture: userResponse.data.data.profilePicture
        };

        console.log('=== DONNÉES UTILISATEUR FINALES ===');
        console.log(JSON.stringify(userData, null, 2));
        setUser(userData);

        // Attendre un court instant pour s'assurer que l'état est mis à jour
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('=== REDIRECTION VERS ACCUEIL ===');
        router.push('/(tabs)/accueil');
        return;
      }

      throw new Error('Réponse inattendue du serveur');
    } catch (error: any) {
      console.error('=== ERREUR DE CONNEXION ===');
      console.error('Message:', error.message);
      console.error('Réponse API:', error.response?.data);
      console.error('Stack:', error.stack);
      throw new Error(error.response?.data?.message || 'Une erreur est survenue lors de la connexion');
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
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
      console.log('=== DÉBUT INSCRIPTION ===');
      console.log('Données utilisateur:', userData);

      const response = await api.post('/user/register', userData);
      console.log('=== RÉPONSE INSCRIPTION ===');
      console.log('Message:', response.data.message);

      if (response.data.message === "Inscription réussie") {
        // Faire une requête de connexion pour obtenir le token
        const loginResponse = await api.post('/user/login', {
          email: userData.email,
          password: userData.password
        });

        console.log('=== RÉPONSE CONNEXION APRÈS INSCRIPTION ===');
        console.log('Message:', loginResponse.data.message);

        if (loginResponse.data.message === "Connexion réussie") {
          const token = loginResponse.data.token.token;
          await setToken(token);
          console.log('Token sauvegardé:', token);

          // Récupérer les données de l'utilisateur via le profil
          const userResponse = await api.get('/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log('=== DONNÉES UTILISATEUR RÉCUPÉRÉES ===');
          console.log(JSON.stringify(userResponse.data.data, null, 2));

          setUser({
            id: userResponse.data.data.id,
            firstname: userResponse.data.data.firstname,
            lastname: userResponse.data.data.lastname,
            email: userResponse.data.data.email,
            phone: userResponse.data.data.phone,
            adress: userResponse.data.data.adress,
            profilePicture: userResponse.data.data.profilePicture
          });

          router.replace("/(tabs)/accueil");
          return;
        }
      }

      throw new Error('Réponse inattendue du serveur');
    } catch (error: any) {
      console.error('=== ERREUR INSCRIPTION ===');
      console.error('Message:', error.message);
      console.error('Réponse API:', error.response?.data);

      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          // Vérifier si l'email est déjà utilisé
          const emailError = validationErrors.find((err: any) =>
            err.message.includes('email has already been taken')
          );
          if (emailError) {
            throw new Error('Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse email ou vous connecter.');
          }

          // Vérifier si le numéro de téléphone est déjà utilisé
          const phoneError = validationErrors.find((err: any) =>
            err.message.includes('phone has already been taken')
          );
          if (phoneError) {
            throw new Error('Ce numéro de téléphone est déjà utilisé. Veuillez utiliser un autre numéro.');
          }

          // Pour les autres erreurs de validation
          const errorMessage = validationErrors.map((err: any) => err.message).join('\n');
          throw new Error(errorMessage || 'Erreur de validation des données');
        }
      }

      throw new Error(error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    console.log('=== MISE À JOUR UTILISATEUR ===');
    console.log('Données reçues:', userData);

    setUser(prev => {
      if (!prev) return null;

      // Si une nouvelle photo de profil est fournie, construire l'URL complète
      if (userData.profilePicture) {
        const baseUrl = 'http://192.168.1.196:3333';
        // Vérifier si l'URL est déjà complète
        if (!userData.profilePicture.startsWith('http')) {
          // Si le chemin commence par /uploads, on l'utilise tel quel
          if (userData.profilePicture.startsWith('/uploads')) {
            userData.profilePicture = `${baseUrl}${userData.profilePicture}`;
          } else {
            // Sinon, on ajoute le chemin /uploads/users/
            userData.profilePicture = `${baseUrl}/uploads/users/${userData.profilePicture}`;
          }
        }
        console.log('URL de la photo de profil construite:', userData.profilePicture);
      }

      const updatedUser = { ...prev, ...userData };
      console.log('Utilisateur mis à jour:', updatedUser);
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        checkAuth,
        updateUser
      }}
    >
      {!loading && children}
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