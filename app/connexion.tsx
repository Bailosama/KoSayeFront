import { FontAwesome } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "./api/api";
import { authApi } from "./api/auth";
import { useAuth } from "./contexts/AuthContext";

export default function EcranConnexion() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && password.length <= 32;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Erreur", "Veuillez entrer un email valide.");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert("Erreur", "Le mot de passe doit contenir entre 8 et 32 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("=== DÉBUT CONNEXION ===");
      console.log("Email:", email);
      console.log("URL de l'API:", api.defaults.baseURL);

      await login(email, password);

    } catch (error: any) {
      console.error("=== ERREUR DE CONNEXION ===");
      console.error("Message:", error.message);
      console.error("Réponse API:", error.response?.data);

      let errorMessage = "Échec de la connexion. Veuillez réessayer.";
      if (error.response) {
        errorMessage = error.response.data.message || Object.values(error.response.data.errors || {})
          .flat()
          .join("\n");
      } else if (error.request) {
        errorMessage = "Impossible de se connecter au serveur. Vérifiez que le serveur est en cours d'exécution.";
      }
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      authApi.redirectToGoogle();
    } catch (error) {
      console.error("Erreur lors de la redirection vers Google:", error);
      Alert.alert("Erreur", "Impossible de se connecter avec Google. Veuillez réessayer.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      authApi.redirectToFacebook();
    } catch (error) {
      console.error("Erreur lors de la redirection vers Facebook:", error);
      Alert.alert("Erreur", "Impossible de se connecter avec Facebook. Veuillez réessayer.");
    }
  };

  const handleMotDePasseOublie = () => {
    router.push("/mot_de_passe_oublie");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.conteneurScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titrePrincipal}>Veuillez vous connecter</Text>
          <Text style={styles.sousTitreIntro}>
            Connectez-vous à votre compte
          </Text>
          <Text style={styles.description}>
            Entrez votre email pour vous connecter à l'application
          </Text>

          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.boutonContinuer, isLoading && styles.boutonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.texteBoutonContinuer}>
              {isLoading ? "Connexion..." : "Continuer"}
            </Text>
          </TouchableOpacity>

          <View style={styles.optionsLigne}>
            <TouchableOpacity
              style={styles.checkboxConteneur}
              onPress={() => setSeSouvenir(!seSouvenir)}
            >
              <View
                style={[styles.checkbox, seSouvenir && styles.checkboxChecked]}
              >
                {seSouvenir && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.texteOption}>Se souvenir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMotDePasseOublie}>
              <Text style={styles.texteLien}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separateurConteneur}>
            <View style={styles.ligneSeparateur} />
            <Text style={styles.texteSeparateur}>ou</Text>
            <View style={styles.ligneSeparateur} />
          </View>

          <TouchableOpacity
            style={[styles.boutonSocial, styles.googleButton]}
            onPress={handleGoogleLogin}
          >
            <FontAwesome name="google" size={24} color="#fff" />
            <Text style={styles.texteBoutonSocial}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.boutonSocial, styles.facebookButton]}
            onPress={handleFacebookLogin}
          >
            <FontAwesome name="facebook" size={24} color="#fff" />
            <Text style={styles.texteBoutonSocial}>Continuer avec Facebook</Text>
          </TouchableOpacity>

          <Text style={styles.texteConditions}>
            En cliquant sur continuer, vous acceptez nos conditions
            d'utilisation et notre politique de confidentialité.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  conteneurScroll: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 20,
    justifyContent: "center",
  },
  titrePrincipal: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  sousTitreIntro: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    color: "#000000",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  boutonContinuer: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  boutonDisabled: {
    backgroundColor: "#00000080",
  },
  texteBoutonContinuer: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsLigne: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  checkboxConteneur: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#000000",
  },
  checkboxCheckmark: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  texteOption: {
    fontSize: 14,
    color: "#666666",
  },
  texteLien: {
    fontSize: 14,
    color: "#000000",
    textDecorationLine: "underline",
  },
  separateurConteneur: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  ligneSeparateur: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  texteSeparateur: {
    marginHorizontal: 10,
    color: "#666666",
    fontSize: 14,
  },
  boutonSocial: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    gap: 10,
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  facebookButton: {
    backgroundColor: "#4267B2",
  },
  texteBoutonSocial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  texteConditions: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 20,
  },
});