import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface ProfileImageUploadProps {
    currentImage?: string | null;
    onImageSelected: (imageFile: any) => void;
    onError?: (error: string) => void;
    size?: number;
    readOnly?: boolean;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
    currentImage,
    onImageSelected,
    onError,
    size = 120,
    readOnly = false
}) => {
    const [loading, setLoading] = useState(false);

    const requestPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    "Permission refusée",
                    "Nous avons besoin de la permission d'accéder à votre galerie pour changer la photo de profil."
                );
                return false;
            }
        }
        return true;
    };

    const handleImagePick = async () => {
        if (readOnly) return;
        
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

                // Créer un objet pour l'API
                const imageFile = {
                    uri: Platform.OS === 'ios' 
                        ? manipulatedImage.uri.replace('file://', '') 
                        : manipulatedImage.uri,
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
                style={[styles.imageContainer, { width: size, height: size }]}
                onPress={handleImagePick}
                disabled={loading || readOnly}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" />
                ) : currentImage ? (
                    <Image
                        source={{ uri: currentImage }}
                        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                    />
                ) : (
                    <View style={[styles.placeholderContainer, { width: size, height: size, borderRadius: size / 2 }]}>
                        <Ionicons name="person-circle-outline" size={size * 0.5} color="#666" />
                    </View>
                )}

                {!readOnly && (
                    <View style={styles.editBadge}>
                        <Ionicons name="camera" size={16} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 60,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 