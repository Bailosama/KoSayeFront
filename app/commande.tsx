import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "./api/api";
import { useAuth } from "./contexts/AuthContext";
import { getToken } from "./utils/auth";

interface OrderItem {
  id: number;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
  variant: {
    id: number;
    name: string;
    image: string;
  } | null;
}

interface Order {
  id: number;
  reference: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod: string | null;
  totalAmount: number;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  shippingAddress: {
    recipientName: string;
    city: string;
    phone: string | null;
    additionalInfo: string | null;
  };
}

export default function CommandeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);

  const verifyAuthentication = async () => {
    try {
      console.log('CommandeScreen - Vérification authentification');
      const isAuth = await checkAuth();
      
      if (!isAuth) {
        console.log('CommandeScreen - Non authentifié, redirection vers connexion');
        router.push("/connexion");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('CommandeScreen - Erreur vérification auth:', error);
      router.push("/connexion");
      return false;
    }
  };

  const fetchOrders = async (pageNum = 1, shouldRefresh = false) => {
    try {
      console.log('CommandeScreen - Début fetchOrders');
      const isAuth = await verifyAuthentication();
      if (!isAuth) return;

      const token = await getToken();
      if (!token) {
        console.log('CommandeScreen - Token manquant');
        router.push("/connexion");
        return;
      }

      console.log('CommandeScreen - Récupération des commandes');
      const response = await api.get(`/orders?page=${pageNum}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('CommandeScreen - Commandes récupérées:', response.data);
      // Ensure we have an array of orders
      const newOrders = Array.isArray(response.data.data?.data) ? response.data.data.data : [];
      
      // Trier les commandes par date (les plus récentes en premier)
      const sortedOrders = newOrders.sort((a: Order, b: Order) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setHasMore(newOrders.length === 10);

      if (shouldRefresh) {
        setOrders(sortedOrders);
      } else {
        setOrders((prev) => {
          // Fusionner les anciennes et nouvelles commandes et les trier
          const allOrders = [...prev, ...sortedOrders];
          return allOrders.sort((a: Order, b: Order) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
        });
      }
    } catch (error: any) {
      console.error('CommandeScreen - Erreur fetchOrders:', error);
      if (error.response?.status === 401) {
        console.log('CommandeScreen - Erreur 401, redirection');
        router.push("/connexion");
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos commandes. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePayment = async (orderId: number) => {
    try {
      setProcessingPayment(orderId);
      const token = await getToken();
      
      // Initier le processus de paiement
      const processResponse = await api.post(
        "/api/v1/payment/process",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Vérifier le paiement
      const verifyResponse = await api.post(
        "/api/v1/payment/verify",
        { 
          orderId,
          paymentId: processResponse.data.paymentId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyResponse.data.success) {
        Alert.alert("Succès", "Paiement effectué avec succès");
        fetchOrders(1, true);
      } else {
        Alert.alert("Erreur", "Le paiement a échoué. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors du paiement. Veuillez réessayer."
      );
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setCancellingOrder(orderId);
      const token = await getToken();
      
      await api.delete(`/api/v1/orders/cancel/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Succès", "La commande a été annulée avec succès");
      fetchOrders(1, true);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'annuler la commande. Veuillez réessayer."
      );
    } finally {
      setCancellingOrder(null);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      console.log('CommandeScreen - Initialisation');
      if (!isAuthenticated) {
        console.log('CommandeScreen - Non authentifié au chargement');
        const isAuth = await verifyAuthentication();
        if (isAuth) {
          fetchOrders();
        }
      } else {
        console.log('CommandeScreen - Déjà authentifié, chargement des commandes');
        fetchOrders();
      }
    };

    initializeScreen();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#3B82F6";
      case "shipped":
        return "#8B5CF6";
      case "delivered":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      case "refunded":
        return "#EC4899";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmée";
      case "shipped":
        return "Expédiée";
      case "delivered":
        return "Livrée";
      case "cancelled":
        return "Annulée";
      case "refunded":
        return "Remboursée";
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: Order["paymentStatus"]) => {
    switch (status) {
      case "pending":
        return "Paiement en attente";
      case "paid":
        return "Payée";
      case "failed":
        return "Paiement échoué";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrderActions = (order: Order) => {
    if (order.status === "pending" && order.paymentStatus === "pending") {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={() => handlePayment(order.id)}
            disabled={processingPayment === order.id}
          >
            {processingPayment === order.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Payer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelOrder(order.id)}
            disabled={cancellingOrder === order.id}
          >
            {cancellingOrder === order.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Annuler</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/detail-commande/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderReference}>Commande #{item.reference}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.dateContainer}>
          <Text style={styles.orderDate}>
            Créée le {formatDate(item.createdAt)}
          </Text>
          {item.confirmedAt && (
            <Text style={styles.orderDate}>
              Confirmée le {formatDate(item.confirmedAt)}
            </Text>
          )}
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.orderTotal}>{parseFloat(item.totalAmount.toString()).toFixed(2)} €</Text>
          <Text style={[styles.paymentStatus, { color: item.paymentStatus === "paid" ? "#10B981" : "#EF4444" }]}>
            {getPaymentStatusText(item.paymentStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.itemsPreview}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.quantity}x {orderItem.productName}
            {orderItem.variantName ? ` - ${orderItem.variantName}` : ""}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 2} autre(s) article(s)
          </Text>
        )}
      </View>

      {renderOrderActions(item)}

      <View style={styles.orderFooter}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>
            Livraison à {item.shippingAddress?.recipientName || 'Non spécifié'}
          </Text>
          <Text style={styles.addressDetails}>
            {item.shippingAddress?.city || 'Adresse non spécifiée'}
            {item.shippingAddress?.phone && ` • ${item.shippingAddress.phone}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, Platform.OS === 'ios' ? styles.iosContainer : null]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'ios' ? styles.iosContainer : null]}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cart-outline"
              size={80}
              color="#F59E0B"
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.emptyTitle}>
              Aucune commande pour l'instant
            </Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore passé de commande. Découvrez nos produits
              et faites-vous plaisir !
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/produits")}
            >
              <Text style={styles.browseButtonText}>
                Découvrir les produits
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderReference: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
    marginTop: 40,
    marginHorizontal: 10,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F59E0B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  browseButton: {
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateContainer: {
    flex: 1,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  paymentStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  addressContainer: {
    flex: 1,
  },
  addressDetails: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  payButton: {
    backgroundColor: "#10B981",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  iosContainer: {
    paddingTop: 20,
  },
});
