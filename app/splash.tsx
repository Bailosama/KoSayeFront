// import { useRouter } from 'expo-router';
// import { useEffect } from 'react';
// import { ActivityIndicator, StyleSheet, View } from 'react-native';
// import { useAuth } from './contexts/AuthContext';
// import React from 'react';

// export default function SplashScreen() {
//   const router = useRouter();
//   const { checkAuth } = useAuth();

//   useEffect(() => {
//     const initializeApp = async () => {
//       try {
//         const isAuthenticated = await checkAuth();
//         if (isAuthenticated) {
//           router.replace('/(tabs)/accueil');
//         } else {
//           router.replace('/connexion');
//         }
//       } catch (error) {
//         console.error('Erreur lors de l\'initialisation:', error);
//         router.replace('/connexion');
//       }
//     };

//     initializeApp();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" color="#F59E0B" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
// }); 