import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FILE_URL } from "../../config";
import api from "../api/api";
import { getToken } from "../utils/auth";

interface Product {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  variants: { id: string; name: string; price: number | string; stock: number; image?: string }[];
}

interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product: Product;
}

export default function Favoris() {
  const [favorites, setFavorites] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refresh } = useLocalSearchParams();

  const fetchFavorites = async (token: string) => {
    try {
      const response = await api.get("/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Favoris.tsx - Réponse GET /wishlist :", JSON.stringify(response.data, null, 2));
      const wishlistItems = response.data.data || [];
      setFavorites(wishlistItems);
      console.log("Favoris.tsx - État favorites mis à jour :", wishlistItems);
    } catch (error: any) {
      console.error("Favoris.tsx - Erreur récupération favoris :", error);
      console.log("Favoris.tsx - Détails erreur :", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.status === 403 || error.response?.status === 401) {
        Alert.alert(
          "Erreur d'authentification",
          "Session invalide. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.push("/connexion") }]
        );
        if (Platform.OS !== "web") {
                    await SecureStore.deleteItemAsync("userToken");        } else {          localStorage.removeItem("userToken");
        }
      } else {
        Alert.alert("Erreur", "Impossible de charger les favoris.");
      }
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (wishlistItemId: string) => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour gérer les favoris.");
      router.push("/connexion");
      return;
    }

    try {
      console.log("Favoris.tsx - Suppression wishlistItemId :", wishlistItemId);
      await api.delete(`/wishlist/${wishlistItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Succès", "Produit retiré des favoris.");
      await fetchFavorites(token);
    } catch (error: any) {
      console.error("Favoris.tsx - Erreur suppression favori :", error);
      console.log("Favoris.tsx - Détails erreur :", JSON.stringify(error.response?.data, null, 2));
      let errorMessage = "Impossible de supprimer le favori. Veuillez réessayer.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert("Erreur", errorMessage);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Favoris.tsx - useFocusEffect exécuté, refresh :", refresh);
      const loadFavorites = async () => {
        const token = await getToken();
        console.log("Favoris.tsx - useFocusEffect - Token :", token);
        if (token) {
          setIsLoading(true);
          await fetchFavorites(token);
        } else {
          setIsLoading(false);
          setFavorites([]);
        }
      };
      loadFavorites();
    }, [refresh])
  );

  const renderFavoriteItem = ({ item }: { item: WishlistItem }) => {
    // Construire l'URL de l'image
    const imageUrl = item.product.variants?.[0]?.image ? 
      `${FILE_URL}/${item.product.variants[0].image}` :
      item.product.image ?
      `${FILE_URL}/${item.product.image}` :
      `https://picsum.photos/seed/${item.product.id}/200/300`;

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => {
          console.log("Favoris.tsx - Navigation vers detail_produit avec productId :", item.product.id);
          router.push({
            pathname: "/detail_produit",
            params: { productId: item.product.id },
          });
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{item.product.name}</Text>
          <Text style={styles.cardPrice}>${parseFloat(item.product.price.toString()).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun produit dans vos favoris.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 15,
  },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "500",
    color: "#F59E0B",
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    marginLeft: 10,
  },
});