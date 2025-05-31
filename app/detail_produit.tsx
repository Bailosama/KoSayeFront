import { FILE_URL } from "@/config";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddReviewModal } from '../components/reviews/AddReviewModal';
import { ReviewsList } from '../components/reviews/ReviewsList';
import api from "./api/api";
import { getToken } from "./utils/auth";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
  is_active: boolean;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  propertyValues?: {
    id: number;
    property_id: number;
    value: string;
    property: {
      id: number;
      name: string;
      type: string;
    };
  }[];
  variants?: {
    id: number;
    name: string;
    price: number;
    stock: number;
    image?: string;
  }[];
  properties?: {
    id: number;
    name: string;
    value: string;
  }[];
}

interface Variant {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface WishlistItem {
  id: number;
  product_id: string;
  user_id: number;
}

interface Cart {
  id: number;
  status: string;
}

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const ProductDetail = () => {
  const params = useLocalSearchParams();
  const productId = params.id ? parseInt(params.id as string, 10) :
    params.productId ? parseInt(params.productId as string, 10) : null;

  console.log('=== DÉTAILS PRODUIT ===');
  console.log('Params reçus:', params);
  console.log('Product ID converti:', productId);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);

  // Ajout d'une vérification de sécurité pour productId
  const safeProductId = productId || 0; // Valeur par défaut si null

  const fetchFavorites = async (token: string) => {
    if (!productId) return;

    try {
      const response = await api.get("/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Réponse favoris :", JSON.stringify(response.data, null, 2));
      const wishlistItems = response.data.data || [];
      const isProductFavorite = wishlistItems.some((item: WishlistItem) => item.product_id === productId.toString());
      setIsFavorite(isProductFavorite);
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
          await SecureStore.deleteItemAsync("authToken");
        } else {
          localStorage.removeItem("authToken");
        }
      }
    }
  };

  const toggleFavorite = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour ajouter aux favoris.");
      router.push("/connexion");
      return;
    }

    if (!productId) {
      Alert.alert("Erreur", "ID du produit invalide");
      return;
    }

    const previousFavoriteState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      if (previousFavoriteState) {
        // Récupérer l'ID de l'élément de la wishlist
        const response = await api.get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const wishlistItem = response.data.data.find(
          (item: WishlistItem) => item.product_id === productId.toString()
        );
        if (wishlistItem) {
          await api.delete(`/wishlist/${wishlistItem.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Alert.alert("Succès", "Produit retiré des favoris.");
        } else {
          throw new Error("Élément de la liste de souhaits non trouvé");
        }
      } else {
        await api.post(
          "/wishlist",
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert("Succès", "Produit ajouté aux favoris.");
      }
    } catch (error: any) {
      console.error("Erreur modification favoris :", error);
      console.log("Détails erreur :", JSON.stringify(error.response?.data, null, 2));
      setIsFavorite(previousFavoriteState); // Revert on error
      let errorMessage = "Impossible de modifier les favoris. Veuillez réessayer.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert("Erreur", errorMessage);
    }
  };

  const fetchProduct = async () => {
    if (!productId) {
      setError("ID du produit non spécifié");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching product with ID:", productId);
      const response = await api.get(`/products/${productId}`);
      console.log("Réponse API:", response.data);

      if (response.data && response.data.data) {
        setProduct(response.data.data);
        const token = await getToken();
        if (token) {
          await fetchFavorites(token);
        }
      } else {
        setError("Produit non trouvé");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du produit:", error);
      setError("Erreur lors de la récupération du produit");
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get(`/reviews/products/${productId}/user-review`);
      if (response.data && response.data.data) {
        setHasUserReviewed(true);
        setUserReviewId(response.data.data.id);
      }
    } catch (error: any) {
      // Si l'erreur est 404, c'est normal - l'utilisateur n'a pas encore laissé d'avis
      if (error.response?.status !== 404) {
        console.error('Erreur lors de la vérification de l\'avis:', error);
      }
      setHasUserReviewed(false);
      setUserReviewId(null);
    }
  };

  useEffect(() => {
    console.log("Product ID from params:", productId);
    if (productId) {
      fetchProduct();
      checkUserReview();
    } else {
      setError("ID du produit invalide");
      setLoading(false);
    }
  }, [productId]);

  const getOrCreateCart = async (token: string) => {
    try {
      // First try to get the active cart
      const response = await api.get("/cart/active", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.data) {
        console.log("ProductDetail - Panier actif trouvé:", response.data.data);
        return response.data.data;
      }

      // If no active cart found, create a new one
      console.log("ProductDetail - Création d'un nouveau panier");
      const createResponse = await api.post("/cart", {
        status: "draft",
        items: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (createResponse.data && createResponse.data.data) {
        console.log("ProductDetail - Nouveau panier créé:", createResponse.data.data);
        return createResponse.data.data;
      }

      throw new Error("Réponse invalide lors de la création du panier");
    } catch (error: any) {
      console.error("ProductDetail - Erreur création panier:", error);
      console.error("ProductDetail - Détails erreur:", error.response?.data);

      // If it's a 404 error, try to create a new cart
      if (error.response?.status === 404) {
        try {
          const createResponse = await api.post("/cart", {
            status: "draft",
            items: []
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (createResponse.data && createResponse.data.data) {
            return createResponse.data.data;
          }
        } catch (createError) {
          console.error("ProductDetail - Erreur création panier (404):", createError);
        }
      }

      throw new Error("Impossible de créer le panier");
    }
  };

  const checkProductInCart = async (cartId: number, productId: number, token: string, variantId?: number): Promise<boolean> => {
    try {
      console.log('ProductDetail - Vérification panier - Paramètres:', {
        cartId,
        productId,
        variantId,
        token: token ? 'présent' : 'absent'
      });

      // Get the active cart
      const response = await api.get("/cart/active", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('ProductDetail - Réponse vérification panier:', JSON.stringify(response.data, null, 2));

      const cartItems = response.data.data?.items || [];
      console.log('ProductDetail - Items du panier:', JSON.stringify(cartItems, null, 2));

      const isInCart = cartItems.some((item: any) => {
        const matches = item.productId === productId &&
          (!variantId || item.productVariantId === variantId);
        console.log('ProductDetail - Comparaison item:', {
          itemProductId: item.productId,
          itemVariantId: item.productVariantId,
          productId,
          variantId,
          matches
        });
        return matches;
      });

      console.log('ProductDetail - Résultat vérification:', isInCart);
      return isInCart;
    } catch (error: any) {
      console.error('ProductDetail - Erreur vérification panier:', error);
      console.log('ProductDetail - Détails erreur:', JSON.stringify(error.response?.data, null, 2));

      // If it's a 404 error, consider the cart empty
      if (error.response?.status === 404) {
        console.log('ProductDetail - Panier vide ou non trouvé (404)');
        return false;
      }

      // For other errors, consider the product not in cart
      return false;
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      console.log('=== DÉBUT AJOUT AU PANIER ===');
      console.log('Produit à ajouter:', product);

      const token = await getToken();
      if (!token) {
        console.log('Aucun token trouvé, redirection vers connexion');
        Alert.alert('Erreur', 'Veuillez vous connecter pour ajouter un produit au panier');
        router.push('/connexion');
        return;
      }

      const productId = product.id;
      const variantId = selectedVariant?.id;
      const quantity = 1;

      // Check stock
      const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
      console.log('Vérification stock:', {
        productId,
        variantId,
        availableStock,
        quantity,
        productName: product.name,
        variantName: selectedVariant?.name
      });

      if (availableStock === 0) {
        Alert.alert(
          'Stock épuisé',
          `Désolé, ${selectedVariant ? selectedVariant.name : product.name} n'est plus disponible en stock.`
        );
        return;
      }

      if (availableStock < quantity) {
        Alert.alert(
          'Stock insuffisant',
          `Stock disponible pour ${selectedVariant ? selectedVariant.name : product.name} : ${availableStock}`
        );
        return;
      }

      // Get or create cart
      const cart = await getOrCreateCart(token);
      if (!cart) {
        throw new Error('Impossible de créer ou récupérer un panier');
      }

      console.log('Tentative ajout au panier:', {
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        availableStock,
        productName: product.name,
        variantName: selectedVariant?.name
      });

      // Check if product is already in cart
      const isProductInCart = await checkProductInCart(cart.id, productId, token, variantId);
      if (isProductInCart) {
        Alert.alert(
          'Information',
          selectedVariant
            ? `La variante ${selectedVariant.name} est déjà dans votre panier`
            : `${product.name} est déjà dans votre panier`
        );
        return;
      }

      const payload = {
        cartId: cart.id,
        productId,
        ...(variantId && { variantId }),
        quantity,
        unit_price: selectedVariant ? selectedVariant.price : product.price
      };

      console.log('Envoi POST /cart-items:', JSON.stringify(payload, null, 2));
      const response = await api.post('/cart-items', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Réponse POST /cart-items:', JSON.stringify(response.data, null, 2));

      Alert.alert(
        'Succès',
        selectedVariant
          ? `La variante ${selectedVariant.name} a été ajoutée au panier`
          : `${product.name} a été ajouté au panier`,
        [
          {
            text: 'Continuer mes achats',
            style: 'cancel',
          },
          {
            text: 'Voir mon panier',
            onPress: () => {
              router.push({
                pathname: '/panier',
                params: { refresh: Date.now() }
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('=== ERREUR AJOUT AU PANIER ===', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Impossible d\'ajouter le produit au panier';
      if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        router.push("/connexion");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleAddReview = async (review: { rating: number; comment: string }) => {
    try {
      if (!product || !productId) {
        throw new Error('Produit non trouvé');
      }

      if (hasUserReviewed && userReviewId) {
        // Modification d'un avis existant
        await api.patch(`/reviews/${userReviewId}`, {
          rating: review.rating,
          comment: review.comment
        });
        Alert.alert('Succès', 'Votre avis a été modifié avec succès');
      } else {
        // Création d'un nouvel avis
        await api.post('/reviews', {
          productId: product.id,
          rating: review.rating,
          comment: review.comment
        });
        Alert.alert('Succès', 'Votre avis a été ajouté avec succès');
      }

      setReviewModalVisible(false);
      setHasUserReviewed(true);
      // Rafraîchir la page pour voir le nouvel avis
      fetchProduct();
      checkUserReview(); // Mettre à jour l'ID de l'avis si nécessaire
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'avis:', error);
      throw error; // Propager l'erreur pour qu'elle soit gérée par le modal
    }
  };

  const handleReviewButtonClick = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Erreur', 'Veuillez vous connecter pour ajouter un avis');
      router.push('/connexion');
      return;
    }

    if (hasUserReviewed) {
      Alert.alert(
        'Avis existant',
        'Vous avez déjà donné votre avis sur ce produit. Voulez-vous le modifier ?',
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Modifier',
            onPress: () => setReviewModalVisible(true)
          }
        ]
      );
    } else {
      setReviewModalVisible(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Produit non trouvé</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: product.image ?
                FILE_URL + '/' + product?.image :
                `https://picsum.photos/seed/${product.id}/200/300`
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={28}
              color={isFavorite ? "#FF3B30" : "#000"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product?.name}</Text>
          <Text style={styles.productPrice}>{product?.price} €</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product?.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            <View style={styles.specsContainer}>
              {product?.propertyValues?.map((prop, index) => (
                <View key={index} style={styles.specRow}>
                  <Text style={styles.specLabel}>{prop.property.name}:</Text>
                  <Text style={styles.specValue}>{prop.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {product?.variants && product.variants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Variantes disponibles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {product.variants.map((variant, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.variantCard,
                      selectedVariant?.id === variant.id && styles.selectedVariant,
                      variant.stock === 0 && styles.outOfStockVariant
                    ]}
                    onPress={() => {
                      if (variant.stock > 0) {
                        setSelectedVariant(variant);
                      } else {
                        Alert.alert('Stock épuisé', 'Cette variante n\'est plus disponible en stock.');
                      }
                    }}
                  >
                    <Text style={[
                      styles.variantName,
                      variant.stock === 0 && styles.outOfStockText
                    ]}>{variant.name}</Text>
                    <Text style={styles.variantPrice}>{variant.price} €</Text>
                    <Text style={[
                      styles.variantStock,
                      variant.stock === 0 && styles.outOfStockText
                    ]}>
                      {variant.stock > 0 ? `En stock: ${variant.stock}` : 'Rupture de stock'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations supplémentaires</Text>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Catégorie: {product?.category?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Statut: {product?.stock > 0 ? 'En stock' : 'Rupture de stock'}
              </Text>
            </View>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Avis clients</Text>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={handleReviewButtonClick}
              >
                <Text style={styles.addReviewButtonText}>
                  {hasUserReviewed ? 'Modifier mon avis' : 'Donner mon avis'}
                </Text>
              </TouchableOpacity>
            </View>

            <ReviewsList productId={safeProductId} />
          </View>
        </View>

        <AddReviewModal
          visible={isReviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={handleAddReview}
          productId={safeProductId}
          isEdit={hasUserReviewed}
        />
      </ScrollView>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!selectedVariant && product.stock === 0) && styles.disabledButton
          ]}
          onPress={handleAddToCart}
          disabled={(!selectedVariant && product.stock === 0)}
        >
          <Text style={styles.buttonText}>
            {(!selectedVariant && product.stock === 0) ? 'Rupture de stock' : 'Ajouter au panier'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  specsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  specLabel: {
    fontSize: 16,
    color: '#666',
  },
  specValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  variantCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    width: 200,
  },
  selectedVariant: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  outOfStockVariant: {
    opacity: 0.6,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  outOfStockText: {
    color: '#999',
  },
  variantPrice: {
    fontSize: 16,
    color: '#F59E0B',
    marginBottom: 4,
  },
  variantStock: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  actionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  addToCartButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProductDetail;

function loadReviews() {
  throw new Error("Function not implemented.");
}
