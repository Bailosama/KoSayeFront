import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import api from '../api/api';
import { getToken } from '../utils/auth';

interface CartItem {
    id: string;
    cartId: number;
    productId: string;
    productVariantId: string | null;
    quantity: number;
    unitPrice: string;
    createdAt: string;
    updatedAt: string;
    product: {
        id: string;
        name: string;
        description: string;
        price: string;
        stock: number;
        image?: string;
        isActive: boolean;
        categoryId: number;
        status: string;
        createdAt: string;
        updatedAt: string;
    };
    variant?: {
        id: string;
        name: string;
        price: number;
        stock: number;
        image?: string | null;
        productId: string;
        createdAt: string;
        updatedAt: string;
    };
}

interface CartTotals {
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
}

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    totals: CartTotals;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, increment: boolean) => Promise<void>;
    clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartId, setCartId] = useState<string | null>(null);
    const [totals, setTotals] = useState<CartTotals>({
        subtotal: 0,
        discount: 0,
        shippingFee: 0,
        total: 0
    });

    const createNewCart = async (token: string) => {
        try {
            const response = await api.post("/cart", {
                status: "draft",
                items: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            console.error("Erreur lors de la création du panier:", error);
            throw error;
        }
    };

    const fetchCart = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.log("CartContext - Aucun token trouvé");
                setItems([]);
                return;
            }

            const response = await api.get("/cart/active", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.data) {
                const cartData = response.data.data;
                setCartId(cartData.id);
                if (cartData.items && Array.isArray(cartData.items)) {
                    const processedItems = cartData.items.map((item: CartItem) => ({
                        ...item,
                        unitPrice: item.unitPrice || item.variant?.price?.toString() || item.product.price,
                        product: {
                            ...item.product,
                            price: item.product.price.toString()
                        },
                        variant: item.variant ? {
                            ...item.variant,
                            price: Number(item.variant.price)
                        } : undefined
                    }));
                    setItems(processedItems);
                }
            }
        } catch (error) {
            console.error("CartContext - Erreur lors de la récupération du panier:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        const calculateTotals = () => {
            const subtotal = items.reduce((sum, item) => {
                const unitPrice = Number(item.unitPrice) ||
                    Number(item.variant?.price) ||
                    Number(item.product.price) ||
                    0;
                const quantity = Number(item.quantity) || 0;
                return sum + (unitPrice * quantity);
            }, 0);

            const discount = subtotal > 100 ? 10 : 0;
            const shippingFee = subtotal > 200 ? 0 : 5;
            const total = subtotal - discount + shippingFee;

            setTotals({
                subtotal,
                discount,
                shippingFee,
                total
            });
        };

        calculateTotals();
    }, [items]);

    const refreshCart = async () => {
        await fetchCart();
    };

    const addToCart = async (productId: string, quantity: number, variantId?: string) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour ajouter au panier");
                return;
            }

            if (!cartId) {
                console.log("CartContext - Pas de cartId, création d'un nouveau panier");
                const newCart = await createNewCart(token);
                setCartId(newCart.id);
                console.log("CartContext - Nouveau cartId:", newCart.id);
            }

            console.log("CartContext - Ajout au panier:", {
                cartId,
                productId,
                variantId,
                quantity
            });

            const response = await api.post(`/cart/${cartId}/items`, {
                productId,
                variantId,
                quantity
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("CartContext - Réponse ajout au panier:", JSON.stringify(response.data, null, 2));

            if (response.data?.success) {
                console.log("CartContext - Article ajouté avec succès");
                await fetchCart();
            }
        } catch (error) {
            console.error("CartContext - Erreur lors de l'ajout au panier:", error);
            Alert.alert("Erreur", "Impossible d'ajouter l'article au panier");
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await api.delete(`/cart/${cartId}/items/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await refreshCart();
        } catch (error) {
            console.error("Erreur lors de la suppression de l'article:", error);
            Alert.alert("Erreur", "Impossible de supprimer l'article");
        }
    };

    const updateQuantity = async (itemId: string, increment: boolean) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour modifier le panier");
                return;
            }

            const item = items.find(i => i.id === itemId);
            if (!item) {
                console.error("CartContext - Article non trouvé:", itemId);
                return;
            }

            const newQuantity = increment ? item.quantity + 1 : Math.max(0, item.quantity - 1);

            if (newQuantity === 0) {
                await removeFromCart(itemId);
                return;
            }

            const response = await api.put(`/cart/${cartId}/items/${itemId}`, {
                quantity: newQuantity
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                await fetchCart();
            }
        } catch (error) {
            console.error("CartContext - Erreur lors de la mise à jour de la quantité:", error);
            Alert.alert("Erreur", "Impossible de mettre à jour la quantité");
        }
    };

    const clearCart = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            await api.delete(`/cart/${cartId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setItems([]);
            const newCart = await createNewCart(token);
            setCartId(newCart.id);
        } catch (error) {
            console.error("Erreur lors de la suppression du panier:", error);
            Alert.alert("Erreur", "Impossible de vider le panier");
        }
    };

    return (
        <CartContext.Provider
            value={{
                items,
                loading,
                totals,
                refreshCart: fetchCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
} 