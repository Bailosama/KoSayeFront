import api from '../api/api';

export class StripeService {
    /**
     * Crée une intention de paiement
     */
    static async createPaymentIntent(amount: number, currency: string = 'eur') {
        try {
            const response = await api.post('/payments/create-payment-intent', {
                amount,
                currency,
            });
            return response.data;
        } catch (error) {
            console.error('Erreur création payment intent:', error);
            throw error;
        }
    }

    /**
     * Crée une session de paiement Stripe Checkout
     */
    static async createCheckoutSession(params: {
        successUrl: string;
        cancelUrl: string;
        lineItems: Array<{
            price: string;
            quantity: number;
        }>;
    }) {
        try {
            const response = await api.post('/payments/create-checkout-session', params);
            return response.data;
        } catch (error) {
            console.error('Erreur création session checkout:', error);
            throw error;
        }
    }

    /**
     * Vérifie le statut d'un paiement
     */
    static async checkPaymentStatus(paymentIntentId: string) {
        try {
            const response = await api.get(`/payments/payment-success?payment_intent=${paymentIntentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur vérification statut paiement:', error);
            throw error;
        }
    }

    /**
     * Gère l'annulation d'un paiement
     */
    static async handlePaymentCancellation(paymentIntentId: string) {
        try {
            const response = await api.get(`/payments/payment-cancel?payment_intent=${paymentIntentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur annulation paiement:', error);
            throw error;
        }
    }
} 