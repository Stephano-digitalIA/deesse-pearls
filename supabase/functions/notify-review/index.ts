import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReviewNotificationRequest {
  productName: string;
  productSlug: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  comment: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[notify-review] Received request:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ADMIN_EMAIL) {
      console.error("[notify-review] ADMIN_EMAIL not configured");
      throw new Error("ADMIN_EMAIL not configured");
    }

    if (!RESEND_API_KEY) {
      console.error("[notify-review] RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    const { productName, productSlug, authorName, authorEmail, rating, comment }: ReviewNotificationRequest = await req.json();
    
    console.log("[notify-review] Sending notification for review on product:", productName);

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

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
          .rating { color: #d4af37; font-size: 24px; letter-spacing: 2px; margin: 15px 0; }
          .info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .info p { margin: 8px 0; color: #666; }
          .info strong { color: #333; }
          .comment { background: #fff8e7; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; font-style: italic; color: #555; }
          .footer { text-align: center; padding: 20px; background: #f5f5f0; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ NOUVEL AVIS CLIENT ✨</h1>
          </div>
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">Un nouveau avis a été soumis</h2>
            
            <div class="info">
              <p><strong>Produit:</strong> ${productName}</p>
              <p><strong>Client:</strong> ${authorName}</p>
              <p><strong>Email:</strong> ${authorEmail}</p>
            </div>
            
            <div class="rating">${stars}</div>
            
            <div class="comment">
              "${comment}"
            </div>
            
            <p style="color: #666;">Cet avis est en attente de modération. Connectez-vous au tableau de bord admin pour l'approuver ou le rejeter.</p>
          </div>
          <div class="footer">
            <p>Perles Éternelles - Système de notification automatique</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Perles Éternelles <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `Nouvel avis client - ${productName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("[notify-review] Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("[notify-review] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[notify-review] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
