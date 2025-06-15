import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function EcranAccueil() {
  const handleConnexion = () => {
    router.replace("/connexion");
  };

  const handleInscription = () => {
    router.push("/inscription");
  };

  return (
    <SafeAreaView style={styles.conteneur}>
      <StatusBar barStyle="dark-content" backgroundColor="#F59E0B" />
      <View style={styles.zoneIllustration}>
        <View style={styles.imagePlaceholder}>
          <Image
            source={require('../assets/images/image2.png')}

            resizeMode="contain"
          />
        </View>
      </View>
      <View style={styles.zoneTexte}>
        <Text style={styles.titre}>Bienvenue sur KOSAYE</Text>
        <Text style={styles.sousTitre}>
          Achetez, vendez et profitez d'offres exclusives en toute sécurité.
        </Text>
      </View>
      <View style={styles.zoneBoutons}>
        <TouchableOpacity style={styles.boutonBlanc} onPress={handleConnexion}>
          <Text style={styles.texteBoutonNoir}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.boutonOrange}
          onPress={handleInscription}
        >
          <Text style={styles.texteBoutonBlanc}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: "#F59E0B",
    alignItems: "center",
  },
  zoneIllustration: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  zoneTexte: {
    flex: 0.2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    width: "100%",
  },
  titre: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15,
  },
  sousTitre: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  zoneBoutons: {
    flex: 0.35,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  boutonBlanc: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  texteBoutonNoir: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  boutonOrange: {
    backgroundColor: "#F59E0B",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },
  texteBoutonBlanc: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
