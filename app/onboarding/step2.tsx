import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Step2Screen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/onboarding/step3");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Ionicons name="bicycle" size={80} color="#fff" />
            <Text style={styles.title}>Livraison Rapide</Text>
            <Text style={styles.subtitle}>Vos produits livrés en un temps record</Text>
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
}); 