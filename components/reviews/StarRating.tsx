import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface StarRatingProps {
    rating: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    size = 16,
    interactive = false,
    onRatingChange
}) => {
    const handleStarPress = (selectedRating: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(selectedRating);
        }
    };

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => (
                <StarComponent
                    key={star}
                    onPress={interactive ? () => handleStarPress(star) : undefined}
                    style={styles.starContainer}
                >
                    <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={size}
                        color="#FFD700"
                    />
                </StarComponent>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starContainer: {
        padding: 2,
    },
}); 