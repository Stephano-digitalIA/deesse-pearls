import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'stahiti.sb@gmail.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[confirm-signup] Function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    console.log('[confirm-signup] Confirming signup with token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find pending signup
    const { data: pendingSignup, error: fetchError } = await supabase
      .from('pending_signups')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !pendingSignup) {
      console.error('[confirm-signup] Token not found:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired confirmation token',
          expired: true
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token expired
    if (new Date(pendingSignup.token_expires_at) < new Date()) {
      console.error('[confirm-signup] Token expired');
      // Delete expired entry
      await supabase
        .from('pending_signups')
        .delete()
        .eq('id', pendingSignup.id);

      return new Response(
        JSON.stringify({
          error: 'Confirmation token has expired. Please sign up again.',
          expired: true
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[confirm-signup] Token valid, creating auth user');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: pendingSignup.email,
      password: pendingSignup.password_hash,  // Note: This should ideally be the actual password, not hash
      email_confirm: true,  // Email is pre-confirmed
      user_metadata: {
        first_name: pendingSignup.first_name,
        last_name: pendingSignup.last_name
      }
    });

    if (authError) {
      console.error('[confirm-signup] Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[confirm-signup] User created successfully:', authData.user.id);

    // Delete pending signup (cleanup)
    await supabase
      .from('pending_signups')
      .delete()
      .eq('id', pendingSignup.id);

    console.log('[confirm-signup] Sending admin notification');

    // Send notification to admin
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);

        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Nouvelle inscription confirmée - DEESSE PEARLS</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d4a4a 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #f5f5dc; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                    ✅ INSCRIPTION CONFIRMÉE
                  </h1>
                  <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 14px;">
                    DEESSE PEARLS
                  </p>
                </div>

                <div style="padding: 40px 20px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Un nouveau client a confirmé son inscription et rejoint DEESSE PEARLS.
                  </p>

                  <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin-bottom: 30px;">
                    <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 0;">Informations du nouveau client</h2>
                    <p style="margin: 8px 0;"><strong>Nom complet:</strong> ${pendingSignup.first_name} ${pendingSignup.last_name}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${pendingSignup.email}" style="color: #d4af37;">${pendingSignup.email}</a></p>
                    <p style="margin: 8px 0;"><strong>ID utilisateur:</strong> <span style="font-family: monospace; font-size: 12px; color: #666;">${authData.user.id}</span></p>
                    <p style="margin: 8px 0;"><strong>Date de confirmation:</strong> ${dateStr}</p>
                  </div>

                  <div style="background-color: #e7f7e7; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="color: #2d6b2d; font-size: 14px; margin: 0;">
                      ✅ <strong>Email vérifié</strong> - Ce client a confirmé son adresse email et son compte est maintenant actif.
                    </p>
                  </div>

                  <div style="text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
                    <p style="color: #666; font-size: 13px; margin: 0;">
                      💎 Un nouveau membre actif rejoint la communauté DEESSE PEARLS
                    </p>
                  </div>
                </div>

                <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                  <p style="color: #f5f5dc; margin: 0; font-size: 12px;">
                    &copy; 2026 DEESSE PEARLS - Administration
                  </p>
                  <p style="color: #666; margin: 8px 0 0 0; font-size: 11px;">
                    Notification automatique
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: 'DEESSE PEARLS <noreply@deessepearls.com>',
          to: ADMIN_EMAIL,
          subject: `✅ Inscription confirmée: ${pendingSignup.first_name} ${pendingSignup.last_name}`,
          html: adminEmailHtml,
        });

        console.log('[confirm-signup] Admin notification sent');
      } catch (emailError) {
        console.error('[confirm-signup] Failed to send admin email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[confirm-signup] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
