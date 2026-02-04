# 📖 Guide d'Administration DeessePearls

## Table des matières

1. [Connexion à Supabase](#1-connexion-à-supabase)
2. [Gestion des Produits](#2-gestion-des-produits)
3. [Gestion des Traductions](#3-gestion-des-traductions)
4. [Gestion des Images](#4-gestion-des-images)
5. [Gestion des Commandes](#5-gestion-des-commandes)
6. [Gestion des Utilisateurs](#6-gestion-des-utilisateurs)
7. [Gestion des Avis Clients](#7-gestion-des-avis-clients)
8. [Requêtes SQL Utiles](#8-requêtes-sql-utiles)

---

## 1. Connexion à Supabase

### Accès au Dashboard

1. Rendez-vous sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Sign In"**
3. Connectez-vous avec vos identifiants
4. Sélectionnez le projet **"deesepearls-prod"**

### Navigation principale

- **Table Editor** : Gérer les données (produits, commandes, utilisateurs)
- **SQL Editor** : Exécuter des requêtes SQL
- **Storage** : Gérer les images des produits
- **Authentication** : Gérer les utilisateurs

---

## 2. Gestion des Produits

### 2.1 Voir tous les produits

1. Allez dans **Table Editor** → **products**
2. Vous verrez la liste de tous les produits

### 2.2 Ajouter un nouveau produit

1. Allez dans **Table Editor** → **products**
2. Cliquez sur **"Insert"** → **"Insert row"**
3. Remplissez les champs :

| Champ | Description | Exemple |
|-------|-------------|---------|
| `name` | Nom du produit (FR) | Perle de Tahiti Ronde AAA |
| `description` | Description (FR) | Magnifique perle de Tahiti... |
| `price` | Prix en EUR | 350.00 |
| `category` | Catégorie | Perles, Colliers, Bagues, Boucles d'oreilles, Bracelets |
| `image` | URL de l'image principale | (voir section Images) |
| `images` | Tableau d'URLs | ["url1", "url2"] |
| `stock` | Quantité en stock | 10 |
| `featured` | Produit en vedette | true / false |
| `is_new` | Nouveau produit | true / false |
| `quality` | Qualité | AAA, AA, A |
| `size` | Taille | 10mm, 12mm |
| `color` | Couleur | Noir, Gris, Vert |
| `slug` | URL du produit | perle-tahiti-ronde-aaa |

4. Cliquez sur **"Save"**

### 2.3 Modifier un produit

1. Allez dans **Table Editor** → **products**
2. Cliquez sur la ligne du produit à modifier
3. Modifiez les champs souhaités
4. Cliquez sur **"Save"**

### 2.4 Supprimer un produit

1. Allez dans **Table Editor** → **products**
2. Cochez la case à gauche du produit
3. Cliquez sur **"Delete"** → **"Delete 1 row"**

⚠️ **Attention** : Supprimez d'abord les traductions associées dans `product_translations`

---

## 3. Gestion des Traductions

### 3.1 Structure de la table `product_translations`

| Champ | Description |
|-------|-------------|
| `product_id` | ID du produit (référence vers products) |
| `lang` | Code langue : fr, en, es, it, de, ja, ko, pt, nl |
| `name` | Nom traduit |
| `description` | Description traduite |
| `category` | Catégorie traduite |
| `slug` | URL traduite |

### 3.2 Ajouter une traduction

1. Allez dans **Table Editor** → **product_translations**
2. Cliquez sur **"Insert"** → **"Insert row"**
3. Remplissez :
   - `product_id` : ID du produit (ex: 7)
   - `lang` : Code langue (ex: en)
   - `name` : Nom en anglais
   - `description` : Description en anglais
   - `category` : Catégorie en anglais
4. Cliquez sur **"Save"**

### 3.3 Codes de langue disponibles

| Code | Langue |
|------|--------|
| `fr` | Français |
| `en` | Anglais |
| `es` | Espagnol |
| `it` | Italien |
| `de` | Allemand |
| `ja` | Japonais |
| `ko` | Coréen |
| `pt` | Portugais |
| `nl` | Néerlandais |

### 3.4 Exemple : Ajouter un produit multilingue

**Étape 1** : Créer le produit dans `products` (en français)

```
name: "Bague Perle Noire"
description: "Élégante bague en or avec perle de Tahiti"
price: 890.00
category: "Bagues"
```

**Étape 2** : Ajouter les traductions dans `product_translations`

Pour l'anglais :
```
product_id: 15
lang: "en"
name: "Black Pearl Ring"
description: "Elegant gold ring with Tahitian pearl"
category: "Rings"
```

Pour l'espagnol :
```
product_id: 15
lang: "es"
name: "Anillo de Perla Negra"
description: "Elegante anillo de oro con perla de Tahití"
category: "Anillos"
```

---

## 4. Gestion des Images

### 4.1 Accéder au Storage

1. Dans Supabase, cliquez sur **Storage** (icône de dossier)
2. Sélectionnez le bucket **"product-images"**

### 4.2 Uploader une image

1. Cliquez sur **"Upload files"**
2. Sélectionnez vos images (formats recommandés : JPG, PNG, WebP)
3. Nommez vos fichiers de manière descriptive : `pearl-tahiti-round-1.jpg`

### 4.3 Obtenir l'URL de l'image

1. Cliquez sur l'image uploadée
2. Cliquez sur **"Get URL"**
3. Copiez l'URL publique

L'URL sera au format :
```
https://bxcgonhulcubycqsxppa.supabase.co/storage/v1/object/public/product-images/nom-image.jpg
```

### 4.4 Bonnes pratiques pour les images

- **Taille recommandée** : 800x800 pixels minimum
- **Format** : JPG pour les photos, PNG pour les images avec transparence
- **Poids** : Maximum 500 Ko par image
- **Nommage** : Utilisez des noms descriptifs sans espaces ni caractères spéciaux
  - ✅ `pearl-tahiti-round-aaa.jpg`
  - ❌ `IMG_20240115_photo perle (1).jpg`

---

## 5. Gestion des Commandes

### 5.1 Configuration des notifications de commande

Le système envoie automatiquement des emails lorsqu'une commande est passée :
- **Email au client** : Confirmation de commande avec récapitulatif
- **Email au vendeur** : Notification avec détails de la commande

**Note importante** : Les notifications utilisent le même système que les avis (Resend API). Assurez-vous que les variables d'environnement `RESEND_API_KEY` et `ADMIN_EMAIL` sont configurées (voir section 7.5).

### 5.2 Voir les commandes

1. Allez dans **Table Editor** → **orders**
2. Triez par `created_at` décroissant pour voir les plus récentes

### 5.3 Colonnes importantes

| Colonne | Description |
|---------|-------------|
| `order_number` | Numéro de commande (ex: DP-202601-ABCD) |
| `customer_name` | Nom du client |
| `customer_email` | Email du client |
| `status` | Statut : pending, paid, shipped, delivered, cancelled |
| `total` | Montant total |
| `shipping_address` | Adresse de livraison (JSON) |
| `paypal_order_id` | ID de transaction PayPal |
| `created_at` | Date de commande |

### 5.4 Modifier le statut d'une commande

1. Cliquez sur la commande
2. Modifiez le champ `status` :
   - `pending` : En attente de paiement
   - `paid` : Payée
   - `processing` : En préparation
   - `shipped` : Expédiée
   - `delivered` : Livrée
   - `cancelled` : Annulée
3. Cliquez sur **"Save"**

### 5.5 Voir les articles d'une commande

1. Allez dans **Table Editor** → **order_items**
2. Filtrez par `order_id` pour voir les articles d'une commande spécifique

---

## 6. Gestion des Utilisateurs

### 6.1 Voir les utilisateurs enregistrés

**Méthode 1** : Via Authentication
1. Allez dans **Authentication** → **Users**
2. Vous verrez tous les utilisateurs avec leur email et date d'inscription

**Méthode 2** : Via les profils
1. Allez dans **Table Editor** → **profiles**
2. Vous verrez les informations détaillées (nom, adresse, téléphone)

### 6.2 Informations utilisateur

| Table | Contenu |
|-------|---------|
| `auth.users` | Email, mot de passe (hashé), date inscription |
| `profiles` | Nom, prénom, adresse, téléphone |

### 6.3 Supprimer un utilisateur

⚠️ **Attention** : Cela supprimera toutes les données associées (commandes, favoris, panier)

1. Allez dans **Authentication** → **Users**
2. Cliquez sur les 3 points à droite de l'utilisateur
3. Cliquez sur **"Delete user"**

---

## 7. Gestion des Avis Clients

### 7.1 Voir les avis

1. Allez dans **Table Editor** → **reviews**

### 7.2 Structure des avis

| Colonne | Description |
|---------|-------------|
| `product_id` | ID du produit |
| `user_id` | ID de l'utilisateur |
| `rating` | Note (1 à 5) |
| `comment` | Commentaire |
| `approved` | Approuvé (true/false) |
| `created_at` | Date de création |

### 7.3 Modérer un avis

1. Trouvez l'avis dans la table `reviews`
2. Modifiez le champ `approved` :
   - `true` : L'avis sera visible sur le site
   - `false` : L'avis sera masqué
3. Cliquez sur **"Save"**

### 7.4 Supprimer un avis inapproprié

1. Cochez l'avis à supprimer
2. Cliquez sur **"Delete"**

### 7.5 Configuration des notifications d'avis

Le système envoie automatiquement des emails lorsqu'un client laisse un avis :
- **Email au vendeur** : Notification avec les détails de l'avis
- **Email au client** : Confirmation de réception de l'avis

#### Variables d'environnement requises

Pour configurer les notifications d'avis, ajoutez ces variables dans **Settings → Edge Functions → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `ADMIN_EMAIL` | contact@tahititechdigital.com |
| `RESEND_API_KEY` | Votre clé API Resend (obtenir sur [resend.com](https://resend.com)) |

#### Étapes de configuration

1. Créez un compte sur [Resend](https://resend.com)
2. Générez une clé API dans le dashboard Resend
3. Dans Supabase, allez dans **Settings** → **Edge Functions**
4. Cliquez sur **"Add secret"**
5. Ajoutez `RESEND_API_KEY` avec votre clé
6. Ajoutez `ADMIN_EMAIL` avec `contact@tahititechdigital.com`
7. Cliquez sur **"Save"**

Les notifications seront envoyées automatiquement dès qu'un avis est soumis.

---

## 8. Requêtes SQL Utiles

### 8.1 Accéder au SQL Editor

1. Cliquez sur **SQL Editor** dans le menu de gauche
2. Cliquez sur **"New query"**
3. Collez votre requête et cliquez sur **"Run"**

### 8.2 Requêtes courantes

#### Voir les produits les plus vendus
```sql
SELECT 
  p.name,
  COUNT(oi.product_id) as total_ventes,
  SUM(oi.quantity) as quantite_totale
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY total_ventes DESC
LIMIT 10;
```

#### Voir le chiffre d'affaires par mois
```sql
SELECT 
  DATE_TRUNC('month', created_at) as mois,
  SUM(total) as chiffre_affaires,
  COUNT(*) as nombre_commandes
FROM orders
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mois DESC;
```

#### Voir les clients les plus actifs
```sql
SELECT 
  customer_name,
  customer_email,
  COUNT(*) as nombre_commandes,
  SUM(total) as total_depense
FROM orders
WHERE status = 'paid'
GROUP BY customer_name, customer_email
ORDER BY total_depense DESC
LIMIT 10;
```

#### Vérifier le stock bas (moins de 5)
```sql
SELECT name, stock, price
FROM products
WHERE stock < 5
ORDER BY stock ASC;
```

#### Voir les avis en attente de modération
```sql
SELECT 
  r.*,
  p.name as product_name
FROM reviews r
JOIN products p ON p.id = r.product_id
WHERE r.approved = false
ORDER BY r.created_at DESC;
```

#### Voir les paniers abandonnés
```sql
SELECT 
  ci.user_id,
  p.email,
  p.first_name,
  p.last_name,
  COUNT(ci.id) as nb_articles,
  SUM(ci.product_price * ci.quantity) as valeur_panier
FROM cart_items ci
JOIN profiles p ON p.user_id = ci.user_id
GROUP BY ci.user_id, p.email, p.first_name, p.last_name
ORDER BY valeur_panier DESC;
```

#### Ajouter un produit rapidement via SQL
```sql
INSERT INTO products (name, description, price, category, image, stock, featured, is_new, slug)
VALUES (
  'Nouveau Collier Perle',
  'Description du produit...',
  450.00,
  'Colliers',
  'https://bxcgonhulcubycqsxppa.supabase.co/storage/v1/object/public/product-images/nouveau-collier.jpg',
  15,
  true,
  true,
  'nouveau-collier-perle'
);
```

#### Ajouter des traductions rapidement
```sql
-- Récupérer l'ID du dernier produit ajouté
-- puis ajouter les traductions

INSERT INTO product_translations (product_id, lang, name, description, category, slug)
VALUES 
  (16, 'en', 'New Pearl Necklace', 'Product description...', 'Necklaces', 'new-pearl-necklace'),
  (16, 'es', 'Nuevo Collar de Perlas', 'Descripción del producto...', 'Collares', 'nuevo-collar-perlas');
```

---

## 📋 Checklist Ajout de Produit

Lors de l'ajout d'un nouveau produit, suivez cette checklist :

- [ ] Uploader les images dans Storage → product-images
- [ ] Créer le produit dans la table `products`
- [ ] Ajouter les traductions pour chaque langue dans `product_translations`
- [ ] Vérifier l'affichage sur le site dans toutes les langues
- [ ] Tester l'ajout au panier
- [ ] Vérifier que le prix s'affiche correctement

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne partagez jamais** vos clés API ou mots de passe
2. **Utilisez des mots de passe forts** pour votre compte Supabase
3. **Activez l'authentification à deux facteurs** (2FA) sur votre compte
4. **Vérifiez régulièrement** les logs d'accès dans Supabase

### Sauvegardes

Supabase effectue des sauvegardes automatiques quotidiennes. Pour une sauvegarde manuelle :

1. Allez dans **Settings** → **Database**
2. Cliquez sur **"Download backup"**

---

## 📞 Support

En cas de problème technique :
- **Documentation Supabase** : [https://supabase.com/docs](https://supabase.com/docs)
- **Développeur** : TAHITITECHDIGITAL - stahiti.sb@gmail.com

---

*Guide créé le 29 janvier 2026 - DeessePearls v1.0*
