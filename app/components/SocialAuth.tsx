import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authApi } from '../api/auth';

export default function SocialAuth() {
  const router = useRouter();

  const handleGoogleAuth = async () => {
    try {
      authApi.redirectToGoogle();
    } catch (error) {
      console.error('Erreur lors de la redirection vers Google:', error);
    }
  };

  const handleFacebookAuth = async () => {
    try {
      authApi.redirectToFacebook();
    } catch (error) {
      console.error('Erreur lors de la redirection vers Facebook:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ou connectez-vous avec</Text>
      
      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleAuth}
        >
          <FontAwesome name="google" size={24} color="#fff" />
          <Text style={styles.buttonText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={handleFacebookAuth}
        >
          <FontAwesome name="facebook" size={24} color="#fff" />
          <Text style={styles.buttonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 140,
    justifyContent: 'center',
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 