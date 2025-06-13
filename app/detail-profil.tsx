import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useProfile } from "../contexts/ProfileContext";
import api from "./api/api";
import { ProfileImageUpload } from "./components/ProfileImageUpload";
import { useAuth } from "./contexts/AuthContext";
import { getToken } from "./utils/auth";

export default function DetailProfilScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { profileImage, setProfileImage } = useProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    adress: user?.adress || "",
  });
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const handleImageSelected = (imageFile: any) => {
    setSelectedImage(imageFile);
    setProfileImage(imageFile.uri);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
        router.push("/connexion");
        return;
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add profile data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add image if selected
      if (selectedImage) {
        formDataToSend.append('profile_picture', selectedImage);
      }

      const response = await api.put(
        "/user/profile",
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          }
        }
      );

      // Si nous avons une réponse, c'est un succès
      if (response.data) {
        // Construire l'URL complète de l'image
        const baseUrl = 'http://192.168.1.196:3333';
        const profilePictureUrl = response.data.data?.profilePicture 
          ? `${baseUrl}/uploads/${response.data.data.profilePicture}`
          : user?.profilePicture || '';

        console.log('URL de l\'image:', profilePictureUrl); // Pour déboguer

        // Mettre à jour le contexte d'authentification avec les nouvelles données
        const updatedUserData = {
          ...user,
          ...formData,
          profilePicture: profilePictureUrl
        };
        
        updateUser(updatedUserData);
        setProfileImage(profilePictureUrl);
        
        Alert.alert("Succès", "Profil mis à jour avec succès");
        router.back();
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Une erreur est survenue lors de la mise à jour du profil"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileImageContainer}>
          <ProfileImageUpload
            currentImage={profileImage}
            onImageSelected={handleImageSelected}
            onError={(error) => Alert.alert("Erreur", error)}
            size={120}
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={formData.firstname}
              onChangeText={(value) => handleChange("firstname", value)}
              placeholder="Entrez votre prénom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={formData.lastname}
              onChangeText={(value) => handleChange("lastname", value)}
              placeholder="Entrez votre nom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              placeholder="Entrez votre email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleChange("phone", value)}
              placeholder="Entrez votre numéro de téléphone"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.adress}
              onChangeText={(value) => handleChange("adress", value)}
              placeholder="Entrez votre adresse"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  menuButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  form: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#F59E0B",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
