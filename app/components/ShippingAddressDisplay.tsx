import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import api from '../api/api';
import { getToken } from '../utils/auth';

interface ShippingAddressDisplayProps {
    addressId: number;
}

export const ShippingAddressDisplay: React.FC<ShippingAddressDisplayProps> = ({ addressId }) => {
    const [address, setAddress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const token = await getToken();
                if (!token) throw new Error('Token non trouvé');

                const response = await api.get(`/addresses/${addressId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data?.data) {
                    setAddress(response.data.data);
                } else {
                    setError('Adresse non trouvée');
                }
            } catch (err) {
                console.error('Erreur lors de la récupération de l\'adresse:', err);
                setError('Impossible de charger l\'adresse');
            } finally {
                setLoading(false);
            }
        };

        fetchAddress();
    }, [addressId]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Chargement de l'adresse...</Text>
            </View>
        );
    }

    if (error || !address) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error || 'Adresse non disponible'}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Adresse de livraison</Text>
            <View style={styles.addressCard}>
                <Text style={styles.recipientName}>{address.recipientName}</Text>
                <Text style={styles.addressText}>{address.city}</Text>
                {address.phone && <Text style={styles.addressText}>{address.phone}</Text>}
                {address.additionalInfo && (
                    <Text style={styles.additionalInfo}>{address.additionalInfo}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    addressCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    recipientName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    additionalInfo: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        fontStyle: 'italic',
    },
}); 