import api from '../api/api';

export class StripeService {
    /**
     * Crée une intention de paiement
     */
    static async createPaymentIntent(amount: number, orderId: number, currency: string = 'gnf') {
        try {
            // Convertir le montant en centimes pour Stripe
            const amountInCents = Math.round(amount * 100);
            console.log('StripeService - Création payment intent:', { amount: amountInCents, currency, orderId });

            const response = await api.post('/payments/create-payment-intent', {
                amount: amountInCents,
                currency,
                order_id: orderId
            });
            console.log('StripeService - Réponse payment intent:', response.data);
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
        orderId: number;
    }) {
        try {
            const response = await api.post('/payments/create-checkout-session', {
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                line_items: params.lineItems,
                order_id: params.orderId
            });
            return response.data;
        } catch (error) {
            console.error('Erreur création session checkout:', error);
            throw error;
        }
    }

    /**
     * Vérifie le statut d'un paiement
     */
    static async checkPaymentStatus(paymentId: string) {
        try {
            const response = await api.get(`/payments/payment-success?payment_id=${paymentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur vérification statut paiement:', error);
            throw error;
        }
    }

    /**
     * Gère l'annulation d'un paiement
     */
    static async handlePaymentCancellation(paymentId: string) {
        try {
            const response = await api.get(`/payments/payment-cancel?payment_id=${paymentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur annulation paiement:', error);
            throw error;
        }
    }
} 