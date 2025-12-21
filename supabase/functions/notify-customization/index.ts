import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomizationRequest {
  jewelryType: string;
  pearlType: string;
  metalType: string;
  budget: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const jewelryLabels: Record<string, string> = {
  ring: 'Bague',
  necklace: 'Collier',
  bracelet: 'Bracelet',
  earrings: 'Boucles d\'oreilles',
  pendant: 'Pendentif',
  other: 'Autre',
};

const pearlLabels: Record<string, string> = {
  round: 'Ronde',
  drop: 'Goutte',
  baroque: 'Baroque',
  button: 'Bouton',
  multiple: 'Plusieurs types',
};

const metalLabels: Record<string, string> = {
  'gold-18k': 'Or jaune 18k',
  'white-gold': 'Or blanc',
  'rose-gold': 'Or rose',
  platinum: 'Platine',
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[notify-customization] Received request:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("[notify-customization] RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    const data: CustomizationRequest = await req.json();
    console.log("[notify-customization] Received customization request for:", data.firstName, data.lastName);

    if (!ADMIN_EMAIL) {
      console.error("[notify-customization] ADMIN_EMAIL not configured");
      throw new Error("ADMIN_EMAIL not configured");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #f5f5f0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: normal; letter-spacing: 2px; }
          .content { padding: 30px; }
          .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .section h2 { color: #333; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #666; }
          .info-value { color: #333; font-weight: 500; }
          .description { background: #fff8e7; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; font-style: italic; color: #555; }
          .footer { text-align: center; padding: 20px; background: #f5f5f0; color: #888; font-size: 12px; }
          .cta { display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ NOUVELLE DEMANDE DE PERSONNALISATION ✨</h1>
          </div>
          <div class="content">
            <div class="section">
              <h2>👤 Informations client</h2>
              <div class="info-row">
                <span class="info-label">Nom</span>
                <span class="info-value">${data.firstName} ${data.lastName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${data.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Téléphone</span>
                <span class="info-value">${data.phone || 'Non renseigné'}</span>
              </div>
            </div>
            
            <div class="section">
              <h2>💎 Détails de la demande</h2>
              <div class="info-row">
                <span class="info-label">Type de bijou</span>
                <span class="info-value">${jewelryLabels[data.jewelryType] || data.jewelryType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type de perle</span>
                <span class="info-value">${pearlLabels[data.pearlType] || data.pearlType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Métal</span>
                <span class="info-value">${metalLabels[data.metalType] || data.metalType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Budget</span>
                <span class="info-value">${data.budget}</span>
              </div>
            </div>
            
            ${data.description ? `
              <div class="description">
                <strong>Description du projet:</strong><br><br>
                "${data.description}"
              </div>
            ` : ''}
            
            <p style="color: #666; text-align: center;">
              Cette demande a été enregistrée dans le tableau de bord administrateur.
            </p>
          </div>
          <div class="footer">
            <p>Perles Éternelles - Système de notification automatique</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Perles Éternelles <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `Nouvelle demande de personnalisation - ${data.firstName} ${data.lastName}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[notify-customization] Failed to send email:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await response.json();
    console.log("[notify-customization] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[notify-customization] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
