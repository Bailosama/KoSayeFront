import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Step3Screen() {
    const router = useRouter();

    const goToHome = () => {
        console.log('=== Step3: Tentative de navigation vers accueil ===');
        try {
            console.log('Navigation vers: /(tabs)/accueil');
            router.push("/(tabs)/accueil");
        } catch (error) {
            console.error('Erreur de navigation:', error);
        }
    };

    const handleLogin = () => {
        console.log('=== Step3: Tentative de navigation vers connexion ===');
        try {
            console.log('Navigation vers: ../connexion');
            router.push("../home");
        } catch (error) {
            console.error('Erreur de navigation:', error);
        }
    };

    console.log('=== Rendu de Step3Screen ===');
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="shield-checkmark" size={80} color="#fff" />
                <Text style={styles.title}>Paiement Sécurisé</Text>
                <Text style={styles.subtitle}>Vos transactions sont 100% sécurisées</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={goToHome}
                >
                    <Text style={styles.skipButtonText}>Continuer sans compte</Text>
                    <Text style={styles.skipButtonSubtext}>Vous pourrez vous connecter plus tard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.loginButton]}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F59E0B",
        justifyContent: "space-between",
        padding: 20,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
    buttonContainer: {
        paddingBottom: 20,
        gap: 10,
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: "center",

        // Shadow (iOS)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        // Shadow (Android)
        elevation: 5,
    },
    skipButton: {
        backgroundColor: "#F59E0B",
        marginBottom: 10,

        // Inherit shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loginButton: {
        backgroundColor: "#fff",

        // Inherit shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    skipButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    skipButtonSubtext: {
        color: "#fffùù",
        fontSize: 12,
        marginTop: 4,
    },
    loginButtonText: {
        color: "#000", // Corrigé : "#black" n'est pas une couleur valide
        fontSize: 16,
        fontWeight: "600",
    },
});
