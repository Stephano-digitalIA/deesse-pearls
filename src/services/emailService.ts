import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_7pd565s';
const TEMPLATE_ID = 'template_d6i9rrd';
const PUBLIC_KEY = 'XE4-1-JE4UAnYtFf4';

// Traductions multilingues pour les emails
const emailTranslations: Record<string, any> = {
  fr: {
    subject: 'Confirmation de commande',
    title: 'Merci pour votre commande !',
    greeting: 'Bonjour',
    orderConfirmed: 'Votre commande a été confirmée.',
    summary: 'Récapitulatif',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    total: 'Total',
    shippingAddress: 'Adresse de livraison',
    thanks: 'Merci de votre confiance !',
    team: "L'équipe DeessePearls"
  },
  en: {
    subject: 'Order Confirmation',
    title: 'Thank you for your order!',
    greeting: 'Hello',
    orderConfirmed: 'Your order has been confirmed.',
    summary: 'Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    shippingAddress: 'Shipping Address',
    thanks: 'Thank you for your trust!',
    team: 'The DeessePearls Team'
  },
  de: {
    subject: 'Bestellbestätigung',
    title: 'Vielen Dank für Ihre Bestellung!',
    greeting: 'Hallo',
    orderConfirmed: 'Ihre Bestellung wurde bestätigt.',
    summary: 'Zusammenfassung',
    subtotal: 'Zwischensumme',
    shipping: 'Versand',
    total: 'Gesamt',
    shippingAddress: 'Lieferadresse',
    thanks: 'Vielen Dank für Ihr Vertrauen!',
    team: 'Das DeessePearls Team'
  },
  es: {
    subject: 'Confirmación de pedido',
    title: '¡Gracias por su pedido!',
    greeting: 'Hola',
    orderConfirmed: 'Su pedido ha sido confirmado.',
    summary: 'Resumen',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    shippingAddress: 'Dirección de envío',
    thanks: '¡Gracias por su confianza!',
    team: 'El equipo DeessePearls'
  },
  pt: {
    subject: 'Confirmação de pedido',
    title: 'Obrigado pelo seu pedido!',
    greeting: 'Olá',
    orderConfirmed: 'Seu pedido foi confirmado.',
    summary: 'Resumo',
    subtotal: 'Subtotal',
    shipping: 'Frete',
    total: 'Total',
    shippingAddress: 'Endereço de entrega',
    thanks: 'Obrigado pela sua confiança!',
    team: 'A equipe DeessePearls'
  },
  it: {
    subject: 'Conferma ordine',
    title: 'Grazie per il tuo ordine!',
    greeting: 'Ciao',
    orderConfirmed: 'Il tuo ordine è stato confermato.',
    summary: 'Riepilogo',
    subtotal: 'Subtotale',
    shipping: 'Spedizione',
    total: 'Totale',
    shippingAddress: 'Indirizzo di spedizione',
    thanks: 'Grazie per la tua fiducia!',
    team: 'Il team DeessePearls'
  },
  nl: {
    subject: 'Bestellingsbevestiging',
    title: 'Bedankt voor uw bestelling!',
    greeting: 'Hallo',
    orderConfirmed: 'Uw bestelling is bevestigd.',
    summary: 'Samenvatting',
    subtotal: 'Subtotaal',
    shipping: 'Verzending',
    total: 'Totaal',
    shippingAddress: 'Bezorgadres',
    thanks: 'Bedankt voor uw vertrouwen!',
    team: 'Het DeessePearls Team'
  },
  ja: {
    subject: 'ご注文確認',
    title: 'ご注文ありがとうございます！',
    greeting: 'こんにちは',
    orderConfirmed: 'ご注文が確認されました。',
    summary: '概要',
    subtotal: '小計',
    shipping: '送料',
    total: '合計',
    shippingAddress: '配送先住所',
    thanks: 'ご信頼いただきありがとうございます！',
    team: 'DeessePearlsチーム'
  },
  ko: {
    subject: '주문 확인',
    title: '주문해 주셔서 감사합니다!',
    greeting: '안녕하세요',
    orderConfirmed: '주문이 확인되었습니다.',
    summary: '요약',
    subtotal: '소계',
    shipping: '배송',
    total: '총계',
    shippingAddress: '배송 주소',
    thanks: '신뢰해 주셔서 감사합니다!',
    team: 'DeessePearls 팀'
  }
};

// Récupérer les traductions selon la langue actuelle
function getEmailTranslations(): typeof emailTranslations.fr {
  const locale = localStorage.getItem('deesse-language') || 'fr';
  console.log('[Email] Langue detectee:', locale);
  return emailTranslations[locale] || emailTranslations.fr;
}

export interface OrderEmailData {
  order_number: string;
  order_items: string;
  subtotal: string;
  shipping: string;
  total: string;
  customer_email: string;
  customer_name: string;
  shipping_address: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  console.log('=== DEBUT ENVOI EMAIL ===');

  const customerEmail = orderData.customer_email;
  const customerName = orderData.customer_name || 'Client';
  const shippingAddress = orderData.shipping_address || 'Non spécifiée';

  console.log('customerEmail:', customerEmail);

  if (!customerEmail) {
    console.error('EMAIL VIDE - Abandon');
    return false;
  }

  // Récupérer les traductions
  const t = getEmailTranslations();
  const locale = localStorage.getItem('deesse-language') || 'fr';
  console.log('Langue email:', locale);

  console.log('Envoi email à:', customerEmail);

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: customerEmail,
        order_number: orderData.order_number,
        customer_name: customerName,
        order_items: orderData.order_items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
        shipping_address: shippingAddress,
        // Subject et titre
        email_subject: `DeessePearls - ${t.subject} ${orderData.order_number}`,
        email_title: t.title,
        // Traductions
        greeting: t.greeting,
        order_confirmed_text: t.orderConfirmed,
        summary_label: t.summary,
        subtotal_label: t.subtotal,
        shipping_label: t.shipping,
        total_label: t.total,
        shipping_address_label: t.shippingAddress,
        thanks_text: t.thanks,
        team_text: t.team,
      },
      PUBLIC_KEY
    );
    console.log('Email envoyé!', response);
    return true;
  } catch (error) {
    console.error('Erreur EmailJS:', error);
    return false;
  }
};

export const formatOrderItemsForEmail = (
  items: Array<{ productName: string; quantity: number; unitPrice: number; totalPrice: number }>,
  formatPrice: (price: number) => string
): string => {
  return items
    .map(item => `• ${item.productName} (x${item.quantity}) - ${formatPrice(item.totalPrice)}`)
    .join('\n');
};
