import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

export default function DetailCommandeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { checkAuth } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/connexion");
        return;
      }

      const token = await getToken();
      if (!token) {
        router.push("/connexion");
        return;
      }

      setLoading(true);
      const response = await api.get(`/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrder(response.data.data);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des détails:", error);
      if (error.response?.status === 401) {
        router.push("/connexion");
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de récupérer les détails de la commande. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
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

  const handleCancelOrder = async () => {
    if (!order) return;

    Alert.alert(
      "Annuler la commande",
      "Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.",
      [
        {
          text: "Non",
          style: "cancel"
        },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingOrder(true);
              const token = await getToken();
              if (!token) {
                router.push("/connexion");
                return;
              }

              await api.patch(
                `/orders/${order.id}/status`,
                { status: 'cancelled' },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // Mise à jour de l'état local
              setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);

              Alert.alert("Succès", "La commande a été annulée avec succès");
            } catch (error) {
              console.error("Erreur lors de l'annulation:", error);
              Alert.alert(
                "Erreur",
                "Impossible d'annuler la commande. Veuillez réessayer."
              );
            } finally {
              setCancellingOrder(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Commande non trouvée</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la commande</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* En-tête de la commande */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderReference}>Commande #{order.reference}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Bouton d'annulation pour les commandes en attente */}
        {order.status === 'pending' && (
          <TouchableOpacity
            style={[styles.cancelButton, cancellingOrder && styles.cancelButtonDisabled]}
            onPress={handleCancelOrder}
            disabled={cancellingOrder}
          >
            {cancellingOrder ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Annuler la commande</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Informations de la commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de création</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          {order.confirmedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de confirmation</Text>
              <Text style={styles.infoValue}>{formatDate(order.confirmedAt)}</Text>
            </View>
          )}
          {order.shippedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'expédition</Text>
              <Text style={styles.infoValue}>{formatDate(order.shippedAt)}</Text>
            </View>
          )}
          {order.deliveredAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de livraison</Text>
              <Text style={styles.infoValue}>{formatDate(order.deliveredAt)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut du paiement</Text>
            <Text
              style={[
                styles.infoValue,
                { color: order.paymentStatus === "paid" ? "#10B981" : "#EF4444" },
              ]}
            >
              {getPaymentStatusText(order.paymentStatus)}
            </Text>
          </View>
          {order.paymentMethod && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Méthode de paiement</Text>
              <Text style={styles.infoValue}>{order.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* Adresse de livraison */}
        {order.shippingAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressName}>{order.shippingAddress.recipientName}</Text>
              <Text style={styles.addressText}>{order.shippingAddress.street}</Text>
              <Text style={styles.addressText}>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </Text>
              <Text style={styles.addressText}>{order.shippingAddress.country}</Text>
              {order.shippingAddress.phone && (
                <Text style={styles.addressText}>Tél: {order.shippingAddress.phone}</Text>
              )}
              {order.shippingAddress.additionalInfo && (
                <Text style={styles.addressText}>
                  Info: {order.shippingAddress.additionalInfo}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Articles de la commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image
                source={{
                  uri: item.variant?.image || item.product.image || "https://via.placeholder.com/100",
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variantName && (
                  <Text style={styles.itemVariant}>{item.variantName}</Text>
                )}
                <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {parseFloat(item.unitPrice.toString()).toLocaleString('fr-FR')} GNF
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {parseFloat(item.subtotal.toString()).toLocaleString('fr-FR')} GNF
              </Text>
            </View>
          ))}
        </View>

        {/* Total de la commande */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            {parseFloat(order.totalAmount.toString()).toLocaleString('fr-FR')} GNF
          </Text>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  orderHeader: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  orderReference: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  addressContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 2,
  },
  orderItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 