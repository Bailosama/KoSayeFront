import { FILE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DiscountBadge } from './DiscountBadge';

interface ProductCardProps {
    id: number;
    name: string;
    description: string;
    image: string;
    price: number;
    discountedPrice?: number;
    inStock: boolean;
}

export const ProductCard = ({
    id,
    name,
    description,
    image,
    price,
    discountedPrice,
    inStock
}: ProductCardProps) => {
    const router = useRouter();
    const imageUrl = image ?
        (image.startsWith('http') ? image : `${FILE_URL}/${image}`) :
        `https://picsum.photos/seed/${id}/200/300`;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push({
                pathname: "/detail_produit",
                params: { id }
            })}
        >
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />

            <View style={styles.contentContainer}>
                <Text style={styles.name} numberOfLines={2}>{name}</Text>
                <Text style={styles.description} numberOfLines={2}>{description}</Text>

                <View style={styles.bottomRow}>
                    {discountedPrice ? (
                        <DiscountBadge
                            originalPrice={price}
                            discountedPrice={discountedPrice}
                            style={styles.discountBadge}
                        />
                    ) : (
                        <Text style={styles.price}>{price.toLocaleString('fr-FR')} GNF</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.cartButton, !inStock && styles.cartButtonDisabled]}
                        onPress={() => router.push({
                            pathname: "/detail_produit",
                            params: { id }
                        })}
                    >
                        <Ionicons
                            name={inStock ? "cart-outline" : "close-circle-outline"}
                            size={24}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </View>

                {!inStock && (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Rupture de stock</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 colonnes avec marges

const styles = StyleSheet.create({
    container: {
        width: cardWidth,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: cardWidth,
        backgroundColor: '#F3F4F6',
    },
    contentContainer: {
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
    },
    discountBadge: {
        flex: 1,
    },
    cartButton: {
        backgroundColor: '#F59E0B',
        borderRadius: 8,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    cartButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    outOfStockBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    outOfStockText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
}); 