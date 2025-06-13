import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  isHidden: boolean;
  items: OrderItem[];
  shippingAddressId: number | null;
  shippingAddress: {
    id: number;
    recipientName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string | null;
    additionalInfo: string | null;
  } | null;
}

export default function CommandeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [hasMore, setHasMore] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [hidingOrder, setHidingOrder] = useState<number | null>(null);

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

  const fetchOrders = useCallback(async (pageNum = 1, shouldRefresh = false) => {
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

      setLoading(true);

      console.log('CommandeScreen - Récupération des commandes');
      const response = await api.get(
        `/orders?page=${pageNum}&limit=${ITEMS_PER_PAGE}&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('CommandeScreen - Commandes récupérées:', JSON.stringify(response.data, null, 2));
      const newOrders = Array.isArray(response.data.data?.data) ? response.data.data.data : [];
      const total = response.data.data?.total || 0;
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
      setOrders(newOrders);
      setPage(pageNum);

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
  }, [router]);

  useEffect(() => {
    console.log('CommandeScreen - Initial load effect');
    fetchOrders(1, true);
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      console.log('CommandeScreen - Focus effect triggered');
      if (isAuthenticated) {
        fetchOrders(1, true);
      }
      return () => {
        console.log('CommandeScreen - Focus effect cleanup');
      };
    }, [isAuthenticated, fetchOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handlePayment = async (orderId: number) => {
    try {
      setProcessingPayment(orderId);
      const token = await getToken();

      // Initier le processus de paiement
      const processResponse = await api.post(
        `/payments/process`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Vérifier le paiement
      const verifyResponse = await api.post(
        `/payments/verify`,
        {
          orderId,
          paymentId: processResponse.data.paymentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyResponse.data.success) {
        // Mettre à jour le statut de la commande
        await api.patch(
          `/orders/${orderId}/status`,
          { status: 'paid' },
          { headers: { Authorization: `Bearer ${token}` } }
        );

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

      await api.patch(
        `/orders/${orderId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mise à jour optimiste de l'interface
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: 'cancelled' }
            : order
        )
      );

      Alert.alert("Succès", "La commande a été annulée");
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

  const handleHideOrder = async (orderId: number) => {
    try {
      setHidingOrder(orderId);
      const order = orders.find(o => o.id === orderId);

      if (!order) {
        Alert.alert("Erreur", "Commande non trouvée");
        return;
      }

      Alert.alert(
        "Masquer la commande",
        "Cette commande sera masquée de votre historique mais restera dans notre système pour des raisons légales et de suivi. Voulez-vous continuer ?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Masquer",
            onPress: async () => {
              try {
                const token = await getToken();
                await api.patch(`/orders/${orderId}/visibility`,
                  { is_hidden: true },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                // Mise à jour optimiste de l'interface
                setOrders(prevOrders =>
                  prevOrders.map(order =>
                    order.id === orderId
                      ? { ...order, isHidden: true }
                      : order
                  )
                );

                Alert.alert("Succès", "La commande a été masquée de votre historique");
              } catch (error) {
                console.error("Erreur lors du masquage de la commande:", error);
                Alert.alert(
                  "Erreur",
                  "Impossible de masquer la commande. Veuillez réessayer."
                );
              } finally {
                setHidingOrder(null);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setHidingOrder(null);
    }
  };

  const handleHideAllCompletedOrders = async () => {
    try {
      const completedOrders = orders.filter(
        order => order.status === "cancelled" || order.paymentStatus === "paid"
      );

      if (completedOrders.length === 0) {
        Alert.alert("Information", "Aucune commande terminée à masquer.");
        return;
      }

      Alert.alert(
        "Masquer toutes les commandes terminées",
        `Êtes-vous sûr de vouloir masquer les ${completedOrders.length} commandes terminées de l'historique ?`,
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Masquer tout",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                const token = await getToken();

                // Masquer toutes les commandes terminées en parallèle
                await Promise.all(
                  completedOrders.map(order =>
                    api.patch(`/orders/${order.id}/visibility`, { isHidden: true }, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                  )
                );

                // Mise à jour optimiste de l'interface
                setOrders(prevOrders =>
                  prevOrders.filter(order =>
                    !(order.status === "cancelled" || order.paymentStatus === "paid")
                  )
                );

                Alert.alert(
                  "Succès",
                  `${completedOrders.length} commande${completedOrders.length > 1 ? 's' : ''} masquée${completedOrders.length > 1 ? 's' : ''} avec succès`
                );
              } catch (error) {
                console.error("Erreur lors du masquage multiple:", error);
                Alert.alert(
                  "Erreur",
                  "Impossible de masquer certaines commandes. Veuillez réessayer."
                );
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur lors du masquage multiple:", error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
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
    return (
      <View style={styles.actionButtons}>
        {order.status === 'pending' && order.paymentStatus !== 'paid' && (
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
        )}

        {order.status === 'pending' && (
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
        )}

        {!order.isHidden && (order.status === 'delivered' || order.status === 'cancelled') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.hideButton]}
            onPress={() => handleHideOrder(order.id)}
            disabled={hidingOrder === order.id}
          >
            {hidingOrder === order.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.hideButtonContent}>
                <Ionicons name="eye-off-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Masquer</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderOrderAddress = (order: Order) => {
    if (!order.shippingAddress) {
      return (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>Adresse non spécifiée</Text>
        </View>
      );
    }

    const { recipientName, street, city, postalCode, country, phone } = order.shippingAddress;
    const fullAddress = [street, city, postalCode, country].filter(Boolean).join(", ");

    return (
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>
          Livraison à {recipientName}
        </Text>
        <Text style={styles.addressDetails}>
          {fullAddress}
          {phone && ` • ${phone}`}
        </Text>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    return (
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
            <Text style={styles.orderTotal}>{parseFloat(item.totalAmount.toString()).toLocaleString('fr-FR')} GNF</Text>
            <Text style={[styles.paymentStatus, { color: item.paymentStatus === "paid" ? "#10B981" : "#EF4444" }]}>
              {getPaymentStatusText(item.paymentStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.itemsPreview}>
          {item.items.slice(0, 2).map((orderItem) => (
            <Text key={`${item.id}-${orderItem.id}`} style={styles.itemText}>
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
          {renderOrderAddress(item)}
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
          onPress={() => page > 1 && fetchOrders(page - 1)}
          disabled={page === 1 || loading}
        >
          <Ionicons name="chevron-back" size={24} color={page === 1 ? "#9CA3AF" : "#F59E0B"} />
          <Text style={[
            styles.paginationButtonText,
            page === 1 && styles.paginationButtonTextDisabled
          ]}>Précédent</Text>
        </TouchableOpacity>

        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {page} sur {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, page >= totalPages && styles.paginationButtonDisabled]}
          onPress={() => page < totalPages && fetchOrders(page + 1)}
          disabled={page >= totalPages || loading}
        >
          <Text style={[
            styles.paginationButtonText,
            page >= totalPages && styles.paginationButtonTextDisabled
          ]}>Suivant</Text>
          <Ionicons name="chevron-forward" size={24} color={page >= totalPages ? "#9CA3AF" : "#F59E0B"} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, Platform.OS === 'ios' ? styles.iosContainer : null]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'ios' ? styles.iosContainer : null]}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.filterButton, showAllOrders && styles.filterButtonActive]}
            onPress={() => {
              setShowAllOrders(!showAllOrders);
              setPage(1);
              fetchOrders(1, true);
            }}
          >
            <Text style={[styles.filterButtonText, showAllOrders && styles.filterButtonTextActive]}>
              {showAllOrders ? "Masquer les commandes terminées" : "Afficher toutes les commandes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={renderPagination}
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
  hideButton: {
    backgroundColor: '#6B7280',
  },
  hideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  iosContainer: {
    paddingTop: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#F59E0B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  hiddenOrderCard: {
    opacity: 0.7,
    backgroundColor: "#F3F4F6",
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF8E1',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  paginationButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paginationText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  hiddenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  hiddenBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
});
