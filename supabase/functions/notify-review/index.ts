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
  language?: string;
}

const translations = {
  fr: {
    subject: "Merci pour votre avis !",
    greeting: "Bonjour",
    thankYou: "Merci d'avoir partagé votre avis",
    reviewReceived: "Nous avons bien reçu votre avis sur",
    yourRating: "Votre note",
    yourComment: "Votre commentaire",
    moderation: "Votre avis sera visible sur notre site après modération par notre équipe.",
    questions: "Si vous avez des questions, contactez-nous à contact@tahititechdigital.com",
    regards: "Cordialement,",
    team: "L'équipe DEESSE PEARLS",
    footer: "La Perle Noire de Tahiti",
  },
  en: {
    subject: "Thank you for your review!",
    greeting: "Hello",
    thankYou: "Thank you for sharing your review",
    reviewReceived: "We have received your review for",
    yourRating: "Your rating",
    yourComment: "Your comment",
    moderation: "Your review will be visible on our website after moderation by our team.",
    questions: "If you have any questions, contact us at contact@tahititechdigital.com",
    regards: "Best regards,",
    team: "The DEESSE PEARLS Team",
    footer: "The Black Pearl of Tahiti",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[notify-review] Received request:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("[notify-review] RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    const { productName, productSlug, authorName, authorEmail, rating, comment, language = 'fr' }: ReviewNotificationRequest = await req.json();
    
    console.log("[notify-review] Sending notifications for review on product:", productName);

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const t = translations[language as keyof typeof translations] || translations.fr;

    // Email to admin
    if (ADMIN_EMAIL) {
      const adminEmailHtml = `
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
              <p><strong>DEESSE PEARLS</strong> - La Perle Noire de Tahiti</p>
              <p style="margin-top: 8px;">© 2026 DEESSEPEARLS - <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DEESSE PEARLS <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `⭐ Nouvel avis client - ${productName}`,
          html: adminEmailHtml,
        }),
      });

      if (!adminRes.ok) {
        const errorData = await adminRes.text();
        console.error("[notify-review] Failed to send admin email:", errorData);
      } else {
        const adminEmailResponse = await adminRes.json();
        console.log("[notify-review] Admin email sent:", adminEmailResponse);
      }
    }

    // Confirmation email to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #f5f5f0; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 3px; }
          .header p { margin: 10px 0 0; color: #a0926b; font-size: 14px; letter-spacing: 1px; }
          .content { padding: 40px 30px; }
          .greeting { color: #333; font-size: 18px; margin-bottom: 20px; }
          .thank-you { background: linear-gradient(135deg, #fff8e7 0%, #fff5db 100%); border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; }
          .thank-you h2 { color: #d4af37; margin: 0 0 10px; font-size: 22px; font-weight: normal; }
          .thank-you p { color: #666; margin: 0; }
          .review-summary { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .review-summary h3 { color: #333; margin: 0 0 15px; font-size: 16px; }
          .product-name { color: #d4af37; font-weight: bold; }
          .rating { color: #d4af37; font-size: 20px; letter-spacing: 2px; margin: 10px 0; }
          .comment-box { background: white; border-left: 3px solid #d4af37; padding: 15px; margin-top: 15px; font-style: italic; color: #555; }
          .moderation-note { background: #e8f4f8; border-radius: 6px; padding: 15px; margin: 25px 0; color: #4a6d7c; font-size: 14px; }
          .moderation-note strong { color: #3a5a6a; }
          .signature { margin-top: 30px; color: #666; }
          .signature p { margin: 5px 0; }
          .footer { text-align: center; padding: 25px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); }
          .footer p { color: #a0926b; margin: 0; font-size: 12px; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DEESSE PEARLS</h1>
            <p>✨ ${t.footer} ✨</p>
          </div>
          <div class="content">
            <p class="greeting">${t.greeting} ${authorName},</p>
            
            <div class="thank-you">
              <h2>🎉 ${t.thankYou} !</h2>
              <p>${t.reviewReceived} <span class="product-name">${productName}</span></p>
            </div>
            
            <div class="review-summary">
              <h3>${t.yourRating}</h3>
              <div class="rating">${stars}</div>
              
              <h3 style="margin-top: 20px;">${t.yourComment}</h3>
              <div class="comment-box">
                "${comment}"
              </div>
            </div>
            
            <div class="moderation-note">
              <strong>ℹ️</strong> ${t.moderation}
            </div>
            
            <div class="signature">
              <p>${t.questions}</p>
              <p style="margin-top: 20px;">${t.regards}</p>
              <p><strong>${t.team}</strong></p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 DEESSEPEARLS - La Perle Noire de Tahiti</p>
            <p style="margin-top: 8px;"><a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const customerRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DEESSE PEARLS <onboarding@resend.dev>",
        to: [authorEmail],
        subject: t.subject,
        html: customerEmailHtml,
      }),
    });

    if (!customerRes.ok) {
      const errorData = await customerRes.text();
      console.error("[notify-review] Failed to send customer email:", errorData);
    } else {
      const customerEmailResponse = await customerRes.json();
      console.log("[notify-review] Customer confirmation email sent:", customerEmailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
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
