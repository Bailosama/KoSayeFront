import { Ionicons } from "@expo/vector-icons"; // Utilisation d'une librairie d'icônes
import { Tabs, router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import api from "./../api/api";
// import Colors from "@/constants/Colors"; // Supposons que ce fichier n'existe pas encore

const TINT_COLOR = "#F59E0B"; // Couleur orange pour les boutons actifs

// Layout pour la navigation par onglets principale
export default function TabLayout() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const getActiveDiscounts = async () => {
    try {
      const response = await api.get('/reductions?status=active');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des réductions:', error);
      return [];
    }
  };

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
        name="accueil"
        options={{
          title: t("home"),
          tabBarShowLabel: false,
          tabBarIcon: ({ size, focused }) => (
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
          tabBarIcon: ({ size, focused }) => (
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
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="chatbubbles"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
          tabBarButton: (props) => (
            <View>
              <Pressable
                onPress={() => {
                  if (!isAuthenticated) {
                    router.push("/home");
                    return;
                  }
                  router.push("/chatbot");
                }}
              >
                {props.children}
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favoris"
        options={{
          title: t("favorites"),
          tabBarShowLabel: false,
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="bookmark"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
          tabBarButton: (props) => (
            <View>
              <Pressable
                onPress={() => {
                  if (!isAuthenticated) {
                    router.replace("/home");
                    return;
                  }
                  router.push("/favoris");
                }}
              >
                {props.children}
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profil" // Nom du fichier -> app/(tabs)/profil.tsx
        options={{
          title: "Profil",
          tabBarShowLabel: false,
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="person-circle"
              size={size}
              color={focused ? TINT_COLOR : "gray"}
            />
          ),
          tabBarButton: (props) => (
            <View>
              <Pressable
                onPress={() => {
                  if (!isAuthenticated) {
                    router.replace("/home");
                    return;
                  }
                  router.push("/profil");
                }}
              >
                {props.children}
              </Pressable>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
