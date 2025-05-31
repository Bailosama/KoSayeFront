import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../app/api/api';
import { ThemedText } from '../ui';
import { StarRating } from './StarRating';

interface AddReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (review: { rating: number; comment: string }) => Promise<void>;
    productId: number;
    isEdit?: boolean;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
    visible,
    onClose,
    onSubmit,
    productId,
    isEdit = false,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    useEffect(() => {
        if (visible && isEdit) {
            loadExistingReview();
        }
    }, [visible, isEdit]);

    const loadExistingReview = async () => {
        try {
            setInitialLoading(true);
            const response = await api.get(`/reviews/products/${productId}/user-review`);
            if (response.data?.data) {
                setRating(response.data.data.rating);
                setComment(response.data.data.comment);
            }
        } catch (error: any) {
            // Si l'erreur est 404, c'est normal - pas d'avis existant
            if (error.response?.status !== 404) {
                console.error('Erreur lors du chargement de l\'avis:', error);
                Alert.alert('Erreur', 'Impossible de charger votre avis existant');
            }
            // Réinitialiser les valeurs
            setRating(0);
            setComment('');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Erreur', 'Veuillez donner une note');
            return;
        }

        if (!comment.trim()) {
            Alert.alert('Erreur', 'Veuillez ajouter un commentaire');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({ rating, comment: comment.trim() });
            onClose();
            setRating(0);
            setComment('');
        } catch (error: any) {
            console.error('Erreur lors de l\'envoi de l\'avis:', error);
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement de votre avis'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <ThemedText style={styles.modalTitle}>
                        {isEdit ? 'Modifier votre avis' : 'Donner votre avis'}
                    </ThemedText>

                    {initialLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <>
                            <View style={styles.ratingContainer}>
                                <ThemedText style={styles.label}>Note :</ThemedText>
                                <StarRating
                                    rating={rating}
                                    size={30}
                                    onRatingChange={setRating}
                                    interactive={true}
                                />
                            </View>

                            <View style={styles.commentContainer}>
                                <ThemedText style={styles.label}>Commentaire :</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    multiline
                                    numberOfLines={4}
                                    value={comment}
                                    onChangeText={setComment}
                                    placeholder="Partagez votre expérience..."
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onClose}
                                >
                                    <ThemedText style={styles.buttonText}>Annuler</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.submitButton]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <ThemedText style={styles.buttonText}>
                                            {isEdit ? 'Modifier' : 'Envoyer'}
                                        </ThemedText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    ratingContainer: {
        marginBottom: 20,
    },
    commentContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#ccc',
    },
    submitButton: {
        backgroundColor: '#007AFF',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
}); 