import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { isAuthenticated, checkAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const verifyAuth = async () => {
            const isAuth = await checkAuth();
            if (!isAuth) {
                router.replace('/connexion');
            }
        };

        verifyAuth();
    }, []);

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}; 