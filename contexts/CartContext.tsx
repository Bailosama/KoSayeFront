import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api from '../app/api/api';

// Types
export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  productId: number;
  variantId?: number;
  cartId: number; // Ajouté pour PUT
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'> & { productId: number; variantId?: number }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => {
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
  };
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        const token = localStorage.getItem('authToken');
        console.log('CartContext - Token web :', token ? 'Présent' : 'Aucun');
        return token;
      }
      const token = await SecureStore.getItemAsync('authToken');
      console.log('CartContext - Token mobile :', token ? 'Présent' : 'Aucun');
      return token;
    } catch (error) {
      console.error('CartContext - Erreur récupération token :', error);
      return null;
    }
  };

  const saveCart = async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      console.log('CartContext - Panier sauvegardé dans AsyncStorage :', cartItems);
    } catch (error) {
      console.error('CartContext - Erreur sauvegarde panier :', error);
    }
  };

  async function fetchCart() {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get('/cart/active');
        console.log('CartContext - Réponse GET /cart/active :', JSON.stringify(response.data, null, 2));
  
        const cart = response.data.data;
        const cartItems = cart.items?.map((item: any) => ({
          id: item.id.toString(),
          name: item.product?.name || 'Produit inconnu',
          brand: item.product?.category?.name || item.product?.categoryId || 'Inconnu',
          price: parseFloat(item.unitPrice) || parseFloat(item.variant?.price) || parseFloat(item.product?.price) || 0,
          quantity: item.quantity,
          image: item.variant?.image || item.product?.image || 'https://placehold.co/80x80',
          productId: item.productId,
          variantId: item.productVariantId,
          cartId: item.cartId,
        })) || [];
  
        setItems(cartItems);
        await saveCart(cartItems);
      } else {
        console.warn('CartContext - Aucun token, chargement depuis AsyncStorage');
        const savedCart = await AsyncStorage.getItem('cart');
        console.log('CartContext - Contenu AsyncStorage :', savedCart);
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      }
    } catch (error: any) {
      console.error('CartContext - Erreur fetchCart :', error.message);
      console.log('CartContext - Détails erreur :', JSON.stringify(error.response?.data, null, 2));
      const savedCart = await AsyncStorage.getItem('cart');
      console.log('CartContext - Contenu AsyncStorage (erreur) :', savedCart);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchCart();
  }, []);

  const addItem = async (item: Omit<CartItem, 'id'> & { productId: number; variantId?: number }) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      // Try to get existing cart first
      try {
        const cartResponse = await api.get("/cart/active", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (cartResponse.data?.data?.id) {
          // Add item to existing cart
          const response = await api.post('/cart-items', {
            cartId: cartResponse.data.data.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unit_price: item.price,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('CartContext - Réponse POST /cart-items:', JSON.stringify(response.data, null, 2));
          await fetchCart();
          return;
        }
      } catch (error: any) {
        // Only create new cart if we get a 404
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      // Create new cart only if no active cart exists
      const cartResponse = await api.post("/cart", {
        status: "draft",
        items: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cartResponse.data?.data?.id) {
        throw new Error('Erreur lors de la création du panier');
      }

      // Add item to new cart
      const response = await api.post('/cart-items', {
        cartId: cartResponse.data.data.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('CartContext - Réponse POST /cart-items après création panier:', JSON.stringify(response.data, null, 2));
      await fetchCart();

    } catch (error: any) {
      console.error('CartContext - Erreur addItem :', error.message);
      console.log('CartContext - Détails erreur :', JSON.stringify(error.response?.data, null, 2));
      
      // Store item locally if API fails
      setItems((currentItems) => {
        const newItem = {
          ...item,
          id: `local-${Date.now()}`,
          cartId: 0,
        };
        const newItems = [...currentItems, newItem];
        saveCart(newItems);
        return newItems;
      });
      
      throw error;
    }
  };

  const removeItem = async (id: string) => {
    try {
      const token = await getToken();
      if (token) {
        await api.delete(`/carts/${id}`); // Ajusté pour correspondre aux routes
        console.log('CartContext - Article supprimé via DELETE /carts/', id);
        await fetchCart();
      } else {
        setItems((currentItems) => {
          const newItems = currentItems.filter((item) => item.id !== id);
          saveCart(newItems);
          return newItems;
        });
      }
    } catch (error: any) {
      console.error('CartContext - Erreur removeItem :', error.message);
      console.log('CartContext - Détails erreur :', JSON.stringify(error.response?.data, null, 2));
    }
  };

  async function updateQuantity(itemId: string, newQuantity: number) {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      if (newQuantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
  
      const response = await api.put(`/cart-items/${itemId}`, {
        quantity: newQuantity,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('CartContext - Réponse PUT /cart-items :', JSON.stringify(response.data, null, 2));
  
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
  
      await saveCart(items);
    } catch (error: any) {
      console.error('CartContext - Erreur updateQuantity :', error.message);
      console.log('CartContext - Détails erreur :', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }
  const clearCart = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get('/cart/active');
        const cart = response.data.data;
        await api.delete(`/carts/clear/${cart.id}`); // Ajusté pour correspondre aux routes
        console.log('CartContext - Panier vidé via API');
      }
      setItems([]);
      await saveCart([]);
    } catch (error: any) {
      console.error('CartContext - Erreur clearCart :', error.message);
      console.log('CartContext - Détails erreur :', JSON.stringify(error.response?.data, null, 2));
    }
  };

  const getCartTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal > 100 ? 10 : 0;
    const shippingFee = subtotal > 200 ? 0 : 5;
    const total = subtotal - discount + shippingFee;

   return { subtotal, discount, shippingFee, total };
  };

  if (isLoading) {
    return null;
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getCartTotal,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};