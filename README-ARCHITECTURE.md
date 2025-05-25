# Architecture du Front-End KoSaye

## 1. Vue d'ensemble du projet
Cette application mobile est construite avec React Native + Expo, utilisant TypeScript pour un typage fort. L'architecture suit une approche modulaire et orientée composants.

## 2. Structure des dossiers
```
KoSayeFront/
├── app/                    # Pages et routes de l'application
├── components/            # Composants réutilisables
├── contexts/             # Gestion de l'état global
├── constants/            # Constants et configurations
├── assets/              # Ressources statiques
├── locales/             # Fichiers de traduction
└── hooks/               # Hooks personnalisés
```

## 3. Flux de données
```
[API Backend] ←→ [Axios Services] ←→ [Contexts] ←→ [Components/Pages] ←→ [UI]
```

## 4. Principaux modules fonctionnels

### 4.1 Authentication
- Connexion (`app/connexion.tsx`)
- Inscription (`app/inscription.tsx`)
- Récupération mot de passe (`app/mot_de_passe_oublie.tsx`)
- 2FA (`app/authentification-deux-facteurs.tsx`)

### 4.2 Gestion des Produits
- Liste des produits (`app/produits.tsx`)
- Détail produit (`app/detail_produit.tsx`)
- Filtrage (`app/filtre.tsx`)

### 4.3 Profil et Paramètres
- Gestion du profil (`app/detail-profil.tsx`)
- Paramètres (`app/parametre.tsx`)
- Notifications (`app/notifications.tsx`)

### 4.4 Paiement
- Processus de paiement (`app/paiement.tsx`)
- Confirmation (`app/commande-confirmee.tsx`)

## 5. Composants Réutilisables Clés
- `Collapsible` : Contenu pliable
- `ThemedText` et `ThemedView` : Composants thématiques
- `ParallaxScrollView` : Défilement avec effet
- `HapticTab` : Retour haptique

## 6. Technologies Principales
- **Framework** : React Native avec Expo
- **Language** : TypeScript
- **Navigation** : expo-router
- **État Global** : React Context
- **Requêtes API** : Axios
- **Internationalisation** : i18next
- **Stockage Local** : expo-secure-store
- **Validation** : Yup

## 7. Bonnes Pratiques Implémentées
- Séparation des responsabilités
- Composants réutilisables
- Gestion des thèmes
- Support multilingue
- Sécurité renforcée
- Optimisation des performances

## 8. Points d'Entrée Principaux
1. `app/_layout.tsx` : Configuration initiale
2. `app/index.tsx` : Page d'accueil
3. `contexts/` : Gestion de l'état global
4. `components/ui/` : Composants UI de base

## 9. Workflow de Développement
1. Modification des composants
2. Tests unitaires dans `__tests__`
3. Intégration dans les pages
4. Validation i18n
5. Tests de performance

## 10. Sécurité
- Authentification JWT
- Stockage sécurisé
- Protection des routes
- Validation des entrées
- 2FA

## 11. Performance
- Lazy loading
- Optimisation des images
- Mise en cache
- Gestion efficace des états

## 12. Maintenance
- Logs structurés
- Gestion des erreurs
- Documentation inline
- Tests automatisés 