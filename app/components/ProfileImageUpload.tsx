import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ProfileImageUploadProps {
    currentImage?: string | null;
    onImageSelected: (imageFile: any) => void;
    onError?: (error: string) => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
    currentImage,
    onImageSelected,
    onError
}) => {
    const [loading, setLoading] = useState(false);

    const requestPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                onError?.('Permission d\'accès à la galerie refusée');
                return false;
            }
        }
        return true;
    };

    const handleImagePick = async () => {
        try {
            setLoading(true);

            const hasPermission = await requestPermission();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const selectedImage = result.assets[0];

                // Compresser et redimensionner l'image
                const manipulatedImage = await manipulateAsync(
                    selectedImage.uri,
                    [{ resize: { width: 500 } }],
                    { compress: 0.7, format: SaveFormat.JPEG }
                );

                // Créer un objet File pour l'API
                const imageFile = {
                    uri: manipulatedImage.uri,
                    type: 'image/jpeg',
                    name: 'profile-picture.jpg',
                };

                onImageSelected(imageFile);
            }
        } catch (error) {
            console.error('Erreur lors de la sélection de l\'image:', error);
            onError?.('Erreur lors de la sélection de l\'image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImagePick}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" />
                ) : currentImage ? (
                    <Image
                        source={{ uri: currentImage }}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Ionicons name="person-circle-outline" size={60} color="#666" />
                    </View>
                )}

                <View style={styles.editBadge}>
                    <Ionicons name="camera" size={16} color="#FFF" />
                </View>
            </TouchableOpacity>

            <Text style={styles.helpText}>
                Appuyez pour modifier votre photo de profil
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 60,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#F59E0B',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    helpText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
}); 