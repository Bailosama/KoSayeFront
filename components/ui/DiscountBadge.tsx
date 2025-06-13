import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DiscountBadgeProps {
    originalPrice: number;
    discountedPrice: number;
    style?: any;
}

export const DiscountBadge = ({ originalPrice, discountedPrice, style }: DiscountBadgeProps) => {
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    if (discountPercentage <= 0) return null;

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
            <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>
                    {originalPrice.toLocaleString('fr-FR')} GNF
                </Text>
                <Text style={styles.discountedPrice}>
                    {discountedPrice.toLocaleString('fr-FR')} GNF
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFE4E4',
        borderRadius: 8,
        padding: 8,
        alignSelf: 'flex-start',
    },
    discountText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    priceContainer: {
        marginTop: 4,
    },
    originalPrice: {
        color: '#6B7280',
        textDecorationLine: 'line-through',
        fontSize: 12,
    },
    discountedPrice: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 14,
    },
}); 