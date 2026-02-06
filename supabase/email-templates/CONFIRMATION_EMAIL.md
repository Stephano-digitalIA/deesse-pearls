# Template Email de Confirmation d'Inscription - DEESSE PEARLS

## Configuration dans Supabase Dashboard

**Accès:** Authentication > Email Templates > Confirm signup

## Template HTML personnalisé

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre inscription - DEESSE PEARLS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d4a4a 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #f5f5dc; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">
        <span style="color: #d4af37;">DEESSE</span> PEARLS
      </h1>
      <p style="color: #f5f5dc; margin: 10px 0 0 0; font-size: 14px; font-weight: 300;">
        La Perle Noire de Tahiti
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #1a1a1a; font-size: 24px; margin-top: 0; text-align: center;">
        ✨ Bienvenue chez DEESSE PEARLS !
      </h2>

      <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Nous sommes ravis de vous compter parmi nous. Pour activer votre compte et profiter de tous nos services, veuillez confirmer votre adresse email.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display: inline-block; padding: 15px 40px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
          CONFIRMER MON EMAIL
        </a>
      </div>

      <!-- Security Info Box -->
      <div style="background-color: #f9f9f9; border-left: 4px solid: #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #1a1a1a; font-size: 16px; margin-top: 0; display: flex; align-items: center;">
          🔒 Sécurité et Confidentialité
        </h3>
        <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
          <li>Ce lien de confirmation est <strong>valide pendant 24 heures</strong></li>
          <li>Vos données personnelles sont <strong>protégées et sécurisées</strong></li>
          <li>Nous ne partagerons jamais vos informations avec des tiers</li>
          <li>Authentification conforme aux <strong>normes Supabase</strong></li>
        </ul>
      </div>

      <!-- Alternative Link -->
      <div style="background-color: #faf8f3; padding: 20px; border-radius: 4px; margin-top: 30px;">
        <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
          <strong>Le bouton ne fonctionne pas ?</strong> Copiez et collez ce lien dans votre navigateur :
        </p>
        <p style="color: #d4af37; font-size: 12px; word-break: break-all; margin: 0;">
          {{ .ConfirmationURL }}
        </p>
      </div>

      <!-- Help Section -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          <strong>Vous n'avez pas créé de compte ?</strong><br>
          Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email en toute sécurité.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1a1a1a; padding: 30px 20px; text-align: center;">
      <p style="color: #f5f5dc; margin: 0 0 10px 0; font-size: 14px;">
        Des questions ? Notre équipe est là pour vous aider
      </p>
      <p style="color: #d4af37; margin: 0 0 15px 0; font-size: 14px;">
        <a href="mailto:contact@deesse-pearls.com" style="color: #d4af37; text-decoration: none;">contact@deesse-pearls.com</a>
      </p>

      <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #333;">
        <p style="color: #999; margin: 0; font-size: 11px;">
          &copy; 2026 DEESSE PEARLS - La Perle Noire de Tahiti<br>
          Email de confirmation d'inscription envoyé via <a href="https://supabase.com" style="color: #d4af37; text-decoration: none;">Supabase</a>
        </p>
        <p style="color: #999; margin: 10px 0 0 0; font-size: 11px;">
          Authentification sécurisée • Protection des données • Conformité RGPD
        </p>
      </div>

      <p style="color: #d4af37; margin: 15px 0 0 0; font-size: 12px;">
        <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a>
      </p>
    </div>
  </div>
</body>
</html>
```

## Variables Supabase disponibles

- `{{ .ConfirmationURL }}` - Lien de confirmation unique et sécurisé
- `{{ .Token }}` - Token de confirmation (si besoin de construction manuelle)
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL du site configuré dans Supabase

## Instructions de configuration

### 1. Accéder aux Email Templates dans Supabase
1. Ouvrez le Dashboard Supabase
2. Sélectionnez votre projet `deesse-pearls`
3. Allez dans **Authentication** > **Email Templates**
4. Cliquez sur **Confirm signup**

### 2. Configuration du template
1. Copiez le template HTML ci-dessus
2. Collez-le dans l'éditeur de template
3. **Subject / Objet de l'email:**
   ```
   ✨ Confirmez votre inscription chez DEESSE PEARLS
   ```

### 3. Paramètres supplémentaires recommandés

#### Rate limiting (limites d'envoi)
- Configuration dans **Authentication** > **Rate limits**
- Limiter les demandes de confirmation: 3 par heure par IP
- Protéger contre les abus

#### Site URL
- Vérifier que le `Site URL` est correctement configuré dans **Settings** > **General**
- Production: `https://deessepearls.com`
- Development: `http://localhost:5173`

#### Email Provider (Resend)
- Provider: Resend
- From address: `noreply@deessepearls.com` ou `DEESSE PEARLS <noreply@deessepearls.com>`
- Vérifier que le domaine est configuré dans Resend

### 4. Test du template

1. Créer un compte de test
2. Vérifier la réception de l'email
3. Tester le lien de confirmation
4. Vérifier l'affichage sur desktop et mobile

## Bonnes pratiques

### Sécurité
- ✅ Lien de confirmation valide 24h uniquement
- ✅ Token unique et non réutilisable
- ✅ HTTPS obligatoire pour les redirections
- ✅ Mention claire des normes de sécurité (Supabase)

### Expérience utilisateur
- ✅ Design responsive (mobile-friendly)
- ✅ Bouton CTA visible et accessible
- ✅ Lien alternatif en cas de problème avec le bouton
- ✅ Instructions claires en français
- ✅ Identité visuelle DEESSE PEARLS respectée

### Conformité
- ✅ Mention de la protection des données
- ✅ Option d'ignorer l'email si non sollicité
- ✅ Contact clair pour le support
- ✅ Conformité RGPD

## Multilingue (optionnel)

Pour supporter plusieurs langues, vous pouvez:

1. Créer des templates séparés par langue dans Supabase
2. Utiliser un service de traduction dynamique
3. Détecter la langue du navigateur et adapter le template

**Note:** Actuellement, le template est en français (langue principale du site).

## Troubleshooting

### L'email n'arrive pas
- Vérifier les logs Supabase dans **Authentication** > **Logs**
- Vérifier la configuration du provider (Resend)
- Vérifier les spams/promotions
- Vérifier les rate limits

### Le lien ne fonctionne pas
- Vérifier que le `Site URL` est correct
- Vérifier que le lien n'a pas expiré (24h max)
- Vérifier les CORS dans Supabase

### Design cassé
- Tester l'email sur différents clients (Gmail, Outlook, Apple Mail)
- Utiliser des outils de test d'emails (Litmus, Email on Acid)
- Éviter les CSS complexes (certains clients ne les supportent pas)

---

**Dernière mise à jour:** 2026-02-05
**Version:** 1.0.0
