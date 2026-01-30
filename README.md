# Dashboard Admin DeessePearls

Dashboard d'administration externe pour gérer les produits DeessePearls, connecté directement à Supabase.

## Fonctionnalités

- **Authentification sécurisée** via URL secrète + Supabase Auth + vérification du rôle admin dans la base de données
- **CRUD complet des produits** avec gestion d'images
- **Upload d'images** vers Supabase Storage
- **Traduction automatique** vers 8 langues via OpenAI (gpt-4o-mini)
- **Design identique** au site DeessePearls

## Langues supportées

| Code | Langue | Drapeau |
|------|--------|---------|
| FR | Français (défaut) | 🇫🇷 |
| EN | English | 🇬🇧 |
| DE | Deutsch | 🇩🇪 |
| ES | Español | 🇪🇸 |
| PT | Português | 🇵🇹 |
| IT | Italiano | 🇮🇹 |
| NL | Nederlands | 🇳🇱 |
| JA | 日本語 | 🇯🇵 |
| KO | 한국어 | 🇰🇷 |

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

## Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement :
   - `VITE_SUPABASE_URL` - URL de votre projet Supabase
   - `VITE_SUPABASE_ANON_KEY` - Clé anonyme Supabase
   - `VITE_OPENAI_API_KEY` - Clé API OpenAI (pour les traductions automatiques)
   - `VITE_ADMIN_SECRET` - Clé secrète pour l'URL du dashboard

## Accès

Le dashboard est accessible via :
```
http://localhost:3000/admin/{VITE_ADMIN_SECRET}/connexion
```

Par défaut : `http://localhost:3000/admin/admin2025/connexion`

---

## Structure Supabase

### Table `products`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `integer` | Clé primaire (auto-incrémentée) |
| `slug` | `text` | URL-friendly identifier |
| `category` | `text` | **Valeur en anglais** (voir ci-dessous) |
| `name` | `text` | Nom du produit (français) |
| `description` | `text` | Description (français) |
| `price` | `numeric` | Prix en euros |
| `image` | `text` | **URL unique** (pas un tableau) |
| `badge` | `text` | `'new'`, `'bestseller'` ou `null` |
| `in_stock` | `boolean` | Disponibilité |
| `rating` | `numeric` | Note moyenne |
| `reviews` | `integer` | Nombre d'avis |
| `created_at` | `timestamptz` | Date de création |

#### Catégories (valeurs en anglais obligatoires)

| Valeur DB | Affichage |
|-----------|-----------|
| `pearls` | Perles |
| `bracelets` | Bracelets |
| `necklaces` | Colliers |
| `rings` | Bagues |
| `earrings` | Boucles d'oreilles |
| `pendants` | Pendentifs |
| `sets` | Parures |
| `other` | Autres |

### Table `product_translations`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `product_id` | `integer` | FK vers `products.id` |
| `lang` | `text` | Code langue (`en`, `de`, `es`, etc.) |
| `name` | `text` | Nom traduit |
| `description` | `text` | Description traduite |

### Table `user_roles` (Gestion des admins)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `user_id` | `uuid` | FK vers `auth.users.id` |
| `role` | `text` | Rôle (`admin`) |
| `Email` | `text` | Email de l'utilisateur |
| `created_at` | `timestamptz` | Date de création |

#### Ajouter un nouvel admin

Pour ajouter un administrateur, insérer une ligne dans `user_roles` :

```sql
INSERT INTO user_roles (user_id, role, "Email")
VALUES (
  'uuid-de-l-utilisateur-auth',  -- ID de auth.users
  'admin',
  'email@example.com'
);
```

> **Note** : L'utilisateur doit d'abord avoir un compte dans `auth.users` (via inscription ou OAuth).

#### Retirer un admin

```sql
DELETE FROM user_roles WHERE "Email" = 'email@example.com';
```

---

## Conversion Image (string ↔ array)

Supabase stocke `image` comme une **chaîne de caractères** (URL unique), mais le dashboard utilise un **tableau** pour la compatibilité avec le frontend.

- **Chargement** : `"https://..."` → `["https://..."]`
- **Sauvegarde** : `["https://..."]` → `"https://..."` (première image uniquement)

---

## Technologies

- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Supabase (Auth, Database, Storage)
- OpenAI API (gpt-4o-mini)
- React Query (TanStack Query)

## Structure du code

```
src/
├── components/
│   ├── ui/              # Composants shadcn/ui
│   └── admin/           # Composants admin
│       ├── ProductForm.tsx      # Formulaire création/édition
│       ├── ProductTable.tsx     # Liste des produits
│       ├── ImageUploader.tsx    # Upload d'images
│       └── TranslationPanel.tsx # Panneau de traductions
├── contexts/
│   └── AuthContext.tsx  # Authentification + vérification admin via DB
├── hooks/
│   ├── useProducts.ts   # CRUD produits + traductions
│   └── useImageUpload.ts # Upload vers Supabase Storage
├── lib/
│   ├── supabase.ts      # Client Supabase
│   └── utils.ts         # Fonctions utilitaires
├── pages/
│   ├── AdminLogin.tsx   # Page de connexion
│   └── AdminDashboard.tsx # Dashboard principal
├── services/
│   └── gemini.ts        # Service de traduction OpenAI
└── types/
    └── index.ts         # Types TypeScript
```

## Troubleshooting

### "null value in column 'image' violates not-null constraint"
Le champ `image` dans Supabase s'appelle `image` (singulier), pas `images`.

### Images qui ne s'affichent pas
Supabase stocke l'image comme string, pas comme array. Le code convertit automatiquement.

### Catégorie non reconnue
Les catégories doivent être en **anglais** dans la base de données (`pearls`, `bracelets`, etc.).

### Admin ne peut pas se connecter
Vérifier que l'utilisateur a une entrée dans la table `user_roles` avec `role = 'admin'` et le bon `user_id`.
