import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'contact@deessepearls.com';
const ADMIN_EMAIL_2 = Deno.env.get('ADMIN_EMAIL_2');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('[send-contact-email] Function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
    } = await req.json();

    console.log('[send-contact-email] Received data:', { firstName, lastName, email, subject });

    if (!RESEND_API_KEY) {
      console.error('[send-contact-email] Missing RESEND_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Email to admin/seller
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouveau message de contact - DEESSE PEARLS</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d4a4a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #f5f5dc; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                📧 NOUVEAU MESSAGE DE CONTACT
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Vous avez reçu un nouveau message via le formulaire de contact de DEESSE PEARLS.
              </p>

              <!-- Contact Info -->
              <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin-bottom: 30px;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 0;">Informations de contact</h2>
                <p style="margin: 8px 0;"><strong>Nom:</strong> ${firstName} ${lastName}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #d4af37;">${email}</a></p>
                ${phone ? `<p style="margin: 8px 0;"><strong>Téléphone:</strong> ${phone}</p>` : ''}
                <p style="margin: 8px 0;"><strong>Sujet:</strong> ${subject}</p>
              </div>

              <!-- Message -->
              <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px;">
                <h2 style="color: #1a1a1a; font-size: 18px; margin-top: 0;">Message</h2>
                <p style="color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #f5f5dc; margin: 0; font-size: 12px;">
                &copy; 2026 DEESSE PEARLS - La Perle Noire de Tahiti
              </p>
              <p style="color: #d4af37; margin: 8px 0 0 0; font-size: 12px;">
                <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email confirmation to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message reçu - DEESSE PEARLS</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d4a4a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #f5f5dc; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                DEESSE PEARLS
              </h1>
              <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 14px;">La Perle Noire de Tahiti</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a1a1a; font-size: 22px; margin-top: 0;">Bonjour ${firstName},</h2>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Nous avons bien reçu votre message et nous vous en remercions.
              </p>

              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Notre équipe vous répondra dans les plus brefs délais.
              </p>

              <!-- Message recap -->
              <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 8px 0;"><strong>Sujet:</strong> ${subject}</p>
                <p style="margin: 8px 0; color: #666; font-size: 14px; white-space: pre-wrap;">${message}</p>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Pour toute question, contactez-nous à <a href="mailto:contact@deessepearls.com" style="color: #d4af37;">contact@deessepearls.com</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: #f5f5dc; margin: 0; font-size: 12px;">
                &copy; 2026 DEESSE PEARLS - La Perle Noire de Tahiti
              </p>
              <p style="color: #d4af37; margin: 8px 0 0 0; font-size: 12px;">
                <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('[send-contact-email] Sending admin email to:', ADMIN_EMAIL);

    // Send email to admin
    try {
      const adminResult = await resend.emails.send({
        from: 'DEESSE PEARLS <contact@deessepearls.com>',
        to: [ADMIN_EMAIL, ...(ADMIN_EMAIL_2 ? [ADMIN_EMAIL_2] : [])].filter(Boolean) as string[],
        subject: `📧 Nouveau message: ${subject}`,
        html: adminEmailHtml,
      });
      console.log('[send-contact-email] Admin email sent:', adminResult);
    } catch (adminError) {
      console.error('[send-contact-email] Admin email error:', adminError);
    }

    console.log('[send-contact-email] Sending confirmation email to:', email);

    // Send confirmation email to customer
    try {
      const customerResult = await resend.emails.send({
        from: 'DEESSE PEARLS <contact@deessepearls.com>',
        to: email,
        subject: 'Message reçu - DEESSE PEARLS',
        html: customerEmailHtml,
      });
      console.log('[send-contact-email] Customer email sent:', customerResult);
    } catch (customerError) {
      console.error('[send-contact-email] Customer email error:', customerError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Emails sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[send-contact-email] Error:', error);
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
