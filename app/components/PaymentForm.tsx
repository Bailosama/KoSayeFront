import { useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { StripeService } from '../services/StripeService';

interface PaymentFormProps {
    amount: number;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
    amount,
    onSuccess,
    onError,
}) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initializePayment();
    }, []);

    const initializePayment = async () => {
        try {
            setLoading(true);

            // Créer une intention de paiement
            const paymentIntent = await StripeService.createPaymentIntent(amount);

            // Initialiser la feuille de paiement
            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: paymentIntent.clientSecret,
                merchantDisplayName: 'Ko Saye',
                style: 'automatic',
                defaultBillingDetails: {
                    address: {
                        country: 'GN',
                    },
                },
            });

            if (error) {
                console.error('Erreur initialisation payment sheet:', error);
                Alert.alert('Erreur', 'Impossible d\'initialiser le paiement');
                onError?.(error);
            }
        } catch (error) {
            console.error('Erreur initialisation paiement:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'initialisation du paiement');
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Présenter la feuille de paiement
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                console.error('Erreur paiement:', paymentError);
                Alert.alert('Erreur', paymentError.message || 'Une erreur est survenue lors du paiement');
                onError?.(paymentError);
                return;
            }

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

            <TouchableOpacity
                style={[styles.payButton, loading && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.payButtonText}>Payer {amount.toFixed(2)} €</Text>
                )}
            </TouchableOpacity>
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
}); 