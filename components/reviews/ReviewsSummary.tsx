import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import api from '../../app/api/api';
import { ThemedText, ThemedView } from '../ui';
import { StarRating } from './StarRating';

interface ReviewsSummaryProps {
    productId: number;
}

interface SummaryData {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        [key: number]: number;
    };
}

export const ReviewsSummary: React.FC<ReviewsSummaryProps> = ({ productId }) => {
    const [summary, setSummary] = useState<SummaryData>({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        },
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const response = await api.get(`/reviews/products/${productId}/summary`);
                console.log('Réponse du résumé:', response.data);

                if (response.data?.status === 200 && response.data?.data) {
                    const backendData = response.data.data;

                    // Transformer la distribution des notes en objet
                    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                    if (Array.isArray(backendData.ratingDistribution)) {
                        backendData.ratingDistribution.forEach((item: { rating: number, count: string }) => {
                            if (item.rating >= 1 && item.rating <= 5) {
                                distribution[item.rating as 1 | 2 | 3 | 4 | 5] = parseInt(item.count, 10);
                            }
                        });
                    }

                    setSummary({
                        averageRating: parseFloat(backendData.averageRating) || 0,
                        totalReviews: parseInt(backendData.totalReviews, 10) || 0,
                        ratingDistribution: distribution
                    });
                } else {
                    console.error('Format de réponse invalide:', response.data);
                    setError('Format de réponse invalide');
                }
            } catch (error: any) {
                console.error('Erreur lors du chargement du résumé:', error);
                const errorMessage = error.response?.data?.message || 'Impossible de charger le résumé des avis';
                setError(errorMessage);
            }
        };

        if (productId) {
            loadSummary();
        }
    }, [productId]);

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
            </ThemedView>
        );
    }

    const renderRatingBar = (rating: number) => {
        const percentage = (summary.ratingDistribution[rating] / summary.totalReviews) * 100 || 0;

        return (
            <View style={styles.ratingBar} key={rating}>
                <ThemedText style={styles.ratingText}>{rating} étoiles</ThemedText>
                <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <ThemedText style={styles.ratingCount}>
                    {summary.ratingDistribution[rating]}
                </ThemedText>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.averageContainer}>
                    <ThemedText style={styles.averageRating}>
                        {summary.averageRating.toFixed(1)}
                    </ThemedText>
                    <StarRating rating={summary.averageRating} size={24} />
                    <ThemedText style={styles.totalReviews}>
                        {summary.totalReviews} avis
                    </ThemedText>
                </View>
            </View>

            <View style={styles.distribution}>
                {[5, 4, 3, 2, 1].map(renderRatingBar)}
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    averageContainer: {
        alignItems: 'center',
    },
    averageRating: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    totalReviews: {
        marginTop: 5,
        color: '#666',
    },
    distribution: {
        marginTop: 10,
    },
    ratingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 3,
    },
    ratingText: {
        width: 80,
        fontSize: 12,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginHorizontal: 10,
    },
    barFill: {
        height: '100%',
        backgroundColor: '#ffd700',
        borderRadius: 4,
    },
    ratingCount: {
        width: 40,
        fontSize: 12,
        textAlign: 'right',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 10,
    },
}); 