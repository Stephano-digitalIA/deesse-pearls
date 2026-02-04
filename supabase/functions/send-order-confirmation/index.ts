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
  language?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
}

const translations = {
  fr: {
    subject: "Confirmation de commande",
    title: "Merci pour votre commande !",
    greeting: "Bonjour",
    intro: "Nous avons bien reçu votre commande et nous vous en remercions. Voici le récapitulatif de votre achat.",
    orderNumber: "Numéro de commande",
    date: "Date",
    article: "Article",
    quantity: "Qté",
    price: "Prix",
    subtotal: "Sous-total",
    shipping: "Livraison",
    free: "Gratuite",
    total: "Total",
    shippingAddress: "Adresse de livraison",
    trackingInfo: "Vous recevrez un email de confirmation dès que votre commande sera expédiée.",
    contactUs: "Pour toute question, n'hésitez pas à nous contacter à",
    footer: "La Perle Noire de Tahiti",
  },
  en: {
    subject: "Order Confirmation",
    title: "Thank you for your order!",
    greeting: "Hello",
    intro: "We have received your order and thank you for your purchase. Here is a summary of your order.",
    orderNumber: "Order Number",
    date: "Date",
    article: "Item",
    quantity: "Qty",
    price: "Price",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    shippingAddress: "Shipping Address",
    trackingInfo: "You will receive a confirmation email once your order has been shipped.",
    contactUs: "If you have any questions, please contact us at",
    footer: "The Black Pearl of Tahiti",
  },
  de: {
    subject: "Bestellbestätigung",
    title: "Vielen Dank für Ihre Bestellung!",
    greeting: "Hallo",
    intro: "Wir haben Ihre Bestellung erhalten und bedanken uns bei Ihnen. Hier ist eine Zusammenfassung Ihres Kaufs.",
    orderNumber: "Bestellnummer",
    date: "Datum",
    article: "Artikel",
    quantity: "Menge",
    price: "Preis",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    free: "Kostenlos",
    total: "Gesamt",
    shippingAddress: "Lieferadresse",
    trackingInfo: "Sie erhalten eine Bestätigungs-E-Mail, sobald Ihre Bestellung versandt wurde.",
    contactUs: "Bei Fragen kontaktieren Sie uns bitte unter",
    footer: "Die Schwarze Perle von Tahiti",
  },
  es: {
    subject: "Confirmación de pedido",
    title: "¡Gracias por su pedido!",
    greeting: "Hola",
    intro: "Hemos recibido su pedido y le agradecemos. Aquí tiene un resumen de su compra.",
    orderNumber: "Número de pedido",
    date: "Fecha",
    article: "Artículo",
    quantity: "Cant.",
    price: "Precio",
    subtotal: "Subtotal",
    shipping: "Envío",
    free: "Gratis",
    total: "Total",
    shippingAddress: "Dirección de envío",
    trackingInfo: "Recibirá un correo electrónico de confirmación una vez que su pedido haya sido enviado.",
    contactUs: "Si tiene alguna pregunta, no dude en contactarnos en",
    footer: "La Perla Negra de Tahití",
  },
  pt: {
    subject: "Confirmação de pedido",
    title: "Obrigado pelo seu pedido!",
    greeting: "Olá",
    intro: "Recebemos o seu pedido e agradecemos. Aqui está um resumo da sua compra.",
    orderNumber: "Número do pedido",
    date: "Data",
    article: "Artigo",
    quantity: "Qtd",
    price: "Preço",
    subtotal: "Subtotal",
    shipping: "Envio",
    free: "Grátis",
    total: "Total",
    shippingAddress: "Endereço de entrega",
    trackingInfo: "Você receberá um e-mail de confirmação assim que seu pedido for enviado.",
    contactUs: "Se tiver alguma dúvida, não hesite em nos contatar em",
    footer: "A Pérola Negra do Taiti",
  },
  it: {
    subject: "Conferma dell'ordine",
    title: "Grazie per il tuo ordine!",
    greeting: "Ciao",
    intro: "Abbiamo ricevuto il tuo ordine e ti ringraziamo. Ecco un riepilogo del tuo acquisto.",
    orderNumber: "Numero dell'ordine",
    date: "Data",
    article: "Articolo",
    quantity: "Qtà",
    price: "Prezzo",
    subtotal: "Subtotale",
    shipping: "Spedizione",
    free: "Gratuita",
    total: "Totale",
    shippingAddress: "Indirizzo di spedizione",
    trackingInfo: "Riceverai un'email di conferma non appena il tuo ordine sarà stato spedito.",
    contactUs: "Per qualsiasi domanda, non esitare a contattarci all'indirizzo",
    footer: "La Perla Nera di Tahiti",
  },
  nl: {
    subject: "Orderbevestiging",
    title: "Bedankt voor uw bestelling!",
    greeting: "Hallo",
    intro: "We hebben uw bestelling ontvangen en bedanken u. Hier is een samenvatting van uw aankoop.",
    orderNumber: "Bestelnummer",
    date: "Datum",
    article: "Artikel",
    quantity: "Aantal",
    price: "Prijs",
    subtotal: "Subtotaal",
    shipping: "Verzending",
    free: "Gratis",
    total: "Totaal",
    shippingAddress: "Verzendadres",
    trackingInfo: "U ontvangt een bevestigingsmail zodra uw bestelling is verzonden.",
    contactUs: "Als u vragen heeft, neem dan gerust contact met ons op via",
    footer: "De Zwarte Parel van Tahiti",
  },
  ja: {
    subject: "ご注文確認",
    title: "ご注文ありがとうございます！",
    greeting: "こんにちは",
    intro: "ご注文を承りました。ご購入の概要は以下の通りです。",
    orderNumber: "注文番号",
    date: "日付",
    article: "商品",
    quantity: "数量",
    price: "価格",
    subtotal: "小計",
    shipping: "配送料",
    free: "無料",
    total: "合計",
    shippingAddress: "配送先住所",
    trackingInfo: "ご注文が発送されましたら、確認メールをお送りします。",
    contactUs: "ご質問がございましたら、お気軽にお問い合わせください",
    footer: "タヒチの黒真珠",
  },
  ko: {
    subject: "주문 확인",
    title: "주문해 주셔서 감사합니다!",
    greeting: "안녕하세요",
    intro: "귀하의 주문을 받았으며 감사드립니다. 구매 내역은 다음과 같습니다.",
    orderNumber: "주문 번호",
    date: "날짜",
    article: "제품",
    quantity: "수량",
    price: "가격",
    subtotal: "소계",
    shipping: "배송비",
    free: "무료",
    total: "합계",
    shippingAddress: "배송 주소",
    trackingInfo: "주문이 발송되면 확인 이메일을 보내드립니다.",
    contactUs: "질문이 있으시면 언제든지 문의해 주세요",
    footer: "타히티의 검은 진주",
  },
};

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
      language = 'fr',
      shippingAddress,
    }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);
    console.log("Order number:", orderNumber);
    console.log("Language:", language);

    const t = translations[language as keyof typeof translations] || translations.fr;

    const formatPrice = (price: number) => {
      const locale = language === 'en' ? 'en-US' : 'fr-FR';
      return new Intl.NumberFormat(locale, {
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
        <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">${t.shippingAddress}</h3>
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
              DEESSE PEARLS
            </h1>
            <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">${t.footer}</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; font-size: 24px; font-weight: normal; margin: 0 0 24px 0;">
              ${t.title}
            </h2>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              ${t.greeting} ${customerName},<br><br>
              ${t.intro}
            </p>

            <!-- Order Info -->
            <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #666;">
                <strong style="color: #1a1a1a;">${t.orderNumber} :</strong> ${orderNumber}<br>
                <strong style="color: #1a1a1a;">${t.date} :</strong> ${orderDate}
              </p>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #1a1a1a;">
                  <th style="padding: 12px; text-align: left; color: #d4af37; font-weight: normal;">${t.article}</th>
                  <th style="padding: 12px; text-align: center; color: #d4af37; font-weight: normal;">${t.quantity}</th>
                  <th style="padding: 12px; text-align: right; color: #d4af37; font-weight: normal;">${t.price}</th>
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
                  <td style="padding: 8px 0; color: #666;">${t.subtotal}</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${formatPrice(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">${t.shipping}</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${shipping === 0 ? t.free : formatPrice(shipping)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${t.total}</td>
                  <td style="padding: 12px 0; text-align: right; color: #d4af37; font-size: 18px; font-weight: bold;">${formatPrice(total)}</td>
                </tr>
              </table>
            </div>

            ${addressHtml}

            <!-- Footer Message -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                ${t.trackingInfo}<br><br>
                ${t.contactUs}
                <a href="mailto:stahiti.sb@gmail.com" style="color: #d4af37;">stahiti.sb@gmail.com</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 DEESSEPEARLS - ${t.footer}<br>
              <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "DEESSE PEARLS <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `${t.subject} ${orderNumber} - DEESSE PEARLS`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send notification to admin/seller
    console.log("[send-order-confirmation] ADMIN_EMAIL value:", ADMIN_EMAIL ? "configured" : "NOT configured");
    if (ADMIN_EMAIL) {
      console.log("[send-order-confirmation] Preparing admin email for:", ADMIN_EMAIL);
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Georgia, serif; background: #f5f5f0; padding: 20px; margin: 0; }
            .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; }
            .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: normal; letter-spacing: 2px; }
            .header p { margin: 0; color: #ccc; font-size: 14px; }
            .content { padding: 30px; }
            .alert { background: #fff3cd; border-left: 4px solid #d4af37; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
            .alert p { margin: 0; color: #856404; font-weight: 500; }
            .section { margin: 25px 0; }
            .section h3 { color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px; border-bottom: 2px solid #d4af37; padding-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: 140px 1fr; gap: 10px; }
            .info-grid p { margin: 0; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .info-grid strong { color: #666; font-weight: 600; }
            .info-grid span { color: #333; }
            .items { background: #fff8e7; border-left: 4px solid #d4af37; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th { text-align: left; padding: 8px; background: #f5f5f0; font-weight: 600; color: #333; }
            .items td { padding: 8px; border-bottom: 1px solid #f0f0f0; color: #666; }
            .total-box { background: #1a1a1a; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .total-box p { margin: 8px 0; display: flex; justify-content: space-between; }
            .total-box .grand-total { font-size: 20px; color: #d4af37; font-weight: bold; border-top: 2px solid #d4af37; padding-top: 12px; margin-top: 12px; }
            .action-box { background: #e7f5ff; border: 2px solid #2196F3; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .action-box h4 { margin: 0 0 12px 0; color: #1976D2; }
            .action-box ol { margin: 8px 0; padding-left: 20px; }
            .action-box li { margin: 6px 0; color: #333; }
            .footer { text-align: center; padding: 20px; background: #f5f5f0; color: #888; font-size: 12px; border-top: 3px solid #d4af37; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 NOUVELLE COMMANDE REÇUE</h1>
              <p>Commande ${orderNumber}</p>
            </div>
            <div class="content">

              <div class="alert">
                <p>⚡ Action requise : Préparer et expédier cette commande</p>
              </div>

              <!-- Informations Client -->
              <div class="section">
                <h3>📋 Informations Client</h3>
                <div class="info-grid">
                  <p><strong>Nom :</strong></p><p><span>${customerName}</span></p>
                  <p><strong>Email :</strong></p><p><span><a href="mailto:${customerEmail}" style="color: #d4af37; text-decoration: none;">${customerEmail}</a></span></p>
                  <p><strong>Date commande :</strong></p><p><span>${orderDate}</span></p>
                  <p><strong>N° commande :</strong></p><p><span style="font-weight: 600; color: #d4af37;">${orderNumber}</span></p>
                </div>
              </div>

              <!-- Adresse de Livraison -->
              ${shippingAddress ? `
                <div class="section">
                  <h3>📍 Adresse de Livraison</h3>
                  <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                    <p style="margin: 0; color: #333; line-height: 1.8;">
                      <strong>${customerName}</strong><br>
                      ${shippingAddress.line1 || ''}<br>
                      ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
                      ${shippingAddress.postal_code || ''} ${shippingAddress.city || ''}<br>
                      ${shippingAddress.country || ''}
                    </p>
                  </div>
                </div>
              ` : ''}

              <!-- Articles Commandés -->
              <div class="section">
                <h3>🛍️ Articles à Préparer</h3>
                <div class="items">
                  <table>
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th style="text-align: center;">Quantité</th>
                        <th style="text-align: right;">Prix unitaire</th>
                        <th style="text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${items.map(item => `
                        <tr>
                          <td><strong>${item.name}</strong></td>
                          <td style="text-align: center;">${item.quantity}</td>
                          <td style="text-align: right;">${formatPrice(item.price)}</td>
                          <td style="text-align: right;"><strong>${formatPrice(item.price * item.quantity)}</strong></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Total de la Commande -->
              <div class="total-box">
                <p><span>Sous-total :</span><span>${formatPrice(subtotal)}</span></p>
                <p><span>Frais de livraison :</span><span>${shipping === 0 ? 'GRATUIT' : formatPrice(shipping)}</span></p>
                <p class="grand-total"><span>TOTAL PAYÉ :</span><span>${formatPrice(total)}</span></p>
              </div>

              <!-- Actions à Effectuer -->
              <div class="action-box">
                <h4>✅ Prochaines Étapes</h4>
                <ol>
                  <li>Vérifier le paiement dans votre compte PayPal</li>
                  <li>Préparer les articles commandés</li>
                  <li>Emballer soigneusement avec certificat d'authenticité</li>
                  <li>Expédier sous 48h ouvrées</li>
                  <li>Envoyer le numéro de suivi au client par email</li>
                </ol>
              </div>

              <!-- Note Importante -->
              <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <p style="margin: 0; color: #856404;">
                  <strong>💡 Note :</strong> Le client a déjà reçu un email de confirmation.
                  Assurez-vous de traiter cette commande dans les meilleurs délais.
                </p>
              </div>

            </div>
            <div class="footer">
              <p><strong>DEESSE PEARLS</strong> - La Perle Noire de Tahiti</p>
              <p>© 2026 DEESSEPEARLS - <a href="https://deessepearls.com" style="color: #d4af37; text-decoration: none;">deessepearls.com</a></p>
              <p style="margin-top: 8px;">Contact : <a href="mailto:stahiti.sb@gmail.com" style="color: #d4af37;">stahiti.sb@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        console.log("[send-order-confirmation] Sending admin email to:", ADMIN_EMAIL);
        const adminEmailResponse = await resend.emails.send({
          from: "DEESSE PEARLS <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `🎉 Nouvelle commande ${orderNumber} - ${customerName}`,
          html: adminEmailHtml,
        });
        console.log("[send-order-confirmation] ✅ Admin notification sent successfully:", adminEmailResponse);
      } catch (adminError: any) {
        console.error("[send-order-confirmation] ❌ Failed to send admin notification:", adminError);
        console.error("[send-order-confirmation] Admin error details:", {
          message: adminError.message,
          code: adminError.code,
          statusCode: adminError.statusCode,
        });
      }
    } else {
      console.warn("[send-order-confirmation] ⚠️ ADMIN_EMAIL not configured, skipping admin notification");
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
