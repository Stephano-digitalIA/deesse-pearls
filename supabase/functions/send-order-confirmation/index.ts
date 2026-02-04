import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-confirmation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      orderNumber,
      orderDate,
      items,
      subtotal,
      shipping,
      total,
      shippingAddress,
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);
    console.log("Order number:", orderNumber);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(price / 100);
    };

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          ${item.name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `).join('');

    const addressHtml = shippingAddress ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #f9f9f9; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">Adresse de livraison</h3>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ${shippingAddress.line1 || ''}<br>
          ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
          ${shippingAddress.postal_code || ''} ${shippingAddress.city || ''}<br>
          ${shippingAddress.country || ''}
        </p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Georgia', serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #1a1a1a; padding: 32px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 2px;">
              PERLA D'ORO
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; font-size: 24px; font-weight: normal; margin: 0 0 24px 0;">
              Merci pour votre commande !
            </h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Bonjour ${customerName},<br><br>
              Nous avons bien reçu votre commande et nous vous en remercions. 
              Voici le récapitulatif de votre achat.
            </p>

            <!-- Order Info -->
            <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #666;">
                <strong style="color: #1a1a1a;">Numéro de commande :</strong> ${orderNumber}<br>
                <strong style="color: #1a1a1a;">Date :</strong> ${orderDate}
              </p>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #1a1a1a;">
                  <th style="padding: 12px; text-align: left; color: #d4af37; font-weight: normal;">Article</th>
                  <th style="padding: 12px; text-align: center; color: #d4af37; font-weight: normal;">Qté</th>
                  <th style="padding: 12px; text-align: right; color: #d4af37; font-weight: normal;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="border-top: 2px solid #1a1a1a; padding-top: 16px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Sous-total</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${formatPrice(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Livraison</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">Total</td>
                  <td style="padding: 12px 0; text-align: right; color: #d4af37; font-size: 18px; font-weight: bold;">${formatPrice(total)}</td>
                </tr>
              </table>
            </div>

            ${addressHtml}

            <!-- Footer Message -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                Vous recevrez un email de confirmation dès que votre commande sera expédiée.<br><br>
                Pour toute question, n'hésitez pas à nous contacter à 
                <a href="mailto:contact@perladoro.fr" style="color: #d4af37;">contact@perladoro.fr</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Perla d'Oro - Bijoux en perles de luxe<br>
              <a href="https://perladoro.fr" style="color: #d4af37; text-decoration: none;">perladoro.fr</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Perla d'Oro <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Confirmation de commande ${orderNumber} - Perla d'Oro`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send notification to admin/seller
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
            .info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .info p { margin: 8px 0; color: #666; }
            .info strong { color: #333; }
            .items { background: #fff8e7; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; background: #f5f5f0; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ NOUVELLE COMMANDE ✨</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Commande ${orderNumber}</h2>

              <div class="info">
                <p><strong>Client:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
              </div>

              <div class="info">
                <p><strong>Sous-total:</strong> ${formatPrice(subtotal)}</p>
                <p><strong>Livraison:</strong> ${shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</p>
                <p><strong style="color: #d4af37; font-size: 18px;">Total:</strong> <strong style="color: #d4af37; font-size: 18px;">${formatPrice(total)}</strong></p>
              </div>

              <h3 style="color: #333;">Articles commandés</h3>
              <div class="items">
                ${items.map(item => `<p>• ${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}</p>`).join('')}
              </div>

              ${addressHtml}
            </div>
            <div class="footer">
              <p>DeessePearls - Système de notification automatique</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const adminEmailResponse = await resend.emails.send({
          from: "DeessePearls <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `Nouvelle commande ${orderNumber} - ${customerName}`,
          html: adminEmailHtml,
        });
        console.log("Admin notification sent:", adminEmailResponse);
      } catch (adminError: any) {
        console.error("Failed to send admin notification:", adminError);
      }
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
