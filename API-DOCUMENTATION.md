# Documentation des APIs KoSaye

## 1. APIs d'Authentification

### 1.1 Login
```
POST /api/auth/login
Body: {
    "email": string,
    "password": string
}
Response: {
    "token": string,
    "user": {
        "id": number,
        "name": string,
        "email": string,
        "role": string
    }
}
```

### 1.2 Inscription
```
POST /api/auth/register
Body: {
    "name": string,
    "email": string,
    "password": string,
    "phone": string
}
```

## 2. APIs des Produits

### 2.1 Liste des Produits
```
GET /api/products
Query: {
    page: number,
    limit: number,
    category?: string,
    search?: string,
    sort?: "price_asc" | "price_desc"
}
Response: {
    "items": Product[],
    "total": number,
    "page": number,
    "totalPages": number
}
```

### 2.2 Détail Produit
```
GET /api/products/:id
Response: {
    "id": number,
    "name": string,
    "description": string,
    "price": number,
    "images": string[],
    "category": string,
    "stock": number
}
```

## 3. APIs du Panier

### 3.1 Ajouter au Panier
```
POST /api/cart/items
Body: {
    "productId": number,
    "quantity": number
}
```

### 3.2 Voir le Panier
```
GET /api/cart
Response: {
    "items": CartItem[],
    "total": number,
    "itemCount": number
}
```

## 4. APIs de Commande

### 4.1 Créer une Commande
```
POST /api/orders
Body: {
    "items": {
        "productId": number,
        "quantity": number
    }[],
    "shippingAddress": {
        "street": string,
        "city": string,
        "postalCode": string
    },
    "paymentMethod": "card" | "cash"
}
```

### 4.2 Statut Commande
```
GET /api/orders/:id/status
Response: {
    "status": "pending" | "confirmed" | "shipped" | "delivered",
    "estimatedDelivery": string,
    "trackingNumber": string
}
```

## 5. Format des Erreurs

Toutes les APIs retournent les erreurs dans ce format :
```
{
    "error": {
        "code": string,
        "message": string,
        "details": any
    }
}
```

## 6. Codes d'Erreur Communs

- `AUTH_001`: Non authentifié
- `AUTH_002`: Token expiré
- `PROD_001`: Produit non trouvé
- `CART_001`: Stock insuffisant
- `ORDER_001`: Commande invalide

## 7. Headers Requis

```
Authorization: Bearer <token>
Content-Type: application/json
Accept-Language: fr-FR
```

## 8. Environnements

- Development: `http://localhost:3000/api`
- Staging: `https://staging-api.kosaye.com/api`
- Production: `https://api.kosaye.com/api` 