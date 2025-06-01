import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PaymentForm } from './components/PaymentForm';
import { ShippingAddressDisplay } from './components/ShippingAddressDisplay';
import { useCart } from "./contexts/CartContext";

export default function PaymentScreen() {
  const router = useRouter();
  const { clearCart } = useCart();
  const params = useLocalSearchParams();
  const total = parseFloat(params.total as string) || 0;
  const addressId = parseInt(params.addressId as string, 10);

  if (!addressId) {
    console.error('Pas d\'ID d\'adresse fourni');
    router.back();
    return null;
  }

  const handlePaymentSuccess = async () => {
    console.log('Paiement réussi');
    try {
      await clearCart();
      router.replace('/commande-confirmee'); // Rediriger vers la page de confirmation
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error);
      // On redirige quand même vers la confirmation car le paiement a réussi
      router.replace('/commande-confirmee');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement sécurisé</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Montant à payer</Text>
          <Text style={styles.amount}>{total.toFixed(2)} €</Text>
        </View>

        <ShippingAddressDisplay addressId={addressId} />

        <PaymentForm
          amount={total}
          addressId={addressId}
          onSuccess={handlePaymentSuccess}
          onError={(error) => {
            console.error('Erreur de paiement:', error);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summary: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
