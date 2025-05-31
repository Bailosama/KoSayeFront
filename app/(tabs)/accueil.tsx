import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FILE_URL } from "../../config";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { getToken } from '../utils/auth';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4;

// --- Types ---
interface User {
  firstname: string;
  lastname: string;
  profilePicture: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  description?: string;
  category: { id: string; name: string };
  propertyValues: { property_id: string; value: string }[];
  variants: { id: string; name: string; price: number | string; stock: number; image?: string }[];
}

interface WishlistItem {
  id: string; // ID de l'entrée dans wishlist_items
  wishlist_id: string;
  product_id: string;
  product: Product;
}

// --- Données de secours ---
const fallbackCategories: Category[] = [
  { id: "1", name: "Montres" },
  { id: "2", name: "Chaussures" },
  { id: "3", name: "Électronique" },
];

const fallbackProducts: Product[] = [
  {
    id: "1",
    name: "Montre Rolex",
    price: 40,
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
    description: "Montre élégante",
    category: { id: "1", name: "Montres" },
    propertyValues: [],
    variants: [{ id: "1", name: "Standard", price: 40, stock: 10, image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49" }],
  },
  {
    id: "2",
    name: "Pompe Nike",
    price: 430,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Chaussures de sport",
    category: { id: "2", name: "Chaussures" },
    propertyValues: [],
    variants: [{ id: "2", name: "Standard", price: 430, stock: 15, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" }],
  },
];

// --- Composants UI ---

const Header = ({ userName }: { userName: string }) => {
  const { user } = useAuth();
  const firstLetter = user?.firstname ? user.firstname.charAt(0).toUpperCase() : '?';
  const router = useRouter();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      console.log('Fetching unread notifications...');
      const response = await api.get('/notifications/unread/count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Notifications response:', response.data);

      if (response.data && typeof response.data.count === 'number') {
        console.log('Setting unread notifications count:', response.data.count);
        setUnreadNotifications(response.data.count);
      } else {
        console.log('Invalid response format:', response.data);
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications non lues:', error);
      setUnreadNotifications(0);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.userInfoContainer}>
        {user?.profilePicture ? (
          <Image
            source={{ uri: user.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
        )}
        <Text style={styles.userName}>{userName || "Bienvenue !"}</Text>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            Alert.alert("Info", "La fonctionnalité de recherche n'est pas encore disponible.");
          }}
        >
          <Ionicons name="search" size={26} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications-outline" size={26} color="#333" />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CategoryList = ({ categories }: { categories: Category[] }) => {
  const router = useRouter();

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    console.log('Navigation vers produits avec catégorie:', categoryName, '(ID:', categoryId, ')');
    router.push({
      pathname: "/produits",
      params: {
        categoryId,
        categoryName
      }
    });
  };

  return (
    <View style={styles.categoryContainer}>
      {categories.length === 0 ? (
        <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
      ) : (
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(item.id, item.name)}
            >
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryListContent}
        />
      )}
    </View>
  );
};

const Banner = () => (
  <View style={styles.bannerContainer}>
    <View style={styles.bannerTextContainer}>
      <Text style={styles.bannerTitle}>Bénéficiez d'une réduction</Text>
      <Text style={styles.bannerSubtitle}>d'hiver de 20 %</Text>
      <Text style={styles.bannerSubtitle}>pour les enfants</Text>
    </View>
    <Image
      source={{ uri: "https://placehold.co/100x100/ffffff/000000/png" }}
      style={styles.bannerImage}
      resizeMode="contain"
    />
  </View>
);

const ProductCard = ({
  item,
  isFavorite,
  toggleFavorite,
}: {
  item: Product;
  isFavorite: boolean;
  toggleFavorite: (productId: string) => void;
}) => {
  // Construire l'URL de l'image
  const imageUrl = item.variants?.[0]?.image ?
    `${FILE_URL}/${item.variants[0].image}` :
    item.image ?
      `${FILE_URL}/${item.image}` :
      `https://picsum.photos/seed/${item.id}/200/300`;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => {
        console.log('Navigation vers detail_produit avec productId:', item.id);
        router.push({
          pathname: "/detail_produit",
          params: {
            productId: item.id,
          },
        });
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.heartIconContainer}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={isFavorite ? "#FF0000" : "#555"}
        />
      </TouchableOpacity>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardPrice}>${parseFloat(item.price.toString()).toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

const ProductSection = ({
  title,
  data,
  favorites,
  toggleFavorite,
}: {
  title: string;
  data: Product[];
  favorites: string[];
  toggleFavorite: (productId: string) => void;
}) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={() => router.push("/produits")}>
        <Text style={styles.sectionSeeAll}>Tout voir</Text>
      </TouchableOpacity>
    </View>
    {data.length === 0 ? (
      <Text style={styles.emptyText}>Aucun produit disponible</Text>
    ) : (
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            isFavorite={favorites.includes(item.id)}
            toggleFavorite={toggleFavorite}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productListContent}
      />
    )}
  </View>
);

// --- Écran Principal Accueil ---
export default function AccueilScreen() {
  const { user, updateUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const updateUserData = (data: any) => {
    if (data && updateUser) {
      updateUser({
        id: data.id,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        phone: data.phone,
        profilePicture: data.profilePicture || null
      });
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      console.log('=== RÉCUPÉRATION DONNÉES UTILISATEUR ===');
      const response = await api.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('=== DONNÉES UTILISATEUR RÉCUPÉRÉES ===');
      console.log('Données:', response.data.data);

      if (response.data.data) {
        updateUserData(response.data.data);
      }
    } catch (error: any) {
      console.error('=== ERREUR RÉCUPÉRATION DONNÉES UTILISATEUR ===');
      console.error('Message:', error.message);
      console.error('Réponse API:', error.response?.data);
    }
  };

  const fetchFavorites = async (token: string) => {
    try {
      const response = await api.get("/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Réponse favoris :", JSON.stringify(response.data, null, 2));
      const wishlistItems = response.data.data || [];
      setFavorites(wishlistItems.map((item: WishlistItem) => item.product_id));
    } catch (error: any) {
      console.error("Erreur récupération favoris :", error);
      console.log("Détails erreur:", JSON.stringify(error.response?.data, null, 2));
      if (error.response?.status === 403 || error.response?.status === 401) {
        Alert.alert(
          "Erreur d'authentification",
          "Session invalide. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.push("/connexion") }]
        );
        if (Platform.OS !== "web") {
          await SecureStore.deleteItemAsync("userToken");
        } else {
          localStorage.removeItem("userToken");
        }
      }
    }
  };

  const toggleFavorite = async (productId: string) => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour ajouter aux favoris.");
      router.push("/connexion");
      return;
    }

    const isFavorite = favorites.includes(productId);
    const previousFavorites = [...favorites];

    try {
      console.log("Accueil.tsx - toggleFavorite - productId :", productId, "isFavorite :", isFavorite);
      if (isFavorite) {
        const response = await api.get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Accueil.tsx - Réponse GET /wishlist pour suppression :", JSON.stringify(response.data, null, 2));
        const wishlistItem = response.data.data.find(
          (item: WishlistItem) => item.product_id === productId
        );
        if (wishlistItem) {
          console.log("Accueil.tsx - Suppression wishlistItemId :", wishlistItem.id);
          await api.delete(`/wishlist/${wishlistItem.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchFavorites(token);
          Alert.alert("Succès", "Produit retiré des favoris.");
        } else {
          throw new Error("Élément de la liste de souhaits non trouvé");
        }
      } else {
        console.log("Accueil.tsx - Ajout productId :", productId);
        await api.post(
          "/wishlist",
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchFavorites(token);
        Alert.alert("Succès", "Produit ajouté aux favoris.");
      }
      console.log("Accueil.tsx - Favorites après mise à jour :", favorites);
    } catch (error: any) {
      console.error("Accueil.tsx - Erreur modification favoris :", error);
      console.log("Accueil.tsx - Détails erreur :", JSON.stringify(error.response?.data, null, 2));
      let errorMessage = "Impossible de modifier les favoris. Veuillez réessayer.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setFavorites(previousFavorites);
      Alert.alert("Erreur", errorMessage);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.push('/connexion');
        return;
      }

      const response = await api.get('/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        console.log("Token utilisé:", token);

        if (token) {
          await fetchUserData(token);
          await fetchFavorites(token);
          await fetchOrders();
        } else {
          console.log("Aucun token trouvé");
          router.replace("/connexion");
        }

        try {
          const categoriesResponse = await api.get("/categories");
          console.log("Réponse catégories :", JSON.stringify(categoriesResponse.data, null, 2));
          const fetchedCategories = categoriesResponse.data.data?.data || [];
          setCategories(fetchedCategories.length > 0 ? fetchedCategories : fallbackCategories);
        } catch (error: any) {
          console.error("Erreur récupération catégories :", error);
          console.log("Détails erreur:", JSON.stringify(error.response?.data, null, 2));
          setCategories(fallbackCategories);
        }

        try {
          const featuredResponse = await api.get("/products?page=1&limit=5");
          console.log("Réponse produits en vedette :", JSON.stringify(featuredResponse.data, null, 2));
          const fetchedFeatured = featuredResponse.data.data?.data || [];
          setFeaturedProducts(fetchedFeatured.length > 0 ? fetchedFeatured : fallbackProducts);
        } catch (error: any) {
          console.error("Erreur récupération produits en vedette :", error);
          console.log("Détails erreur:", JSON.stringify(error.response?.data, null, 2));
          setFeaturedProducts(fallbackProducts);
        }

        try {
          const popularResponse = await api.get("/products?page=2&limit=5");
          console.log("Réponse produits populaires :", JSON.stringify(popularResponse.data, null, 2));
          const fetchedPopular = popularResponse.data.data?.data || [];
          setPopularProducts(fetchedPopular.length > 0 ? fetchedPopular : fallbackProducts);
        } catch (error: any) {
          console.error("Erreur récupération produits populaires :", error);
          console.log("Détails erreur:", JSON.stringify(error.response?.data, null, 2));
          setPopularProducts(fallbackProducts);
        }
      } catch (error: any) {
        console.error("Erreur globale :", error);
        console.log("Détails erreur:", JSON.stringify(error.response?.data, null, 2));
        setCategories(fallbackCategories);
        setFeaturedProducts(fallbackProducts);
        setPopularProducts(fallbackProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header userName={user ? `${user.firstname} ${user.lastname}` : "Bienvenue !"} />
        <CategoryList categories={categories} />
        <Banner />
        <ProductSection
          title="Produits en vedette"
          data={featuredProducts}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
        <ProductSection
          title="Produits populaires"
          data={popularProducts}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  categoryContainer: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  categoryListContent: {
    paddingVertical: 5,
  },
  categoryItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  bannerContainer: {
    backgroundColor: "#F59E0B",
    borderRadius: 15,
    marginHorizontal: 15,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 25,
    overflow: "hidden",
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  bannerImage: {
    width: 80,
    height: 100,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  sectionSeeAll: {
    fontSize: 14,
    color: "#6A1B9A",
    fontWeight: "500",
  },
  productListContent: {
    paddingHorizontal: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH * 0.8,
    backgroundColor: "#e0e0e0",
  },
  heartIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 5,
    borderRadius: 15,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginHorizontal: 10,
  },
  cardPrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    marginHorizontal: 10,
  },
  notificationBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    padding: 2,
    position: 'absolute',
    top: -5,
    right: -5,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
