# Système d'inscription avec confirmation par email - DEESSE PEARLS

## Vue d'ensemble

Ce document décrit le nouveau système d'inscription qui **ne crée le compte Supabase qu'après confirmation de l'email** par l'utilisateur.

---

## Architecture du flow

### Ancien flow (AVANT)
```
1. Utilisateur remplit le formulaire → 2. Compte créé dans Supabase Auth
3. Email de confirmation envoyé → 4. Utilisateur clique sur le lien
5. Compte activé → 6. Admin notifié
```

**Problème :** Le compte existait avant la confirmation de l'email.

---

### Nouveau flow (MAINTENANT)
```
1. Utilisateur remplit le formulaire
2. Données stockées temporairement (pending_signups)
3. Email de confirmation envoyé
4. Utilisateur clique sur le lien de confirmation
5. Compte créé dans Supabase Auth + Admin notifié
6. Utilisateur peut se connecter
```

**Avantage :** Le compte n'est créé qu'après vérification de l'email.

---

## Composants du système

### 1. Base de données

**Table : `pending_signups`**
- Stockage temporaire des inscriptions en attente
- Les données expirent automatiquement après 24h
- Sécurisée avec RLS (service role uniquement)

**Migration :** `supabase/migrations/20260205_create_pending_signups.sql`

**Structure :**
```sql
CREATE TABLE pending_signups (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,        -- SHA-256 hash
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  confirmation_token TEXT UNIQUE NOT NULL,  -- Token unique
  token_expires_at TIMESTAMPTZ NOT NULL,    -- Expire après 24h
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0
);
```

---

### 2. Edge Functions

#### **initiate-signup**
**Fichier :** `supabase/functions/initiate-signup/index.ts`

**Rôle :** Initier le processus d'inscription

**Actions :**
1. Valide les données (email, password, firstName, lastName)
2. Vérifie que l'email n'existe pas déjà dans auth.users
3. Hash le mot de passe (SHA-256)
4. Génère un token de confirmation unique (32 bytes)
5. Stocke dans `pending_signups` avec expiration 24h
6. Envoie l'email de confirmation avec le lien

**Endpoint :** `POST /functions/v1/initiate-signup`

**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "firstName": "Marie",
  "lastName": "Dupont"
}
```

**Email envoyé :**
- Sujet : "✨ Confirmez votre inscription chez DEESSE PEARLS"
- Lien : `https://deessepearls.com/auth/confirm-signup?token={token}`
- Sender : `DEESSE PEARLS <onboarding@resend.dev>`
- Design : HTML avec branding DEESSE PEARLS

---

#### **confirm-signup**
**Fichier :** `supabase/functions/confirm-signup/index.ts`

**Rôle :** Confirmer l'inscription et créer le compte

**Actions :**
1. Vérifie le token de confirmation
2. Vérifie que le token n'a pas expiré (24h)
3. Crée l'utilisateur dans Supabase Auth avec `email_confirm: true`
4. Ajoute `first_name` et `last_name` dans user_metadata
5. Supprime l'entrée de `pending_signups`
6. Envoie une notification à l'admin

**Endpoint :** `POST /functions/v1/confirm-signup`

**Body :**
```json
{
  "token": "abc123..."
}
```

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

#### **notify-new-signup** (modifié)
**Fichier :** `supabase/functions/notify-new-signup/index.ts`

**Rôle :** Notifier l'admin d'une nouvelle inscription confirmée

**Appelé par :** `confirm-signup` (plus appelé depuis Auth.tsx)

**Email admin :**
- Sujet : "✅ Inscription confirmée: {firstName} {lastName}"
- Destinataire : `stahiti.sb@gmail.com` (ADMIN_EMAIL)
- Contenu : Nom, email, ID utilisateur, date de confirmation

---

### 3. Frontend

#### **Auth.tsx** (modifié)
**Fichier :** `src/pages/Auth.tsx`

**Changements :**
- Fonction `handleSignUp` utilise maintenant `initiate-signup` au lieu de `signUp`
- Suppression de l'appel direct à `notify-new-signup`
- Le dialogue de confirmation ne redirige plus vers `/account`
- L'utilisateur reste sur la page d'authentification

**Nouveau code :**
```typescript
const { data, error } = await supabase.functions.invoke('initiate-signup', {
  body: { email, password, firstName, lastName }
});

if (!error && !data?.error) {
  setShowConfirmationDialog(true);  // Affiche le popup
}
```

---

#### **ConfirmSignup.tsx** (nouveau)
**Fichier :** `src/pages/ConfirmSignup.tsx`

**Rôle :** Page de confirmation accessible via le lien dans l'email

**Route :** `/auth/confirm-signup?token={token}`

**États possibles :**
1. **Loading** : Vérification du token en cours
2. **Success** : Compte créé avec succès → redirection vers login après 3s
3. **Expired** : Token expiré → bouton "Créer un nouveau compte"
4. **Error** : Erreur → bouton "Réessayer" ou "Contacter le support"

**Fonctionnement :**
```typescript
useEffect(() => {
  const token = searchParams.get('token');

  // Appel à confirm-signup Edge Function
  const { data, error } = await supabase.functions.invoke('confirm-signup', {
    body: { token }
  });

  if (data?.success) {
    setStatus('success');
    setTimeout(() => navigate('/auth'), 3000);
  }
}, []);
```

---

#### **App.tsx** (modifié)
**Fichier :** `src/App.tsx`

**Changements :**
- Import de `ConfirmSignup`
- Ajout de la route `/auth/confirm-signup`

```typescript
import ConfirmSignup from "./pages/ConfirmSignup";

// ...
<Route path="/auth/confirm-signup" element={<ConfirmSignup />} />
```

---

## Variables d'environnement

### Supabase Dashboard
**Settings > Edge Functions > Environment Variables**

| Variable | Valeur | Description |
|----------|--------|-------------|
| `RESEND_API_KEY` | `re_xxxxx` | Clé API Resend |
| `ADMIN_EMAIL` | `stahiti.sb@gmail.com` | Email admin |

**Note :** `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont auto-configurés.

---

## Déploiement

### 1. Déployer la migration
```bash
supabase link --project-ref bxcgonhulcubycqsxppa
supabase db push
```

### 2. Déployer les Edge Functions
```bash
supabase functions deploy initiate-signup
supabase functions deploy confirm-signup
```

### 3. Configurer les variables d'environnement
Dans Supabase Dashboard :
1. Settings > Edge Functions
2. Ajouter `RESEND_API_KEY`
3. Ajouter `ADMIN_EMAIL`

### 4. Configurer Resend
1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter le domaine `deessepearls.com`
3. Configurer DNS (SPF, DKIM, DMARC)
4. Récupérer la clé API
5. Une fois vérifié, remplacer `onboarding@resend.dev` par `noreply@deessepearls.com`

---

## Sécurité

### Mesures en place
- ✅ Token de confirmation unique (32 bytes random)
- ✅ Expiration automatique après 24h
- ✅ Mot de passe hashé avant stockage (SHA-256)
- ✅ RLS activé sur `pending_signups`
- ✅ Validation email contre auth.users
- ✅ CORS configuré
- ✅ Logging détaillé

### Améliorations futures
- 🔄 Utiliser bcrypt au lieu de SHA-256
- 🔄 Rate limiting sur initiate-signup
- 🔄 Captcha pour prévenir spam
- 🔄 Blacklist email temporaire

---

## Tests

### Test du flow complet
1. Remplir le formulaire d'inscription sur `/auth`
2. Vérifier que le popup de confirmation s'affiche
3. Vérifier la réception de l'email (inbox + spam)
4. Cliquer sur le bouton "CONFIRMER MON INSCRIPTION"
5. Vérifier la redirection vers `/auth/confirm-signup?token=...`
6. Vérifier le message de succès
7. Vérifier la redirection automatique vers `/auth` après 3s
8. Se connecter avec les identifiants
9. Vérifier que l'admin a reçu l'email de notification

### Test des cas d'erreur
- Token expiré (après 24h)
- Token invalide
- Email déjà utilisé
- Champs manquants

---

## Monitoring

### Logs Edge Functions
```bash
# Logs en temps réel
supabase functions logs initiate-signup --tail
supabase functions logs confirm-signup --tail

# Filtrer les erreurs
supabase functions logs initiate-signup --tail | grep ERROR
```

### Dashboard Supabase
- **Edge Functions > Logs** : Historique des appels
- **Edge Functions > Metrics** : Statistiques d'utilisation
- **Database > Tables > pending_signups** : Entrées en attente

---

## Troubleshooting

### Les emails n'arrivent pas
1. ✓ Vérifier `RESEND_API_KEY` dans les variables d'environnement
2. ✓ Vérifier les logs : `supabase functions logs initiate-signup --tail`
3. ✓ Vérifier le domaine dans Resend (statut : vérifié)
4. ✓ Vérifier les spams/promotions

### Token invalide ou expiré
1. ✓ Les tokens expirent après 24h
2. ✓ Chaque nouvelle demande génère un nouveau token
3. ✓ L'utilisateur doit utiliser le dernier email reçu

### Erreur "Email already exists"
- ✓ L'email existe déjà dans `auth.users`
- ✓ Rediriger l'utilisateur vers la page de connexion

### Le compte n'est pas créé après confirmation
1. ✓ Vérifier les logs de `confirm-signup`
2. ✓ Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré
3. ✓ Vérifier les permissions RLS sur `auth.users`

---

## Fichiers modifiés/créés

### Nouveaux fichiers
- ✅ `supabase/migrations/20260205_create_pending_signups.sql`
- ✅ `supabase/functions/initiate-signup/index.ts`
- ✅ `supabase/functions/confirm-signup/index.ts`
- ✅ `supabase/functions/README.md`
- ✅ `src/pages/ConfirmSignup.tsx`
- ✅ `SIGNUP_FLOW.md` (ce document)

### Fichiers modifiés
- ✅ `src/pages/Auth.tsx`
- ✅ `src/App.tsx`

### Fichiers existants (non modifiés)
- ✅ `supabase/functions/notify-new-signup/index.ts`
- ✅ `src/contexts/LocaleContext.tsx` (traductions déjà ajoutées)

---

## Diagramme de séquence

```
Utilisateur                 Frontend              Edge Function         Supabase Auth        Admin
    |                          |                        |                      |              |
    |--[Remplit formulaire]--->|                        |                      |              |
    |                          |--[initiate-signup]---->|                      |              |
    |                          |                        |--[Vérifie email]---->|              |
    |                          |                        |<--[OK]---------------|              |
    |                          |                        |                      |              |
    |                          |                        |--[Stocke pending_signups]           |
    |                          |                        |--[Envoie email]--------------------->|
    |<--[Popup confirmation]---|<--[Success]------------|                      |              |
    |                          |                        |                      |              |
    |--[Reçoit email]---------------------------------------------------------------->|        |
    |--[Clique lien]---------->|                        |                      |              |
    |                          |--[confirm-signup]----->|                      |              |
    |                          |                        |--[Valide token]      |              |
    |                          |                        |--[Crée user]-------->|              |
    |                          |                        |                      |--[Compte créé]|
    |                          |                        |--[Nettoie pending]   |              |
    |                          |                        |--[Notifie admin]-------------------->|
    |<--[Page succès]----------|<--[Success]------------|                      |              |
    |                          |                        |                      |              |
    |--[Redirigé /auth]------->|                        |                      |              |
    |--[Se connecte]---------->|--[signIn]------------->|--[Auth]------------->|              |
    |<--[Compte actif]---------|<-----------------------|<--[Session]----------|              |
```

---

## Contact & Support

**Administrateur :** stahiti.sb@gmail.com

**Documentation :**
- Supabase Edge Functions: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- Resend API: [resend.com/docs](https://resend.com/docs)

---

**Date de création :** 2026-02-05
**Version :** 1.0.0
**Statut :** ✅ Implémenté, en attente de déploiement
