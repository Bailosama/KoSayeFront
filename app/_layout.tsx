import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from "../contexts/ProfileContext";
import { STRIPE_CONFIG } from './config/stripe';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Fonction pour vérifier si un segment est public
const isPublicRoute = (segments: string[]) => {
  console.log('=== Vérification de la route ===');
  console.log('Segments:', segments);

  // Routes qui nécessitent vraiment une authentification
  const privateRoutes = [
    'commande',
    'commande-confirmee',
    'paiement',
    'detail-profil',
    'compte',
    'verification',
    'authentification-deux-facteurs',
    'confidentialite',
    'notifications',
    'parametre',
  ];

  // Routes toujours publiques
  const publicRoutes = [
    'index',
    'connexion',
    'inscription',
    'mot_de_passe_oublie',
    'accueil',
    'home',
    'produits',
    'detail_produit',
    'contact',
    'a-propos',
    'aide',
    'panier',
    'wishlist',
    'onboarding',
    '(tabs)',
  ];

  // Si c'est une route d'onboarding
  if (segments[0] === 'onboarding') {
    console.log('Route onboarding détectée');
    return true;
  }

  // Si c'est dans les onglets publics
  if (segments[0] === '(tabs)') {
    const tabRoute = segments[1];
    console.log('Route onglet détectée:', tabRoute);
    return !privateRoutes.includes(tabRoute);
  }

  // Si c'est une route privée
  if (segments.some(segment => privateRoutes.includes(segment))) {
    console.log('Route privée détectée:', segments);
    return false;
  }

  // Si c'est une route publique
  if (segments.some(segment => publicRoutes.includes(segment))) {
    console.log('Route publique détectée:', segments);
    return true;
  }

  console.log('Route par défaut (publique):', segments);
  return true;
};

// Composant de protection des routes
function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    console.log('=== Navigation Root Layout ===');
    console.log('isInitialized:', isInitialized);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Segments actuels:', segments);

    if (!isInitialized) {
      console.log('Auth non initialisée, attente...');
      return;
    }

    const isPublic = isPublicRoute(segments);
    console.log('Route publique ?', isPublic);

    // Ne redirige vers la connexion que si:
    // 1. L'utilisateur n'est pas authentifié
    // 2. La route n'est pas publique
    // 3. La route actuelle n'est pas déjà /connexion (pour éviter une boucle)
    if (!isAuthenticated && !isPublic && segments[0] !== 'connexion') {
      console.log('Redirection vers connexion car route privée...');
      router.replace('/home');
    }
  }, [isAuthenticated, segments, isInitialized]);

  if (!isInitialized) {
    console.log('Attente de l\'initialisation...');
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Routes d'introduction */}
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/step1" />
      <Stack.Screen name="onboarding/step2" />
      <Stack.Screen name="onboarding/step3" />

      {/* Routes principales */}
      <Stack.Screen name="connexion" />
      <Stack.Screen name="inscription" />
      <Stack.Screen
        name="mot_de_passe_oublie"
        options={{
          headerShown: true,
          title: "Mot de passe oublié",
          headerBackTitle: "Retour",
        }}
      />

      {/* Routes publiques */}
      <Stack.Screen name="contact" />
      <Stack.Screen name="a-propos" />
      <Stack.Screen name="aide" />
      <Stack.Screen name="produits" />
      <Stack.Screen name="detail_produit" />
      <Stack.Screen name="panier" />
      <Stack.Screen name="wishlist" />

      {/* Routes des onglets */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* Routes protégées */}
      <Stack.Screen name="commande" />
      <Stack.Screen name="commande-confirmee" />
      <Stack.Screen name="paiement" />
      <Stack.Screen name="detail-profil" />
      <Stack.Screen name="compte" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="authentification-deux-facteurs" />
      <Stack.Screen name="confidentialite" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="parametre" />
    </Stack>
  );
}

// Layout racine de l'application
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey={STRIPE_CONFIG.publishableKey}
        merchantIdentifier={STRIPE_CONFIG.merchantIdentifier}
        urlScheme={STRIPE_CONFIG.urlScheme}
      >
        <AuthProvider>
          <CartProvider>
            <ProfileProvider>
              <RootLayoutNav />
            </ProfileProvider>
          </CartProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
