import React from 'react';
import { Text, TextProps, View, ViewProps } from 'react-native';

export const ThemedText: React.FC<TextProps> = (props) => {
    return <Text {...props} style={[{ color: '#000' }, props.style]} />;
};

export const ThemedView: React.FC<ViewProps> = (props) => {
    return <View {...props} style={[{ backgroundColor: '#fff' }, props.style]} />;
}; 