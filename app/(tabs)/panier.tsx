import { FILE_URL } from "@/config";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCart } from '../contexts/CartContext';

const CartItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  processing
}: {
  item: any;
  onRemove: () => void;
  onUpdateQuantity: (id: string, increment: boolean) => void;
  processing: boolean;
}) => {
  const [imageError, setImageError] = useState(false);

  // Construire l'URL de l'image
  const imageUrl = imageError || !item.product.image
    ? `https://picsum.photos/seed/${item.product.id}/200/300`
    : item.product.image.startsWith('http')
      ? item.product.image
      : `${FILE_URL}/${item.product.image}`;

  return (
    <View key={item.id} style={styles.cartItem}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.productImage}
        onError={() => {
          setImageError(true);
          console.log('Erreur de chargement image:', item.product.image);
        }}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        {item.variant && (
          <Text style={styles.variantName}>{item.variant.name}</Text>
        )}
        <Text style={styles.productPrice}>
          {Number(item.unitPrice || item.variant?.price || item.product.price || 0).toLocaleString('fr-FR')} GNF
        </Text>
      </View>

      <View style={styles.rightContainer}>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.deleteButton}
          disabled={processing}
        >
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.id, false)}
            style={styles.quantityButton}
            disabled={processing}
          >
            <Ionicons name="remove" size={24} color="#F59E0B" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>
            {item.quantity.toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.id, true)}
            style={styles.quantityButton}
            disabled={processing}
          >
            <Ionicons name="add" size={24} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const { items, loading, totals, updateQuantity, removeFromCart, refreshCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      console.log('CartScreen - Rechargement des données du panier');
      refreshCart();
    }, [refreshCart])
  );

  const handleUpdateQuantity = async (itemId: string, increment: boolean) => {
    try {
      setProcessing(true);
      await updateQuantity(itemId, increment);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la quantité:", error);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour la quantité. Le panier a été resynchronisé."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setProcessing(true);
      await removeFromCart(itemId);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article:", error);
      Alert.alert(
        "Erreur",
        "Impossible de supprimer l'article. Le panier a été resynchronisé."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = () => {
    if (!items || items.length === 0) {
      Alert.alert("Panier vide", "Votre panier est vide. Ajoutez des articles avant de procéder au paiement.");
      return;
    }
    router.push('/verification');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  if (!items || items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={64} color="#666" />
          <Text style={styles.emptyCartText}>Votre panier est vide</Text>
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => router.push('/(tabs)/accueil')}
          >
            <Text style={styles.continueShoppingText}>Continuer vos achats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panier</Text>
      </View>

      <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={() => handleRemoveItem(item.id)}
            onUpdateQuantity={handleUpdateQuantity}
            processing={processing}
          />
        ))}
      </ScrollView>

      <View style={styles.orderSummary}>
        <Text style={styles.summaryTitle}>Récapitulatif de la commande</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Articles</Text>
          <Text style={styles.summaryValue}>
            {items.reduce((total, item) => total + item.quantity, 0)} articles
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sous-total</Text>
          <Text style={styles.summaryValue}>{totals.subtotal.toLocaleString('fr-FR')} GNF</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Réduction</Text>
          <Text style={styles.summaryValue}>{totals.discount.toLocaleString('fr-FR')} %</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Frais de livraison</Text>
          <Text style={styles.summaryValue}>{totals.shippingFee.toLocaleString('fr-FR')} GNF</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totals.total.toLocaleString('fr-FR')} GNF</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleCheckout}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.checkoutButtonText}>Vérifier</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  continueShopping: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  continueShoppingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  variantName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 8,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 12,
  },
  orderSummary: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
  },
  checkoutButton: {
    backgroundColor: '#F59E0B',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});