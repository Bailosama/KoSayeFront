import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import api from "./api/api";
import { PrivateRoute } from "./components/PrivateRoute";
import { useAuth } from "./contexts/AuthContext";

interface WishlistItem {
    id: number;
    product: {
        id: number;
        name: string;
        price: number;
        image: string;
        description: string;
    };
}

export default function WishlistScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlist = async () => {
        try {
            const response = await api.get('/user/wishlist');
            setWishlistItems(response.data.data);
        } catch (error) {
            console.error('Erreur lors de la récupération de la wishlist:', error);
            Alert.alert('Erreur', 'Impossible de charger votre liste de souhaits');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const removeFromWishlist = async (productId: number) => {
        try {
            await api.delete(`/user/wishlist/${productId}`);
            setWishlistItems(items => items.filter(item => item.product.id !== productId));
            Alert.alert('Succès', 'Produit retiré de votre liste de souhaits');
        } catch (error) {
            console.error('Erreur lors de la suppression du produit:', error);
            Alert.alert('Erreur', 'Impossible de retirer le produit de votre liste de souhaits');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWishlist();
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const renderItem = ({ item }: { item: WishlistItem }) => (
        <View style={styles.itemContainer}>
            <Image
                source={{ uri: item.product.image }}
                style={styles.productImage}
                resizeMode="cover"
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productPrice}>{item.product.price} €</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/produit/${item.product.id}`)}
                >
                    <Ionicons name="eye-outline" size={24} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => removeFromWishlist(item.product.id)}
                >
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <PrivateRoute>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ma liste de souhaits</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" style={styles.loader} />
                ) : wishlistItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>Votre liste de souhaits est vide</Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => router.push("/(tabs)/produits")}
                        >
                            <Text style={styles.browseButtonText}>Parcourir les produits</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={wishlistItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                    />
                )}
            </SafeAreaView>
        </PrivateRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    loader: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
    },
    itemContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 4,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: "center",
    },
    productName: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: "#F59E0B",
        fontWeight: "600",
    },
    actionButtons: {
        justifyContent: "space-around",
        paddingLeft: 12,
    },
    actionButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 12,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: "#F59E0B",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
}); 