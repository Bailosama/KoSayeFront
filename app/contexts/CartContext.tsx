import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import api from '../api/api';
import { getToken } from '../utils/auth';

export interface CartItem {
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
            console.log("CartContext - Création d'un nouveau panier");
            const response = await api.post("/cart", {
                status: "draft",
                items: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("CartContext - Nouveau panier créé:", response.data);
            return response.data.data;
        } catch (error) {
            console.error("CartContext - Erreur lors de la création du panier:", error);
            throw error;
        }
    };

    const fetchCart = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.log("CartContext - Aucun token trouvé");
                setItems([]);
                setLoading(false);
                return;
            }

            console.log("CartContext - Récupération du panier actif");
            const response = await api.get("/cart/active", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("CartContext - Réponse brute du panier:", JSON.stringify(response.data, null, 2));

            if (response.data?.data) {
                const cartData = response.data.data;
                setCartId(cartData.id);

                if (!cartData.items || !Array.isArray(cartData.items)) {
                    console.log("CartContext - Pas d'items dans le panier ou format invalide");
                    setItems([]);
                    return;
                }

                console.log("CartContext - Items du panier reçus:", JSON.stringify(cartData.items, null, 2));

                const processedItems = cartData.items.map((item: any) => {
                    console.log("CartContext - Traitement de l'item:", JSON.stringify(item, null, 2));

                    const processedItem: CartItem = {
                        id: item.id?.toString() || '',
                        cartId: Number(item.cartId) || 0,
                        productId: item.productId?.toString() || '',
                        productVariantId: item.productVariantId?.toString() || null,
                        quantity: Number(item.quantity) || 0,
                        unitPrice: item.unitPrice?.toString() || '0',
                        createdAt: item.createdAt || new Date().toISOString(),
                        updatedAt: item.updatedAt || new Date().toISOString(),
                        product: {
                            id: item.product?.id?.toString() || '',
                            name: item.product?.name || 'Produit inconnu',
                            description: item.product?.description || '',
                            price: item.product?.price?.toString() || '0',
                            stock: Number(item.product?.stock) || 0,
                            image: item.product?.image || undefined,
                            isActive: item.product?.isActive ?? true,
                            categoryId: Number(item.product?.categoryId) || 0,
                            status: item.product?.status || 'active',
                            createdAt: item.product?.createdAt || new Date().toISOString(),
                            updatedAt: item.product?.updatedAt || new Date().toISOString()
                        }
                    };

                    if (item.variant) {
                        processedItem.variant = {
                            id: item.variant.id?.toString() || '',
                            name: item.variant.name || '',
                            price: Number(item.variant.price) || 0,
                            stock: Number(item.variant.stock) || 0,
                            image: item.variant.image || undefined,
                            productId: item.variant.productId?.toString() || '',
                            createdAt: item.variant.createdAt || new Date().toISOString(),
                            updatedAt: item.variant.updatedAt || new Date().toISOString()
                        };
                    }

                    return processedItem;
                });

                console.log("CartContext - Items traités:", JSON.stringify(processedItems, null, 2));
                setItems(processedItems);

                // Calculer les totaux
                const subtotal = processedItems.reduce((sum: number, item: CartItem) => {
                    const unitPrice = Number(item.unitPrice) ||
                        Number(item.variant?.price) ||
                        Number(item.product.price) ||
                        0;
                    return sum + (unitPrice * item.quantity);
                }, 0);

                const discount = subtotal > 50000 ? 10 : 0;
                const shippingFee = subtotal > 200 ? 0 : 5;
                const total = subtotal - discount + shippingFee;

                setTotals({
                    subtotal,
                    discount,
                    shippingFee,
                    total
                });
            } else {
                console.log("CartContext - Pas de données de panier dans la réponse");
                const newCart = await createNewCart(token);
                setCartId(newCart.id);
                setItems([]);
                setTotals({
                    subtotal: 0,
                    discount: 0,
                    shippingFee: 0,
                    total: 0
                });
            }
        } catch (error: any) {
            console.error("CartContext - Erreur lors de la récupération du panier:", error);
            if (error.response?.status === 404) {
                try {
                    const token = await getToken();
                    if (token) {
                        const newCart = await createNewCart(token);
                        setCartId(newCart.id);
                        setItems([]);
                        setTotals({
                            subtotal: 0,
                            discount: 0,
                            shippingFee: 0,
                            total: 0
                        });
                    }
                } catch (createError) {
                    console.error("CartContext - Erreur lors de la création d'un nouveau panier:", createError);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId: string, quantity: number, variantId?: string) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour ajouter au panier");
                return;
            }

            if (!cartId) {
                const newCart = await createNewCart(token);
                setCartId(newCart.id);
            }

            const response = await api.post(`/cart/${cartId}/items`, {
                productId,
                variantId,
                quantity
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                await fetchCart();
            }
        } catch (error: any) {
            console.error("CartContext - Erreur lors de l'ajout au panier:", error);
            throw error;
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour modifier le panier");
                return;
            }

            await api.delete(`/cart/${cartId}/items/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await fetchCart();
        } catch (error: any) {
            console.error("CartContext - Erreur lors de la suppression de l'article:", error);
            throw error;
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

            // Mise à jour optimiste
            const updatedItems = items.map(cartItem =>
                cartItem.id === itemId
                    ? { ...cartItem, quantity: newQuantity }
                    : cartItem
            );
            setItems(updatedItems);

            // Calculer les totaux immédiatement
            const subtotal = updatedItems.reduce((sum: number, item: CartItem) => {
                const unitPrice = Number(item.unitPrice) ||
                    Number(item.variant?.price) ||
                    Number(item.product.price) ||
                    0;
                return sum + (unitPrice * item.quantity);
            }, 0);

            const discount = subtotal > 50000 ? 10 : 0;
            const shippingFee = subtotal > 200 ? 0 : 5;
            const total = subtotal - discount + shippingFee;

            setTotals({
                subtotal,
                discount,
                shippingFee,
                total
            });

            // Appel API en arrière-plan
            const response = await api.patch(
                `/cart/${cartId}/items/${itemId}/${increment ? 'increment' : 'decrement'}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Si l'API échoue, on recharge le panier pour synchroniser
            if (!response.data?.success) {
                console.log("CartContext - Échec de la mise à jour, rechargement du panier");
                await fetchCart();
            }
        } catch (error: any) {
            console.error("CartContext - Erreur lors de la mise à jour de la quantité:", error);
            // En cas d'erreur, on recharge le panier pour revenir à l'état correct
            await fetchCart();
            throw error;
        }
    };

    const clearCart = async () => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour vider le panier");
                return;
            }

            await api.delete(`/cart/${cartId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newCart = await createNewCart(token);
            setCartId(newCart.id);
            setItems([]);
            setTotals({
                subtotal: 0,
                discount: 0,
                shippingFee: 0,
                total: 0
            });
        } catch (error: any) {
            console.error("CartContext - Erreur lors de la suppression du panier:", error);
            throw error;
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