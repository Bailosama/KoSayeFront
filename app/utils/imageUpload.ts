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
                type: mimeType,
                name: `profile-picture.${extension}`
            };

            formData.append('profilePicture', fileData as any);
        }

        const response = await api.put('/user/profile', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
            },
        });

        // Vérifier si la réponse contient un message de succès
        if (response.data && response.data.message) {
            return {
                status: 200,
                message: response.data.message,
                data: response.data.data
            };
        }

        return {
            status: response.status,
            message: 'Profil mis à jour avec succès',
            data: response.data
        };

    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return {
            status: error.response?.status || 500,
            message: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil'
        };
    }
};

// Export par défaut pour satisfaire les exigences de la route
export default {
    updateProfileWithImage,
    getImageFileInfo
};
