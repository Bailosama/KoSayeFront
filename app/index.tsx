import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "./contexts/AuthContext";

export default function IndexScreen() {
  const router = useRouter();
  const { isInitialized } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isInitialized || hasRedirected.current) {
      return;
    }

    const timer = setTimeout(() => {
      hasRedirected.current = true;
      router.push("/onboarding/step1");
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  return (
    <View style={styles.container}>
      <Ionicons name="storefront" size={80} color="#fff" />
      <Text style={styles.title}>KO SAYE</Text>
      <Text style={styles.subtitle}>Achats et livraisons sécurisés</Text>
      <ActivityIndicator size="large" color="#F59E0B" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
