import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import api from "../api/api";
import { useCart } from "../contexts/CartContext";
import { StripeService } from "../services/StripeService";
import { getToken } from "../utils/auth";

const MAX_AMOUNT = 999999.99;

interface PaymentFormProps {
    amount: number;
    addressId: number;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
    amount,
    addressId,
    onSuccess,
    onError
}) => {
    const router = useRouter();
    const { items } = useCart();
    const [loading, setLoading] = useState(false);
    const [paymentInitialized, setPaymentInitialized] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(null);

    useEffect(() => {
        if (amount > 0) {
            console.log('PaymentForm - Montant reçu:', amount);
            initializePayment();
        }
    }, [amount]);

    const createOrder = async () => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Token non trouvé');

            // Transformer les items du panier au format attendu par l'API
            const orderItems = items.map(item => ({
                productId: parseInt(item.productId),
                quantity: item.quantity,
                ...(item.productVariantId && { variantId: parseInt(item.productVariantId) })
            }));

            console.log('PaymentForm - Items transformés:', JSON.stringify(orderItems, null, 2));

            const orderData = {
                shippingAddressId: addressId,
                paymentMethod: 'card',
                items: orderItems
            };

            console.log('PaymentForm - Données de la commande:', JSON.stringify(orderData, null, 2));

            const response = await api.post('/orders', orderData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('PaymentForm - Réponse du serveur:', response.data);

            if (response.data?.data?.order?.id) {
                const newOrderId = response.data.data.order.id;
                console.log('PaymentForm - ID de commande reçu:', newOrderId);
                setOrderId(newOrderId);
                return newOrderId;
            } else {
                console.error('PaymentForm - Réponse invalide:', response.data);
                throw new Error('ID de commande non reçu');
            }
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            throw error;
        }
    };

    const initializePayment = async () => {
        try {
            setLoading(true);
            console.log('PaymentForm - Initialisation du paiement avec le montant:', amount);

            // Créer d'abord la commande
            const newOrderId = await createOrder();
            console.log('PaymentForm - Commande créée avec ID:', newOrderId);

            // Créer une intention de paiement
            const paymentIntent = await StripeService.createPaymentIntent(amount, newOrderId);
            console.log('PaymentForm - Payment Intent créé:', paymentIntent);

            if (!paymentIntent.client_secret) {
                throw new Error('Pas de client secret reçu du serveur');
            }

            // Initialiser la feuille de paiement
            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: paymentIntent.client_secret,
                merchantDisplayName: 'Ko Saye',
                style: 'automatic',
                defaultBillingDetails: {
                    address: {
                        country: 'FR',
                    },
                },
                returnURL: 'kosaye://payment-return',
            });

            if (error) {
                console.error('Erreur initialisation payment sheet:', error);
                Alert.alert('Erreur', 'Impossible d\'initialiser le paiement');
                onError?.(error);
            } else {
                console.log('PaymentForm - Payment sheet initialisé avec succès');
                setPaymentInitialized(true);
            }
        } catch (error: any) {
            console.error('Erreur initialisation paiement:', error);
            const errorMessage = error.response?.data?.details || error.message || 'Une erreur est survenue lors de l\'initialisation du paiement';
            Alert.alert('Erreur', errorMessage);
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!paymentInitialized || !orderId) {
            Alert.alert('Erreur', 'Le paiement n\'est pas encore initialisé');
            return;
        }

        try {
            setLoading(true);

            // Présenter la feuille de paiement
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    console.log('Paiement annulé par l\'utilisateur');
                    return;
                }
                console.error('Erreur paiement:', paymentError);
                Alert.alert('Erreur', paymentError.message || 'Une erreur est survenue lors du paiement');
                onError?.(paymentError);
                return;
            }

            // Mettre à jour le statut de la commande
            const token = await getToken();
            await api.put(`/orders/${orderId}`, {
                status: 'confirmed',
                paymentStatus: 'paid'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Succès
            Alert.alert('Succès', 'Paiement effectué avec succès');
            onSuccess?.();
            router.push('/commande-confirmee');

        } catch (error) {
            console.error('Erreur de paiement:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Paiement sécurisé</Text>
            <Text style={styles.amount}>{amount.toFixed(2)} €</Text>
            {amount > MAX_AMOUNT ? (
                <Text style={styles.errorText}>
                    Montant trop élevé. Veuillez contacter le service client.
                </Text>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        (loading || !paymentInitialized) && styles.payButtonDisabled
                    ]}
                    onPress={handlePayment}
                    disabled={loading || !paymentInitialized}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {paymentInitialized ? `Payer ${amount.toFixed(2)} €` : 'Initialisation...'}
                        </Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#F59E0B',
    },
    payButton: {
        backgroundColor: '#F59E0B',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
    },
}); 