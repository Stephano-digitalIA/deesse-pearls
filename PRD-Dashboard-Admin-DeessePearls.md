# PRD - Dashboard Administrateur Externe DeessePearls

## Document d'Exigences Produit (PRD)
**Version:** 2.0
**Date:** 30 janvier 2026
**Auteur:** Claude Code
**Projet:** Dashboard Admin Externe DeessePearls

---

## 1. Contexte et Objectifs

### 1.1 Contexte
DeessePearls est une boutique en ligne spécialisée dans les perles de Tahiti et bijoux associés. Le site actuel (deessepearls.com) utilise une architecture React/TypeScript avec Supabase comme backend.

L'objectif est de créer un **Dashboard Administrateur totalement indépendant** du site principal, se connectant directement à la base de données Supabase pour gérer les produits, avec intégration de traduction automatique via l'API OpenAI.

### 1.2 Objectifs Principaux
| Objectif | Description |
|----------|-------------|
| Indépendance totale | Aucune dépendance avec le site deessepearls.com |
| Connexion directe Supabase | Utilisation des mêmes tables/données via l'API Supabase |
| Gestion complète des produits | CRUD avec gestion d'images |
| Traduction automatique | Intégration OpenAI API (gpt-4o-mini) pour 8 langues |
| Interface moderne | UX/UI intuitive et responsive |

---

## 2. Architecture Technique

### 2.1 Stack Technologique
```
┌─────────────────────────────────────────────────────────┐
│                 DASHBOARD ADMIN EXTERNE                  │
├─────────────────────────────────────────────────────────┤
│  Frontend                                                │
│  ├── React 18+ / TypeScript                             │
│  ├── Vite (bundler)                                     │
│  ├── TailwindCSS + shadcn/ui                            │
│  ├── React Query (TanStack Query)                       │
│  └── React Router DOM                                   │
├─────────────────────────────────────────────────────────┤
│  Intégrations                                           │
│  ├── Supabase Client (@supabase/supabase-js)           │
│  ├── OpenAI API (gpt-4o-mini)                          │
│  └── Supabase Storage (images)                         │
└─────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
    ┌──────────────┐             ┌───────────────┐
    │   SUPABASE   │             │    OPENAI     │
    │  (Backend)   │             │     API       │
    │  - Auth      │             │  Traduction   │
    │  - Database  │             │  Multilingue  │
    │  - Storage   │             │ (gpt-4o-mini) │
    └──────────────┘             └───────────────┘
```

### 2.2 Variables d'Environnement Requises
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# OpenAI API (pour les traductions)
VITE_OPENAI_API_KEY=[openai-api-key]

# Configuration Admin
VITE_ADMIN_SECRET=[secret-url-key]
```

---

## 3. Structure de la Base de Données Supabase

### 3.1 Table `products`

> **IMPORTANT:** Les IDs sont des **integers** (auto-incrémentés), pas des UUIDs.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,                    -- INTEGER auto-incrémenté
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,            -- Valeurs en ANGLAIS uniquement
  name VARCHAR(255) NOT NULL,               -- Nom en français
  description TEXT NOT NULL,                -- Description en français
  price DECIMAL(10,2) NOT NULL,
  image TEXT,                               -- URL UNIQUE (pas un tableau)
  badge VARCHAR(50) CHECK (badge IN ('new', 'bestseller', NULL)),
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  variants JSONB,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
```

#### Catégories (valeurs en anglais OBLIGATOIRES)

| Valeur en DB | Affichage FR |
|--------------|--------------|
| `pearls` | Perles |
| `bracelets` | Bracelets |
| `necklaces` | Colliers |
| `rings` | Bagues |
| `earrings` | Boucles d'oreilles |
| `pendants` | Pendentifs |
| `sets` | Parures |
| `other` | Autres |

### 3.2 Table `product_translations` (TABLE SÉPARÉE)

> **IMPORTANT:** Les traductions sont stockées dans une **table séparée**, pas en JSONB.

```sql
CREATE TABLE product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,  -- FK integer
  lang VARCHAR(5) NOT NULL,                  -- 'en', 'de', 'es', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, lang)
);

-- Index pour performances
CREATE INDEX idx_translations_product_id ON product_translations(product_id);
CREATE INDEX idx_translations_lang ON product_translations(lang);
```

#### Structure des traductions

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `product_id` | `integer` | FK vers `products.id` |
| `lang` | `text` | Code langue (`en`, `de`, `es`, `pt`, `it`, `nl`, `ja`, `ko`) |
| `name` | `text` | Nom traduit |
| `description` | `text` | Description traduite |

### 3.3 Table `user_roles` (Gestion des Admins)

> **IMPORTANT:** L'authentification admin vérifie cette table, pas une liste hardcodée.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  "Email" TEXT,                              -- Email pour référence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

#### Gestion des administrateurs

**Ajouter un admin:**
```sql
INSERT INTO user_roles (user_id, role, "Email")
VALUES (
  'uuid-de-l-utilisateur-auth',  -- ID depuis auth.users
  'admin',
  'email@example.com'
);
```

**Retirer un admin:**
```sql
DELETE FROM user_roles WHERE "Email" = 'email@example.com';
```

> **Note:** L'utilisateur doit d'abord avoir un compte dans `auth.users` (via inscription ou OAuth).

### 3.4 Supabase Storage Bucket
```
Bucket: product-images
├── Structure des fichiers:
│   └── products/{product_id}/{filename}.{ext}
│
├── Policies:
│   ├── SELECT: Accès public (anon)
│   ├── INSERT: Utilisateurs authentifiés avec rôle admin
│   ├── UPDATE: Utilisateurs authentifiés avec rôle admin
│   └── DELETE: Utilisateurs authentifiés avec rôle admin
```

---

## 4. Conversion des Données

### 4.1 Champ `image` (string ↔ array)

Supabase stocke `image` comme une **chaîne de caractères** (URL unique), mais le dashboard utilise un **tableau** pour la compatibilité avec le frontend.

| Direction | Transformation |
|-----------|---------------|
| **Chargement (DB → App)** | `"https://..."` → `["https://..."]` |
| **Sauvegarde (App → DB)** | `["https://..."]` → `"https://..."` (première URL) |

```typescript
// Chargement
image: product.image
  ? (Array.isArray(product.image) ? product.image : [product.image])
  : []

// Sauvegarde
image: Array.isArray(image) ? (image[0] || null) : image
```

### 4.2 Traductions (table séparée ↔ objet)

| Direction | Transformation |
|-----------|---------------|
| **Chargement** | Rows de `product_translations` → `{ en: {...}, de: {...} }` |
| **Sauvegarde** | Objet → DELETE anciennes + INSERT nouvelles rows |

---

## 5. Fonctionnalités Détaillées

### 5.1 Authentification Admin

#### 5.1.1 Page de Connexion
- **Route:** `/admin/{secret-key}/connexion`
- **Méthodes d'authentification:**
  - Email/Mot de passe via Supabase Auth
  - OAuth Google
- **Validation du rôle admin:** Vérification dans la table `user_roles` avec `user_id`
- **Protection par URL secrète:** Accès uniquement avec la clé secrète valide

#### 5.1.2 Vérification Admin (depuis la DB)
```typescript
async function checkIsAdminFromDB(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  return !!data && !error;
}
```

### 5.2 Dashboard Principal

#### 5.2.1 Statistiques en Temps Réel
| Métrique | Source | Rafraîchissement |
|----------|--------|------------------|
| Nombre total de produits | `products.count()` | Auto (React Query) |
| Produits par catégorie | `products.group_by(category)` | Auto |
| Produits en rupture | `products.where(in_stock=false)` | Auto |
| Dernières modifications | `products.order(updated_at)` | Auto |

### 5.3 Gestion des Produits (CRUD Complet)

#### 5.3.1 Liste des Produits
- **Tableau avec colonnes:**
  - Image (thumbnail)
  - Nom + Slug
  - Catégorie
  - Prix (€)
  - Badge (Nouveau/Bestseller)
  - Stock (En stock/Rupture)
  - Traductions (indicateur visuel avec icône Globe)
  - Actions (Modifier/Supprimer)

- **Fonctionnalités:**
  - Recherche par nom/slug
  - Filtre par catégorie
  - Tri par colonnes

#### 5.3.2 Formulaire Création/Modification
```typescript
interface ProductFormData {
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendants' | 'sets' | 'other';
  name: string;
  description: string;
  price: number;
  image: string[];           // Tableau dans l'app, string en DB
  badge: 'new' | 'bestseller' | null;
  in_stock: boolean;
  rating: number;
  reviews: number;
  translations: {
    [langCode: string]: {
      name: string;
      description: string;
    };
  };
}
```

#### 5.3.3 Gestion des Images
- Formats acceptés: JPG, PNG, WebP
- Taille max: 5 MB par image
- Drag & drop supporté
- Ajout par URL externe possible

### 5.4 Traduction Automatique via OpenAI

#### 5.4.1 Langues Supportées
| Code | Langue | Drapeau |
|------|--------|---------|
| `fr` | Français (défaut) | 🇫🇷 |
| `en` | English | 🇬🇧 |
| `de` | Deutsch | 🇩🇪 |
| `es` | Español | 🇪🇸 |
| `pt` | Português | 🇵🇹 |
| `it` | Italiano | 🇮🇹 |
| `nl` | Nederlands | 🇳🇱 |
| `ja` | 日本語 | 🇯🇵 |
| `ko` | 한국어 | 🇰🇷 |

#### 5.4.2 Interface de Traduction
- **Panneau repliable** "Traductions multilingues"
- **Bouton principal** avec fond coloré (gradient) : "Traduire toutes les langues avec OpenAI"
- **Onglets** pour chaque langue avec indicateur de traduction existante
- **Bouton individuel** "Traduire" par langue

#### 5.4.3 Intégration OpenAI API
```typescript
// Service de traduction (services/gemini.ts - utilise OpenAI)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un traducteur professionnel spécialisé dans le luxe et la joaillerie...'
      },
      {
        role: 'user',
        content: `Traduis: Nom: ${name}, Description: ${description}`
      }
    ],
  }),
});
```

---

## 6. Structure du Projet

```
admin-dashboard-deessepearls/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui
│   │   └── admin/
│   │       ├── ProductForm.tsx    # Formulaire création/édition
│   │       ├── ProductTable.tsx   # Liste des produits
│   │       ├── ImageUploader.tsx  # Gestion des images
│   │       └── TranslationPanel.tsx # Panneau traductions OpenAI
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth + vérification admin via DB
│   ├── hooks/
│   │   ├── useProducts.ts         # CRUD + conversions image/translations
│   │   └── useImageUpload.ts      # Upload vers Supabase Storage
│   ├── services/
│   │   └── gemini.ts              # Service traduction OpenAI
│   ├── pages/
│   │   ├── AdminLogin.tsx
│   │   └── AdminDashboard.tsx
│   ├── lib/
│   │   ├── supabase.ts            # Client Supabase
│   │   └── utils.ts               # Utilitaires (formatPrice, generateSlug)
│   ├── types/
│   │   └── index.ts               # Types TypeScript
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── PRD-Dashboard-Admin-DeessePearls.md
```

---

## 7. Types TypeScript

```typescript
// types/index.ts

export interface Product {
  id: number;                    // INTEGER (pas UUID)
  slug: string;
  category: 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'earrings' | 'pendants' | 'sets' | 'other';
  name: string;
  description: string;
  price: number;
  image: string[];               // Tableau dans l'app (string en DB)
  badge?: 'new' | 'bestseller' | null;
  rating: number;
  reviews: number;
  variants?: ProductVariants | null;
  in_stock: boolean;
  translations?: {
    [langCode: string]: ProductTranslation;
  };
  created_at?: string;
}

export interface ProductTranslation {
  name: string;
  description: string;
}

export type LanguageCode = 'en' | 'de' | 'es' | 'pt' | 'it' | 'nl' | 'ja' | 'ko';
```

---

## 8. Sécurité

### 8.1 Authentification et Autorisation
| Niveau | Mécanisme | Description |
|--------|-----------|-------------|
| URL | Secret Key | Accès au dashboard via URL secrète |
| Auth | Supabase Auth | Authentification utilisateur |
| Role | Table `user_roles` | Vérification rôle admin via requête DB |
| API | RLS Policies | Row Level Security sur Supabase |

### 8.2 Policies Supabase (RLS)
```sql
-- Lecture produits: Tous les utilisateurs
CREATE POLICY "products_select" ON products
  FOR SELECT USING (true);

-- Modification produits: Admins uniquement
CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Traductions: Mêmes règles
CREATE POLICY "translations_admin_all" ON product_translations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
```

---

## 9. Troubleshooting

### 9.1 Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `null value in column 'image'` | Champ `images` au lieu de `image` | Utiliser `image` (singulier) |
| Images ne s'affichent pas | DB stocke string, code attend array | Conversion automatique dans useProducts |
| Catégorie non reconnue | Valeurs en français | Utiliser valeurs anglaises (`pearls`, `pendants`, etc.) |
| Admin ne peut pas se connecter | Pas dans `user_roles` | Ajouter entrée avec bon `user_id` et `role = 'admin'` |
| Traductions non sauvegardées | Table `product_translations` | Vérifier `product_id` (integer) et `lang` |

### 9.2 Vérification Admin
```sql
-- Vérifier si un utilisateur est admin
SELECT * FROM user_roles WHERE role = 'admin';

-- Trouver l'ID d'un utilisateur par email
SELECT id, email FROM auth.users WHERE email = 'example@email.com';
```

---

## 10. Dépendances Principales

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "@supabase/supabase-js": "^2.x",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "sonner": "^1.x",
    "react-dropzone": "^14.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

---

## 11. Historique des Versions

| Version | Date | Modifications |
|---------|------|--------------|
| 1.0 | 29/01/2026 | Version initiale |
| 2.0 | 30/01/2026 | - OpenAI au lieu de Gemini<br>- IDs integer (pas UUID)<br>- `image` string (pas array)<br>- Table `product_translations` séparée<br>- Catégories en anglais<br>- Auth admin via table `user_roles`<br>- Bouton traduction avec fond coloré |

---

*Ce PRD est un document vivant qui sera mis à jour au fur et à mesure de l'avancement du projet.*
