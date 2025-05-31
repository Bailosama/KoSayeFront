import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "./api/api";
import { useAuth } from "./contexts/AuthContext";
import { useCart } from "./contexts/CartContext";
import { getToken } from "./utils/auth";

type PaymentMethod = 'orange' | 'areeba';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  productId: string;
  productVariantId?: string;
}

interface Cart {
  id: string;
  reference: string;
  status: string;
  userId: number;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
}

interface Address {
  id: number;
  userId: number;
  recipientName: string;
  city: string;
  phone: string | null;
  additionalInfo: string | null;
  isDefaultShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

const MAX_AMOUNT = 999999.99;

export default function VerificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totals } = useCart();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [newAddress, setNewAddress] = useState({
    recipientName: "",
    city: "",
    phone: "",
    additionalInfo: "",
    isDefaultShipping: false
  });

  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    city: "",
    phone: "",
    additionalInfo: "",
  });

  useEffect(() => {
    console.log('=== VÉRIFICATION DES DONNÉES ===');
    console.log('Items:', items);
    console.log('Totaux:', totals);
    fetchAddresses();
  }, [items, totals]);

  const fetchAddresses = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour continuer");
        router.push("/connexion");
        return;
      }

      const response = await api.get("/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data) {
        setAddresses(response.data.data);
        // Sélectionner l'adresse par défaut si elle existe
        const defaultAddress = response.data.data.find((addr: Address) => addr.isDefaultShipping);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des adresses:", error);
      Alert.alert("Erreur", "Impossible de récupérer vos adresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressFormChange = (field: string, value: string) => {
    setAddressForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAddressForm = () => {
    if (!addressForm.recipientName.trim()) {
      Alert.alert("Erreur", "Le nom du destinataire est requis");
      return false;
    }
    if (!addressForm.city.trim()) {
      Alert.alert("Erreur", "La ville est requise");
      return false;
    }
    if (!addressForm.phone.trim()) {
      Alert.alert("Erreur", "Le numéro de téléphone est requis");
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateAddressForm()) return;

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour continuer");
        router.push("/connexion");
        return;
      }

      const response = await api.post("/addresses", addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data) {
        const newAddress = response.data.data;
        setAddresses(prev => [...prev, newAddress]);
        setSelectedAddressId(newAddress.id);
        setShowNewAddressForm(false);
        setAddressForm({
          recipientName: "",
          city: "",
          phone: "",
          additionalInfo: "",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'adresse:", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'adresse");
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      Alert.alert("Erreur", "Veuillez sélectionner une adresse de livraison");
      return;
    }

    if (totals.total > MAX_AMOUNT) {
      Alert.alert(
        "Erreur",
        "Le montant total dépasse la limite autorisée de 999 999,99€. Veuillez contacter le service client pour les commandes importantes."
      );
      return;
    }

    try {
      setProcessingPayment(true);
      const token = await getToken();
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour continuer");
        router.push("/connexion");
        return;
      }

      // Rediriger vers la page de paiement avec le montant total
      router.push({
        pathname: "/paiement",
        params: {
          total: totals.total,
          addressId: selectedAddressId
        }
      });
    } catch (error) {
      console.error("Erreur lors de la préparation du paiement:", error);
      Alert.alert("Erreur", "Impossible de procéder au paiement");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/(tabs)/accueil")}
          >
            <Text style={styles.shopButtonText}>Continuer mes achats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif de la commande</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Articles ({items.reduce((total, item) => total + item.quantity, 0)})</Text>
            <Text style={styles.summaryValue}>{totals.subtotal.toFixed(2)} €</Text>
          </View>
          {totals.discount > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Réduction</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>-{totals.discount.toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>{totals.shippingFee.toFixed(2)} €</Text>
          </View>
          <View style={[styles.summaryItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{totals.total.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[
                styles.addressCard,
                selectedAddressId === address.id && styles.selectedAddress
              ]}
              onPress={() => setSelectedAddressId(address.id)}
            >
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{address.recipientName}</Text>
                <Text style={styles.addressDetails}>{address.city}</Text>
                <Text style={styles.addressPhone}>{address.phone}</Text>
                {address.additionalInfo && (
                  <Text style={styles.addressAdditional}>{address.additionalInfo}</Text>
                )}
              </View>
              {selectedAddressId === address.id && (
                <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => setShowNewAddressForm(true)}
          >
            <Text style={styles.addAddressButtonText}>+ Ajouter une nouvelle adresse</Text>
          </TouchableOpacity>
        </View>

        {showNewAddressForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouvelle adresse</Text>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nom du destinataire *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez le nom du destinataire"
                  value={addressForm.recipientName}
                  onChangeText={(value) => handleAddressFormChange("recipientName", value)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ville *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez la ville"
                  value={addressForm.city}
                  onChangeText={(value) => handleAddressFormChange("city", value)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Téléphone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez le numéro de téléphone"
                  value={addressForm.phone}
                  onChangeText={(value) => handleAddressFormChange("phone", value)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Informations complémentaires</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ajoutez des informations complémentaires (optionnel)"
                  value={addressForm.additionalInfo}
                  onChangeText={(value) => handleAddressFormChange("additionalInfo", value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddAddress}
              >
                <Text style={styles.submitButtonText}>Ajouter l'adresse</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.proceedButton,
          (processingPayment || !selectedAddressId) && styles.disabledButton
        ]}
        onPress={handleProceedToPayment}
        disabled={processingPayment || !selectedAddressId}
      >
        {processingPayment ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.proceedButtonText}>Procéder au paiement</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  discountValue: {
    color: '#22C55E',
  },
  totalItem: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F59E0B',
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAddress: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
  },
  addressAdditional: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addAddressButton: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    marginTop: 8,
  },
  addAddressButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#F59E0B',
    margin: 16,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
