import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Step1Screen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/onboarding/step2");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Ionicons name="cart" size={80} color="#fff" />
            <Text style={styles.title}>Faites vos achats</Text>
            <Text style={styles.subtitle}>Découvrez notre large sélection de produits</Text>
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