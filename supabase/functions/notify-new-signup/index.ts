import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'stahiti.sb@gmail.com';
const ADMIN_EMAIL_2 = Deno.env.get('ADMIN_EMAIL_2');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[notify-new-signup] Function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      userId,
    } = await req.json();

    console.log('[notify-new-signup] New signup:', { firstName, lastName, email, userId });

    if (!RESEND_API_KEY) {
      console.error('[notify-new-signup] Missing RESEND_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Format current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email to admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle inscription - DEESSE PEARLS</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d4a4a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #f5f5dc; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                🎉 NOUVELLE INSCRIPTION
              </h1>
              <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 14px;">
                DEESSE PEARLS
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Un nouveau client vient de s'inscrire sur votre boutique DEESSE PEARLS.
              </p>

              <!-- User Info -->
              <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin-bottom: 30px;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 0;">Informations du nouveau client</h2>
                <p style="margin: 8px 0;"><strong>Nom complet:</strong> ${firstName} ${lastName}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #d4af37;">${email}</a></p>
                <p style="margin: 8px 0;"><strong>ID utilisateur:</strong> <span style="font-family: monospace; font-size: 12px; color: #666;">${userId}</span></p>
                <p style="margin: 8px 0;"><strong>Date d'inscription:</strong> ${dateStr}</p>
              </div>

              <!-- Actions -->
              <div style="background-color: #fff8e7; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                <h3 style="color: #1a1a1a; font-size: 16px; margin-top: 0;">Actions recommandées</h3>
                <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li>Vérifier le profil client dans l'administration</li>
                  <li>Envoyer un message de bienvenue personnalisé (optionnel)</li>
                  <li>Surveiller la première commande pour un service optimal</li>
                </ul>
              </div>

              <!-- Stats -->
              <div style="text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
                <p style="color: #666; font-size: 13px; margin: 0;">
                  💎 Un nouveau membre rejoint la communauté DEESSE PEARLS
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #f5f5dc; margin: 0; font-size: 12px;">
                &copy; 2026 DEESSE PEARLS - Administration
              </p>
              <p style="color: #666; margin: 8px 0 0 0; font-size: 11px;">
                Notification automatique via Supabase
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('[notify-new-signup] Sending admin notification to:', ADMIN_EMAIL);

    // Send email to admin
    const adminResult = await resend.emails.send({
      from: 'DEESSE PEARLS <noreply@deessepearls.com>',
      to: [ADMIN_EMAIL, ...(ADMIN_EMAIL_2 ? [ADMIN_EMAIL_2] : [])].filter(Boolean) as string[],
      subject: `🎉 Nouvelle inscription: ${firstName} ${lastName}`,
      html: adminEmailHtml,
    });

    console.log('[notify-new-signup] Admin email sent:', adminResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notified successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[notify-new-signup] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
