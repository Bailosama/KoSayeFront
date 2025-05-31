import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from "../contexts/ProfileContext";
import { STRIPE_CONFIG } from './config/stripe';
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Layout racine de l'application
// Utilise Stack pour la navigation de base
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
              <Stack
                screenOptions={{
                  // Option pour masquer l'en-tête par défaut pour tous les écrans
                  // Vous pouvez surcharger ceci par écran si nécessaire
                  headerShown: false,
                }}
              >
                {/* Définit l'écran splash initial */}
                <Stack.Screen name="splash" />
                {/* Définit l'écran d'authentification (index) */}
                <Stack.Screen name="index" />
                {/* Définit l'écran de connexion */}
                <Stack.Screen
                  name="connexion"
                  options={
                    {
                      // Option spécifique pour l'écran de connexion, si besoin
                      // Par exemple, pour afficher un titre:
                      // headerShown: true,
                      // title: 'Connexion'
                    }
                  }
                />
                {/* Définit l'écran d'inscription */}
                <Stack.Screen
                  name="inscription"
                  options={
                    {
                      // Option spécifique pour l'écran d'inscription, si besoin
                      // headerShown: true,
                      // title: 'Inscription'
                    }
                  }
                />
                {/* Définit l'écran Mot de passe oublié */}
                <Stack.Screen
                  name="mot_de_passe_oublie"
                  options={{
                    headerShown: true, // Affiche l'en-tête
                    title: "Mot de passe oublié", // Titre de l'en-tête
                    headerBackTitle: "Retour", // Texte du bouton retour (iOS)
                  }}
                />
                {/* Définit l'écran de Confirmation de succès */}
                <Stack.Screen
                  name="confirmation_succes"
                  options={{ headerShown: false }}
                />
                {/* Définit l'écran de la liste des produits */}
                <Stack.Screen
                  name="produits"
                  options={{
                    headerShown: true,
                    title: "Products",
                    headerBackTitle: "Retour",
                  }}
                />
                {/* Définit l'écran de détail d'un produit */}
                <Stack.Screen
                  name="detail_produit"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Définit le groupe d'onglets principal */}
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Écran de paiement */}
                <Stack.Screen
                  name="paiement"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Écran de vérification */}
                <Stack.Screen
                  name="verification"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Écran des paramètres */}
                <Stack.Screen
                  name="parametre"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Écran de détail du profil */}
                <Stack.Screen
                  name="detail-profil"
                  options={{
                    headerShown: false,
                  }}
                />
                {/* Écran de contact */}
                <Stack.Screen
                  name="contact"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="partage"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="aide"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen name="home" />
              </Stack>
            </ProfileProvider>
          </CartProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
