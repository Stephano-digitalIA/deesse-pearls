# Guide de déploiement - DEESSE PEARLS

## 📋 Prérequis

### 1. Installation de Supabase CLI

**Windows (avec npm) :**
```bash
npm install -g supabase
```

**Vérifier l'installation :**
```bash
supabase --version
```

### 2. Se connecter à Supabase
```bash
supabase login
```

Une fenêtre de navigateur s'ouvrira pour authentification.

### 3. Lier le projet local
```bash
supabase link --project-ref bxcgonhulcubycqsxppa
```

---

## 🚀 Déploiement complet

### Étape 1 : Déployer la migration (base de données)

```bash
supabase db push
```

**Ce qui sera créé :**
- Table `pending_signups` pour les inscriptions en attente
- Politiques RLS (Row Level Security)
- Fonction de nettoyage automatique des tokens expirés

### Étape 2 : Déployer les Edge Functions

**Nouvelles fonctions (inscription) :**
```bash
supabase functions deploy initiate-signup
supabase functions deploy confirm-signup
```

**Fonctions mises à jour (nouveau sender email) :**
```bash
supabase functions deploy send-contact-email
supabase functions deploy send-order-confirmation
supabase functions deploy notify-new-signup
```

**Ou déployer toutes les fonctions d'un coup :**
```bash
supabase functions deploy
```

### Étape 3 : Configurer les variables d'environnement

Dans le **Supabase Dashboard** (https://supabase.com/dashboard/project/bxcgonhulcubycqsxppa) :

1. Allez dans **Settings** > **Edge Functions**
2. Cliquez sur **Add new secret**
3. Ajoutez les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `RESEND_API_KEY` | `re_xxxxx` | Clé API Resend (si pas déjà configurée) |
| `ADMIN_EMAIL` | `stahiti.sb@gmail.com` | Email de l'administrateur |

**Note :** `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont auto-configurés.

### Étape 4 : Vérifier le domaine dans Resend

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Cliquez sur **Add Domain**
3. Entrez `deessepearls.com`
4. Configurez les DNS records :

**Records à ajouter chez votre hébergeur DNS :**

```
Type: TXT
Name: @
Value: resend._domainkey.deessepearls.com

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@deessepearls.com

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

5. Attendez la vérification (peut prendre jusqu'à 48h)

---

## ✅ Vérification du déploiement

### Tester les Edge Functions

**1. Tester initiate-signup :**
```bash
curl -X POST https://bxcgonhulcubycqsxppa.supabase.co/functions/v1/initiate-signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**2. Voir les logs :**
```bash
supabase functions logs initiate-signup --tail
```

**3. Dans le Dashboard Supabase :**
- **Edge Functions** > Sélectionner la fonction > **Logs**
- **Database** > **Table Editor** > `pending_signups` (voir les entrées)

---

## 📊 État actuel du déploiement

### ✅ Déjà déployé et fonctionnel
- `send-contact-email` (formulaire de contact)
- `send-order-confirmation` (confirmation de commande)

### ⏳ À déployer
- `initiate-signup` ⭐ Nouveau système d'inscription
- `confirm-signup` ⭐ Validation email
- Migrations de base de données

### 🔄 À redéployer (sender email mis à jour)
- `send-contact-email` (onboarding@resend.dev → noreply@deessepearls.com)
- `send-order-confirmation` (idem)
- `notify-new-signup` (idem)

---

## 🔧 Troubleshooting

### Error: "command not found: supabase"
**Solution :**
```bash
npm install -g supabase
# Ou
npx supabase --version
```

### Error: "Not logged in"
**Solution :**
```bash
supabase login
```

### Error: "Invalid project ref"
**Solution :** Vérifiez que le project ref est correct :
```bash
supabase link --project-ref bxcgonhulcubycqsxppa
```

### Emails ne partent pas après déploiement
**Checklist :**
1. ✓ Vérifier `RESEND_API_KEY` dans Dashboard > Settings > Edge Functions
2. ✓ Vérifier que le domaine est vérifié dans Resend
3. ✓ Voir les logs : `supabase functions logs initiate-signup --tail`
4. ✓ Tester avec l'adresse email du compte Resend

### Token de confirmation invalide
**Checklist :**
1. ✓ Vérifier que la table `pending_signups` existe
2. ✓ Vérifier que les tokens ne sont pas expirés (24h)
3. ✓ Voir les logs de `confirm-signup`

---

## 📝 Commandes utiles

### Voir toutes les fonctions déployées
```bash
supabase functions list
```

### Voir les logs d'une fonction
```bash
supabase functions logs <function-name> --tail
```

### Supprimer une fonction
```bash
supabase functions delete <function-name>
```

### Réinitialiser la base de données locale
```bash
supabase db reset
```

### Créer une nouvelle migration
```bash
supabase migration new <migration-name>
```

---

## 🎯 Déploiement en production - Checklist

- [ ] Installer Supabase CLI
- [ ] Se connecter à Supabase
- [ ] Lier le projet
- [ ] Déployer les migrations (`supabase db push`)
- [ ] Déployer les Edge Functions (`supabase functions deploy`)
- [ ] Configurer `RESEND_API_KEY` dans Dashboard
- [ ] Configurer `ADMIN_EMAIL` dans Dashboard
- [ ] Vérifier le domaine `deessepearls.com` dans Resend
- [ ] Configurer les DNS (SPF, DKIM, DMARC)
- [ ] Tester le flow d'inscription complet
- [ ] Vérifier les emails (inbox + spam)
- [ ] Vérifier les notifications admin

---

## 📞 Support

**Dashboard Supabase :**
https://supabase.com/dashboard/project/bxcgonhulcubycqsxppa

**Documentation :**
- Supabase CLI: https://supabase.com/docs/guides/cli
- Edge Functions: https://supabase.com/docs/guides/functions
- Resend: https://resend.com/docs

**Contact admin :**
stahiti.sb@gmail.com

---

**Date de création :** 2026-02-05
**Version :** 1.0.0
