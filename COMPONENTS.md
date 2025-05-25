# Guide des Composants KoSaye

## 1. Composants UI de Base

### 1.1 ThemedText
```typescript
// Utilisation :
<ThemedText variant="heading">Titre</ThemedText>
<ThemedText variant="body">Contenu</ThemedText>
```
- Gestion automatique des thèmes
- Support multilingue
- Variants prédéfinis

### 1.2 ThemedView
```typescript
// Utilisation :
<ThemedView style={styles.container}>
  {/* Contenu */}
</ThemedView>
```
- Conteneur avec thème
- Styles adaptatifs

### 1.3 Collapsible
```typescript
// Utilisation :
<Collapsible isOpen={true}>
  {/* Contenu pliable */}
</Collapsible>
```
- Animation fluide
- État contrôlable
- Support du mode sombre

## 2. Composants Fonctionnels

### 2.1 Formulaires
- Validation Yup
- Gestion des erreurs
- Auto-completion
- Persistance des données

### 2.2 Navigation
- Tabs personnalisés
- Retour haptique
- Animations de transition
- Protection des routes

### 2.3 Listes et Grilles
- Virtualisation
- Pull-to-refresh
- Infinite scroll
- Skeleton loading

## 3. Composants Métier

### 3.1 Produits
- Carte produit
- Détail produit
- Galerie images
- Prix dynamique

### 3.2 Panier
- Résumé panier
- Modification quantité
- Calcul total
- Validation commande

### 3.3 Profil
- Information utilisateur
- Préférences
- Historique
- Sécurité

## 4. Composants Utilitaires

### 4.1 Loading
- Spinners
- Skeleton screens
- Progress bars
- Placeholders

### 4.2 Feedback
- Toasts
- Modals
- Alerts
- Confirmations

### 4.3 Inputs
- Text fields
- Select
- DatePicker
- ImagePicker

## 5. Bonnes Pratiques

### 5.1 Structure
```typescript
// Template de composant
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView, ThemedText } from '../ui';

interface Props {
  // Props typées
}

export const Component: React.FC<Props> = ({ }) => {
  // Logic
  return (
    <ThemedView>
      {/* JSX */}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  // Styles
});
```

### 5.2 Performance
- Mémoisation
- Lazy loading
- Props optimisées
- Rendu conditionnel

### 5.3 Accessibilité
- Labels
- ARIA roles
- Navigation clavier
- Contraste

### 5.4 Tests
- Unit tests
- Integration tests
- Snapshot tests
- E2E tests 