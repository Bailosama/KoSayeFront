import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { formatDate } from '../../utils/date';
import { ThemedText, ThemedView } from '../ui';
import { StarRating } from './StarRating';

interface ReviewCardProps {
    review: {
        id: number;
        rating: number;
        comment: string;
        createdAt: string;
        user: {
            id: number;
            firstname: string;
            lastname: string;
            avatar?: string;
        };
        isVerified: boolean;
        reportCount: number;
    };
    onReport?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onReport }) => {
    const fullName = review.user.firstname && review.user.lastname
        ? `${review.user.firstname} ${review.user.lastname}`
        : 'Utilisateur anonyme';

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {review.user.avatar && (
                        <Image
                            source={{ uri: review.user.avatar }}
                            style={styles.avatar}
                        />
                    )}
                    <ThemedText style={styles.userName}>
                        {fullName}
                    </ThemedText>
                    {review.isVerified && (
                        <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4CAF50"
                            style={styles.verifiedIcon}
                        />
                    )}
                </View>
                <ThemedText style={styles.date}>
                    {formatDate(review.createdAt)}
                </ThemedText>
            </View>

            <StarRating rating={review.rating} size={16} />

            <ThemedText style={styles.comment}>
                {review.comment}
            </ThemedText>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={onReport}
                    style={styles.reportButton}
                >
                    <ThemedText style={styles.reportText}>
                        Signaler
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    userName: {
        fontWeight: 'bold',
    },
    verifiedIcon: {
        marginLeft: 5,
    },
    date: {
        fontSize: 12,
        color: '#666',
    },
    comment: {
        marginTop: 10,
        lineHeight: 20,
    },
    footer: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    reportButton: {
        padding: 8,
    },
    reportText: {
        fontSize: 12,
        color: '#666',
    },
}); 