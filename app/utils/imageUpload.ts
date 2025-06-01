import { AxiosError } from 'axios';
import { useState } from 'react';
import { Platform } from 'react-native';

interface ImageFile {
    uri: string;
    type?: string;
    name?: string;
    size?: number;
}

interface UserData {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    adress?: string;
    profilePicture?: string;  // URL de l'image
    [key: string]: string | undefined;
}

interface ApiResponse {
    status: number;
    message: string;
    data?: {
        user?: UserData;
        profilePicture?: string;
        [key: string]: any;
    };
}

type ValidExtension = 'jpg' | 'jpeg' | 'png' | 'gif';
type MimeTypes = { [K in ValidExtension]: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en octets

const [hidingOrder, setHidingOrder] = useState<number | null>(null);

const getImageFileInfo = (uri: string) => {
    // Récupérer l'extension depuis l'URI ou utiliser jpg par défaut
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';

    // Extensions autorisées par vine.file({ extnames: [...] })
    const validExtensions: ValidExtension[] = ['jpg', 'jpeg', 'png', 'gif'];
    const finalExtension = validExtensions.includes(extension as ValidExtension)
        ? extension as ValidExtension
        : 'jpg';

    // Types MIME correspondants
    const mimeTypes: MimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
    };

    return {
        extension: finalExtension,
        mimeType: mimeTypes[finalExtension],
    };
};

export const updateProfileWithImage = async (
    api: any,
    userData: UserData,
    imageFile?: ImageFile,
    token?: string
): Promise<ApiResponse> => {
    try {
        const formData = new FormData();

        // Ajouter les données du profil selon le schéma du validateur
        Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'profilePicture') {
                formData.append(key, String(value));
            }
        });

        // Traiter l'image si présente
        if (imageFile?.uri) {
            // Vérifier la taille du fichier si disponible
            if (imageFile.size && imageFile.size > MAX_FILE_SIZE) {
                return {
                    status: 400,
                    message: `La taille du fichier dépasse la limite de 5MB (${Math.round(imageFile.size / 1024 / 1024)}MB)`
                };
            }

            const { extension, mimeType } = getImageFileInfo(imageFile.uri);

            // Créer un objet fichier selon les règles de validation Vine
            const fileData = {
                uri: Platform.OS === 'ios' ? imageFile.uri.replace('file://', '') : imageFile.uri,
                type: mimeType,                    // Validé par vine.file()
                name: `profile-picture.${extension}` // Extension validée par vine.file({ extnames })
            };

            formData.append('profilePicture', fileData as any);

            // Log pour vérifier la conformité avec le validateur
            console.log('📤 Image préparée pour validation Vine:', {
                name: fileData.name,     // Doit avoir une extension autorisée
                type: fileData.type,     // Type MIME correspondant
                size: imageFile.size ? `${Math.round(imageFile.size / 1024 / 1024)}MB` : 'Inconnu',
                maxSize: '5MB'
            });
        }

        // Envoi à l'API avec le même schéma que le validateur
        const response = await api.put('/users/profile', formData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            transformRequest: () => formData,
        });

        // Log de la réponse du serveur pour vérifier l'URL de l'image
        console.log('📥 Réponse du serveur:', {
            user: response.data?.user,
            profilePicture: response.data?.user?.profilePicture || response.data?.profilePicture
        });

        return {
            status: 200,
            message: 'Profil mis à jour avec succès',
            data: {
                user: response.data?.user,
                profilePicture: response.data?.user?.profilePicture || response.data?.profilePicture
            }
        };
    } catch (error) {
        const axiosError = error as AxiosError<any>;
        console.error('❌ Erreur détaillée:', {
            response: axiosError.response?.data,
            status: axiosError.response?.status
        });

        if (axiosError.response) {
            return {
                status: axiosError.response.status,
                message: axiosError.response.data.message || 'Erreur lors de la mise à jour du profil',
                data: axiosError.response.data
            };
        }
        return {
            status: 500,
            message: 'Erreur inattendue lors de la mise à jour du profil'
        };
    }
};

const handleHideOrder = async (orderId: number) => {
    try {
        setHidingOrder(orderId);
        Alert.alert(
            "Masquer la commande",
            "Êtes-vous sûr de vouloir masquer cette commande de l'historique ?",
            [
                {
                    text: "Annuler",
                    style: "cancel"
                },
                {
                    text: "Masquer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            await api.patch(`/orders/${orderId}/hide`, null, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
                            Alert.alert("Succès", "La commande a été masquée de l'historique");
                        } catch (error) {
                            console.error("Erreur lors du masquage:", error);
                            Alert.alert("Erreur", "Impossible de masquer la commande. Veuillez réessayer.");
                        }
                    }
                }
            ]
        );
    } catch (error) {
        console.error("Erreur lors du masquage:", error);
        Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setHidingOrder(null);
    }
};
