import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Utilisation d'une librairie d'icônes
import { useTranslation } from "react-i18next";
// import Colors from "@/constants/Colors"; // Supposons que ce fichier n'existe pas encore

const TINT_COLOR = "#F59E0B"; // Couleur orange pour les boutons actifs

// Layout pour la navigation par onglets principale
export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TINT_COLOR, // Couleur orange pour l'icône active
        tabBarInactiveTintColor: "#666", // Couleur grise pour l'icône inactive
        tabBarStyle: {
          // Styles pour la barre d'onglets si nécessaire
          backgroundColor: "white",
          paddingTop: 5, // Petit espace au dessus des icônes
          paddingBottom: 5,
          height: 60, // Hauteur standard
          borderTopWidth: 1, // Ligne de séparation en haut
          borderTopColor: "#eee",
        },
        headerShown: false, // Masque l'en-tête par défaut pour les écrans d'onglets
      }}
    >
      <Tabs.Screen
        name="accueil" // Nom du fichier -> app/(tabs)/accueil.tsx
        options={{
          title: t("home"),
          tabBarShowLabel: false, // Masque le texte sous l'icône
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="home"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="panier" // Nom du fichier -> app/(tabs)/panier.tsx
        options={{
          title: "Panier",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="basket"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Chatbot",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="chatbubbles"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favoris"
        options={{
          title: t("favorites"),
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="bookmark"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil" // Nom du fichier -> app/(tabs)/profil.tsx
        options={{
          title: "Profil",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="person-circle"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
