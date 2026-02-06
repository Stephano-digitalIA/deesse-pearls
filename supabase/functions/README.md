# DEESSE PEARLS - Edge Functions

## Vue d'ensemble

Ce dossier contient les Edge Functions Supabase pour gérer l'inscription utilisateur avec confirmation par email.

### Architecture du processus d'inscription

**Nouveau flow (avec confirmation préalable) :**
1. L'utilisateur remplit le formulaire d'inscription
2. **`initiate-signup`** : Stocke temporairement les données et envoie l'email de confirmation
3. L'utilisateur reçoit un email avec un lien de confirmation
4. L'utilisateur clique sur le lien de confirmation
5. **`confirm-signup`** : Crée le compte Supabase Auth et envoie une notification à l'admin
6. L'utilisateur peut maintenant se connecter

## Edge Functions disponibles

### 1. `initiate-signup`
**Route :** `/functions/v1/initiate-signup`

**Objectif :** Initier le processus d'inscription en stockant temporairement les données et en envoyant l'email de confirmation.

**Paramètres d'entrée :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "firstName": "Marie",
  "lastName": "Dupont"
}
```

**Actions :**
- Valide les données d'entrée
- Vérifie que l'email n'existe pas déjà dans auth.users
- Hash le mot de passe (SHA-256)
- Génère un token de confirmation unique
- Stocke dans la table `pending_signups` (expire après 24h)
- Envoie l'email de confirmation avec le lien

**Réponse :**
```json
{
  "success": true,
  "message": "Confirmation email sent. Please check your inbox."
}
```

---

### 2. `confirm-signup`
**Route :** `/functions/v1/confirm-signup`

**Objectif :** Confirmer l'inscription en créant le compte Supabase Auth et notifier l'admin.

**Paramètres d'entrée :**
```json
{
  "token": "abc123..."
}
```

**Actions :**
- Valide le token de confirmation
- Vérifie que le token n'a pas expiré (24h)
- Crée l'utilisateur dans Supabase Auth avec `email_confirm: true`
- Supprime l'entrée dans `pending_signups`
- Envoie une notification à l'admin

**Réponse :**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

### 3. `notify-new-signup`
**Route :** `/functions/v1/notify-new-signup`

**Objectif :** Notifier l'administrateur d'une nouvelle inscription (appelé par `confirm-signup`).

**Paramètres d'entrée :**
```json
{
  "firstName": "Marie",
  "lastName": "Dupont",
  "email": "user@example.com",
  "userId": "uuid"
}
```

**Actions :**
- Envoie un email de notification à l'admin avec les détails du nouveau compte

---

### 4. `send-contact-email`
**Route :** `/functions/v1/send-contact-email`

**Objectif :** Envoyer les messages du formulaire de contact à l'admin.

**Paramètres d'entrée :**
```json
{
  "firstName": "Marie",
  "lastName": "Dupont",
  "email": "user@example.com",
  "phone": "+33612345678",
  "subject": "Question sur les perles",
  "message": "Je souhaite en savoir plus..."
}
```

---

## Variables d'environnement

Ces variables doivent être configurées dans le **Supabase Dashboard** :
**Project Settings > Edge Functions > Environment Variables**

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails | `re_xxxxx` |
| `ADMIN_EMAIL` | Email de l'administrateur | `stahiti.sb@gmail.com` |
| `SUPABASE_URL` | URL du projet Supabase | Auto-configuré par Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role | Auto-configuré par Supabase |

### Configuration dans Supabase Dashboard

1. Accédez à votre projet Supabase
2. Allez dans **Settings** > **Edge Functions**
3. Cliquez sur **Add new secret**
4. Ajoutez chaque variable :
   - `RESEND_API_KEY` : Votre clé API Resend
   - `ADMIN_EMAIL` : `stahiti.sb@gmail.com`

**Note :** Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

---

## Configuration Resend

### 1. Créer un compte Resend
1. Allez sur [resend.com](https://resend.com)
2. Créez un compte
3. Vérifiez votre email

### 2. Configurer le domaine
1. Dans le dashboard Resend, allez dans **Domains**
2. Ajoutez `deessepearls.com`
3. Configurez les DNS records (SPF, DKIM, DMARC)
4. Vérifiez le domaine

### 3. Obtenir la clé API
1. Allez dans **API Keys**
2. Créez une nouvelle clé API
3. Copiez la clé (commence par `re_`)
4. Ajoutez-la dans les variables d'environnement Supabase

### 4. Mettre à jour le sender email
Une fois le domaine vérifié, modifiez dans les Edge Functions :
```typescript
// Remplacer
from: 'DEESSE PEARLS <onboarding@resend.dev>'

// Par
from: 'DEESSE PEARLS <noreply@deessepearls.com>'
```

---

## Base de données

### Table `pending_signups`

**Migration :** `supabase/migrations/20260205_create_pending_signups.sql`

**Structure :**
```sql
CREATE TABLE pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  confirmation_token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0
);
```

**RLS (Row Level Security) :**
- Service role uniquement (pas d'accès public)

**Auto-cleanup :**
- Les entrées expirées sont automatiquement supprimées

---

## Déploiement

### Prérequis
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login
```

### Lier le projet
```bash
# Depuis la racine du projet
supabase link --project-ref bxcgonhulcubycqsxppa
```

### Déployer les migrations
```bash
# Déployer la table pending_signups
supabase db push
```

### Déployer les Edge Functions
```bash
# Déployer toutes les fonctions
supabase functions deploy initiate-signup
supabase functions deploy confirm-signup
supabase functions deploy notify-new-signup
supabase functions deploy send-contact-email

# Ou déployer tout d'un coup
supabase functions deploy
```

### Vérifier le déploiement
```bash
# Lister les fonctions déployées
supabase functions list

# Voir les logs d'une fonction
supabase functions logs initiate-signup --tail
```

---

## Tests

### Tester en local
```bash
# Démarrer Supabase localement
supabase start

# Servir les fonctions localement
supabase functions serve

# La fonction sera disponible sur :
# http://localhost:54321/functions/v1/initiate-signup
```

### Tester avec curl
```bash
# Tester initiate-signup
curl -X POST http://localhost:54321/functions/v1/initiate-signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Tester confirm-signup
curl -X POST http://localhost:54321/functions/v1/confirm-signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

---

## Sécurité

### Meilleures pratiques
- ✅ Les tokens de confirmation expirent après 24h
- ✅ Les mots de passe sont hashés avant stockage
- ✅ RLS activé sur `pending_signups`
- ✅ Validation des emails contre auth.users
- ✅ CORS configuré correctement
- ✅ Logs détaillés pour le debugging

### Amélioration future : bcrypt
Actuellement, les mots de passe sont hashés avec SHA-256. Pour une meilleure sécurité, envisagez d'utiliser bcrypt :

```typescript
import * as bcrypt from 'https://deno.land/x/bcrypt/mod.ts';

// Hash
const passwordHash = await bcrypt.hash(password);

// Vérification (non utilisée dans ce flow)
const isValid = await bcrypt.compare(password, passwordHash);
```

---

## Monitoring

### Voir les logs en production
```bash
# Logs en temps réel
supabase functions logs initiate-signup --tail

# Logs avec filtre
supabase functions logs confirm-signup --tail | grep ERROR
```

### Dans Supabase Dashboard
1. Allez dans **Edge Functions**
2. Cliquez sur une fonction
3. Onglet **Logs** pour voir l'historique
4. Onglet **Metrics** pour les statistiques

---

## Troubleshooting

### Les emails n'arrivent pas
1. Vérifiez `RESEND_API_KEY` dans les variables d'environnement
2. Vérifiez les logs : `supabase functions logs initiate-signup --tail`
3. Vérifiez le domaine dans Resend (doit être vérifié)
4. Vérifiez les spams/promotions

### Token invalide ou expiré
1. Les tokens expirent après 24h
2. Chaque nouvelle demande d'inscription génère un nouveau token
3. Vérifiez que l'utilisateur clique sur le dernier email reçu

### Erreur "Email already exists"
- L'email existe déjà dans `auth.users`
- L'utilisateur doit se connecter au lieu de s'inscrire

---

## Support

Pour toute question sur les Edge Functions :
- **Documentation Supabase :** [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **Resend Docs :** [resend.com/docs](https://resend.com/docs)
- **Admin :** stahiti.sb@gmail.com

---

**Dernière mise à jour :** 2026-02-05
**Version :** 1.0.0
