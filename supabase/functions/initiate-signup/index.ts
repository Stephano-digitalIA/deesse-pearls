import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[initiate-signup] Function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName } = await req.json();

    console.log('[initiate-signup] Initiating signup for:', email);

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if email already exists in auth.users
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser?.users?.some(u => u.email === email);

    if (emailExists) {
      return new Response(
        JSON.stringify({
          error: 'Email already registered',
          alreadyExists: true
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password using bcrypt (Deno doesn't have built-in bcrypt, use a simple hash for now)
    // In production, you should use proper bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate unique confirmation token
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const confirmationToken = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('');

    // Token expires in 24 hours
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Check if pending signup already exists
    const { data: existingPending } = await supabase
      .from('pending_signups')
      .select('id')
      .eq('email', email)
      .single();

    if (existingPending) {
      // Update existing pending signup
      await supabase
        .from('pending_signups')
        .update({
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          confirmation_token: confirmationToken,
          token_expires_at: tokenExpiresAt,
          attempts: 0
        })
        .eq('email', email);
    } else {
      // Insert new pending signup
      const { error: insertError } = await supabase
        .from('pending_signups')
        .insert({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          confirmation_token: confirmationToken,
          token_expires_at: tokenExpiresAt
        });

      if (insertError) {
        console.error('[initiate-signup] Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[initiate-signup] Pending signup created, sending confirmation email');

    // Send confirmation email
    if (!RESEND_API_KEY) {
      console.error('[initiate-signup] Missing RESEND_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Build confirmation URL
    const confirmationUrl = `${req.headers.get('origin') || 'https://deessepearls.com'}/auth/confirm-signup?token=${confirmationToken}`;

    const emailHtml = `
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
              Bonjour ${firstName},
            </p>

            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Nous sommes ravis que vous souhaitiez rejoindre notre communauté. Pour finaliser votre inscription et créer votre compte, veuillez confirmer votre adresse email.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${confirmationUrl}"
                 style="display: inline-block; padding: 15px 40px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                CONFIRMER MON INSCRIPTION
              </a>
            </div>

            <!-- Security Info Box -->
            <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <h3 style="color: #1a1a1a; font-size: 16px; margin-top: 0;">
                🔒 Sécurité et Confidentialité
              </h3>
              <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                <li>Ce lien de confirmation est <strong>valide pendant 24 heures</strong></li>
                <li>Votre compte sera créé <strong>uniquement après confirmation</strong></li>
                <li>Vos données personnelles sont <strong>protégées et sécurisées</strong></li>
                <li>Nous ne partagerons jamais vos informations avec des tiers</li>
              </ul>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #faf8f3; padding: 20px; border-radius: 4px; margin-top: 30px;">
              <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;">
                <strong>Le bouton ne fonctionne pas ?</strong> Copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="color: #d4af37; font-size: 12px; word-break: break-all; margin: 0;">
                ${confirmationUrl}
              </p>
            </div>

            <!-- Help Section -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>Vous n'avez pas demandé cette inscription ?</strong><br>
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Aucun compte ne sera créé sans confirmation.
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
                Email de confirmation d'inscription envoyé via <strong>DEESSE PEARLS</strong>
              </p>
            </div>

            <p style="color: #d4af37; margin: 15px 0 0 0; font-size: 12px;">
              <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'DEESSE PEARLS <onboarding@resend.dev>',
      to: email,
      subject: '✨ Confirmez votre inscription chez DEESSE PEARLS',
      html: emailHtml,
    });

    console.log('[initiate-signup] Confirmation email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation email sent. Please check your inbox.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[initiate-signup] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
