import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import api from "../api/api";
import { getToken } from "../utils/auth";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(
    user?.profilePicture || null
  );
  const [imageError, setImageError] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de la permission d'accéder à votre galerie pour changer la photo de profil."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const token = await getToken();
        if (!token) {
          Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
          router.push("/connexion");
          return;
        }

        // Créer un objet FormData pour l'envoi de l'image
        const formData = new FormData();
        formData.append("profilePicture", {
          uri:
            Platform.OS === "ios"
              ? result.assets[0].uri.replace("file://", "")
              : result.assets[0].uri,
          type: "image/jpeg",
          name: "profile-picture.jpg",
        } as any);

        // Envoyer l'image au serveur
        const response = await api.put("/user/profile", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        });

        if (response.data.success) {
          // Réinitialiser l'état d'erreur d'image
          setImageError(false);
          // Mettre à jour le contexte d'authentification avec la nouvelle photo
          updateUser({ profilePicture: response.data.data.profilePicture });
          Alert.alert("Succès", "Photo de profil mise à jour avec succès");
        } else {
          throw new Error(
            response.data.message || "Erreur lors de la mise à jour de la photo"
          );
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la photo:", error);
      Alert.alert(
        "Erreur",
        error.response?.data?.message ||
          "Une erreur est survenue lors de la mise à jour de la photo"
      );
    }
  };

  const menuItems = [
    {
      id: "profil",
      title: "Profil",
      icon: "person" as const,
      color: "#F59E0B",
    },
    {
      id: "commandes",
      title: "Commandes",
      icon: "receipt" as const,
      color: "#F59E0B",
    },
    {
      id: "parametre",
      title: "Paramètre",
      icon: "settings" as const,
      color: "#F59E0B",
    },
    {
      id: "contact",
      title: "Contact",
      icon: "mail" as const,
      color: "#F59E0B",
    },
    {
      id: "partager",
      title: "Partager l'application",
      icon: "share-social" as const,
      color: "#F59E0B",
    },
    {
      id: "aide",
      title: "Aide",
      icon: "help-circle" as const,
      color: "#F59E0B",
    },
  ];

  const handleMenuPress = (id: string) => {
    switch (id) {
      case "parametre":
        router.push("/parametre");
        break;
      case "profil":
        router.push("/detail-profil");
        break;
      case "commandes":
        router.push("/commande");
        break;
      case "contact":
        router.push("/contact");
        break;
      case "partager":
        router.push("/partage");
        break;
      case "aide":
        router.push("/aide");
        break;
      default:
        console.log("Menu pressed:", id);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/connexion");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion");
    }
  };

  const toggleImageModal = () => {
    setIsImageModalVisible(!isImageModalVisible);
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
      <ScrollView style={styles.scrollView}>
        {/* Photo de profil et informations */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
            {user.profilePicture && !imageError ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
                onError={(e) => {
                  console.log(
                    "Erreur de chargement de l'image:",
                    e.nativeEvent.error
                  );
                  setImageError(true);
                }}
              />
            ) : (
              <View style={styles.profileImageFallback}>
                <Text style={styles.profileImageFallbackText}>
                  {user.firstname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text
            style={styles.name}
          >{`${user.firstname} ${user.lastname}`}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Menu items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal pour afficher l'image en plein écran */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleImageModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleImageModal}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {profileImage && (
            <Image
              source={{ uri: profileImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImageFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageFallbackText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
});
