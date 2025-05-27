import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../app/api/api';
import { ThemedView } from '../ui';
import { ReviewCard } from './ReviewCard';
import { ReviewsSummary } from './ReviewsSummary';

interface User {
    id: number;
    firstname: string;
    lastname: string;
    avatar?: string;
    email: string;
}

interface UserReview {
    id: number;
    user: User;
    isVerified: boolean;
    reportedCount: number;
}

interface Review {
    id: number;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    userReviews: UserReview[];
    productId: number;
    userId: number;
    user: User;
}

interface ReviewsListProps {
    productId: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ productId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCache, setUserCache] = useState<{ [key: number]: User }>({});

    const loadReviews = async (pageNumber: number = 1, shouldRefresh: boolean = false) => {
        try {
            setError(null);
            if (pageNumber === 1) {
                setLoading(true);
            }

            console.log('Chargement des avis pour le produit:', productId, 'page:', pageNumber);

            const response = await api.get(`/reviews/products/${productId}`, {
                params: {
                    page: pageNumber,
                    limit: 10
                }
            });

            console.log('Réponse API brute:', JSON.stringify(response.data, null, 2));

            // Vérification de la réponse API
            if (!response.data?.data) {
                console.error('Données manquantes dans la réponse');
                throw new Error('Format de réponse invalide');
            }

            // La réponse contient les reviews dans data.data
            const reviews = response.data.data.data || [];
            console.log('Reviews extraites:', reviews);

            // Vérification de la pagination
            const pagination = response.data.data.meta?.pagination;
            console.log('Pagination:', pagination);

            // Mise à jour des reviews
            if (shouldRefresh || pageNumber === 1) {
                setReviews(reviews);
            } else {
                setReviews(prevReviews => [...prevReviews, ...reviews]);
            }

            // Mise à jour de la pagination
            setHasMore(!!pagination?.hasMore);
            setPage(pageNumber);
        } catch (error: any) {
            console.error('Erreur détaillée:', error);
            if (error.response) {
                console.error('Données de réponse d\'erreur:', error.response.data);
            }
            setError(error.response?.data?.message || 'Impossible de charger les avis. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadUserData = async (userId: number) => {
        try {
            if (userCache[userId]) {
                return userCache[userId];
            }

            const response = await api.get(`/users/${userId}`);
            if (response.data?.data) {
                const userData = response.data.data;
                setUserCache(prev => ({
                    ...prev,
                    [userId]: userData
                }));
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
            return null;
        }
    };

    useEffect(() => {
        if (productId) {
            loadReviews(1, true);
        }
    }, [productId]);

    const handleLoadMore = () => {
        if (!loading && hasMore && productId) {
            loadReviews(page + 1);
        }
    };

    const handleRefresh = () => {
        if (productId) {
            setRefreshing(true);
            loadReviews(1, true);
        }
    };

    const handleReportReview = async (reviewId: number) => {
        try {
            const response = await api.post(`/reviews/${reviewId}/report`);
            if (response.data?.success) {
                alert('Avis signalé avec succès');
                // Rafraîchir la liste pour voir les changements
                handleRefresh();
            }
        } catch (error: any) {
            console.error('Erreur lors du signalement:', error);
            alert(error.response?.data?.message || 'Impossible de signaler cet avis');
        }
    };

    // Vérification du productId
    if (!productId) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>ID du produit invalide</Text>
            </View>
        );
    }

    if (loading && page === 1) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => loadReviews(1, true)}
                >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (reviews.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.noReviewsText}>
                    Aucun avis pour le moment. Soyez le premier à donner votre avis !
                </Text>
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ReviewsSummary productId={productId} />

            <FlatList
                data={reviews}
                renderItem={({ item }) => {
                    // Log détaillé pour déboguer
                    console.log('Structure de item:', {
                        id: item.id,
                        userId: item.userId,
                        user: item.user,
                        userReviews: item.userReviews
                    });

                    // Récupérer les données utilisateur
                    let userData = null;

                    // Utiliser les données de l'utilisateur préchargées
                    if (item.user && typeof item.user === 'object') {
                        userData = item.user;
                        console.log('Données utilisateur depuis la relation préchargée:', userData);
                    }
                    // Si pas de données utilisateur, créer un utilisateur anonyme
                    else {
                        userData = {
                            id: item.userId || 0,
                            firstname: 'Utilisateur',
                            lastname: 'Anonyme',
                            email: '',
                            avatar: undefined
                        };
                        console.log('Données utilisateur par défaut (anonyme):', userData);
                    }

                    console.log('Données utilisateur finales:', userData);

                    // S'assurer que toutes les valeurs numériques sont bien des nombres
                    const rating = typeof item.rating === 'string' ? parseFloat(item.rating) : item.rating;

                    // Vérifier si l'avis a été signalé ou vérifié
                    const userReview = Array.isArray(item.userReviews) && item.userReviews.length > 0
                        ? item.userReviews[0]
                        : null;

                    return (
                        <ReviewCard
                            review={{
                                id: item.id,
                                rating: rating || 0,
                                comment: item.comment || '',
                                createdAt: item.createdAt,
                                user: {
                                    id: userData.id || 0,
                                    firstname: userData.firstname || '',
                                    lastname: userData.lastname || '',
                                    avatar: userData.avatar
                                },
                                isVerified: Boolean(userReview?.isVerified),
                                reportCount: userReview?.reportedCount || 0
                            }}
                            onReport={() => handleReportReview(item.id)}
                        />
                    );
                }}
                keyExtractor={item => item.id.toString()}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListFooterComponent={() => (
                    loading && page > 1 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color="#0000ff" />
                        </View>
                    ) : null
                )}
            />
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    noReviewsText: {
        textAlign: 'center',
        color: '#666',
    },
    separator: {
        height: 10,
    },
    footerLoader: {
        paddingVertical: 20,
    },
}); 