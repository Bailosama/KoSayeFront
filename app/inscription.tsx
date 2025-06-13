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
    TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./contexts/AuthContext";

export default function EcranInscription() {
  const { register } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adress, setAdress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && password.length <= 32;
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?\d{9,15}$/;
    return phoneRegex.test(phone);
  };

  const handleInscription = async () => {
    if (!firstname || !lastname || !email || !phone || !adress || !password || !confirmPassword) {
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

    if (!validatePhone(phone)) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone valide (9 à 15 chiffres).");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstname,
        lastname,
        email,
        password,
        phone,
        adress,
      });
      Alert.alert("Succès", "Inscription réussie !");
      router.replace("/(tabs)/accueil");
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      if (error.message.includes('email est déjà utilisé')) {
        Alert.alert(
          "Email déjà utilisé",
          error.message,
          [
            { text: "Annuler", style: "cancel" },
            { text: "Se connecter", onPress: () => router.push("/connexion") }
          ]
        );
      } else {
        Alert.alert(
          "Erreur d'inscription",
          error.message || "Une erreur est survenue lors de l'inscription"
        );
      }
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.titrePrincipal}>Inscription</Text>
          <Text style={styles.sousTitreIntro}>
            Inscrivez-vous à l'application Ko saye !
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Prénom"
            placeholderTextColor="#999999"
            value={firstname}
            onChangeText={setFirstname}
            autoCapitalize="words"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Nom de famille"
            placeholderTextColor="#999999"
            value={lastname}
            onChangeText={setLastname}
            autoCapitalize="words"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone"
            placeholderTextColor="#999999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Adresse"
            placeholderTextColor="#999999"
            value={adress}
            onChangeText={setAdress}
            autoCapitalize="sentences"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmez le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.boutonInscrire, isLoading && styles.boutonDisabled]}
            onPress={handleInscription}
            disabled={isLoading}
          >
            <Text style={styles.texteBoutonInscrire}>
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.texteConditions}>
            En cliquant sur « s'inscrire », vous acceptez les Conditions
            d'utilisation et la Politique de confidentialité de l'application Ko
            saye.
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
    paddingVertical: 20,
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
    color: "#333333",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 15,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
  boutonInscrire: {
    backgroundColor: "#F59E0B",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 25,
  },
  boutonDisabled: {
    backgroundColor: "#F59E0B80",
  },
  texteBoutonInscrire: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  texteConditions: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 10,
  },
});