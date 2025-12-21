import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        // Get line items from the session
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });

        const customerEmail = session.customer_details?.email || session.customer_email || '';
        const customerName = session.customer_details?.name || '';
        const customerPhone = session.customer_details?.phone || null;
        
        const shippingAddress = session.shipping_details?.address || session.customer_details?.address || {};
        const shippingName = session.shipping_details?.name || customerName;

        const subtotal = (session.amount_subtotal || 0) / 100;
        const shippingCost = (session.shipping_cost?.amount_total || 0) / 100;
        const total = (session.amount_total || 0) / 100;

        // Check if order already exists (idempotency)
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('notes', `stripe_session:${session.id}`)
          .single();

        if (existingOrder) {
          logStep("Order already exists, skipping", { orderId: existingOrder.id });
          break;
        }

        // Get user_id if customer has an account
        let userId = null;
        if (customerEmail) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('user_id', (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === customerEmail)?.id)
            .single();
          
          if (profiles) {
            userId = profiles.user_id;
          }
        }

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert({
            customer_email: customerEmail,
            customer_name: customerName || shippingName,
            customer_phone: customerPhone,
            shipping_address: {
              line1: shippingAddress.line1 || '',
              line2: shippingAddress.line2 || '',
              city: shippingAddress.city || '',
              postal_code: shippingAddress.postal_code || '',
              country: shippingAddress.country || '',
              name: shippingName
            },
            subtotal,
            shipping_cost: shippingCost,
            total,
            status: 'confirmed',
            user_id: userId,
            notes: `stripe_session:${session.id}`
          })
          .select()
          .single();

        if (orderError) {
          logStep("Error creating order", { error: orderError.message });
          throw new Error(`Failed to create order: ${orderError.message}`);
        }

        logStep("Order created", { orderId: order.id, orderNumber: order.order_number });

        // Create order items
        for (const item of lineItems.data) {
          const product = item.price?.product as Stripe.Product | undefined;
          
          await supabaseAdmin
            .from('order_items')
            .insert({
              order_id: order.id,
              product_name: item.description || product?.name || 'Produit',
              quantity: item.quantity || 1,
              unit_price: (item.price?.unit_amount || 0) / 100,
              total_price: (item.amount_total || 0) / 100,
              product_image: product?.images?.[0] || null
            });
        }

        logStep("Order items created", { count: lineItems.data.length });

        // Create order history entry
        await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: order.id,
            new_status: 'confirmed',
            note: 'Paiement reçu via Stripe'
          });

        logStep("Order history created");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { 
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message 
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id });
        
        // Find order by payment intent
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntentId as string,
            limit: 1
          });

          if (sessions.data.length > 0) {
            const sessionId = sessions.data[0].id;
            
            const { data: order } = await supabaseAdmin
              .from('orders')
              .select('id')
              .eq('notes', `stripe_session:${sessionId}`)
              .single();

            if (order) {
              await supabaseAdmin
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

              await supabaseAdmin
                .from('order_history')
                .insert({
                  order_id: order.id,
                  old_status: 'confirmed',
                  new_status: 'cancelled',
                  note: 'Commande remboursée via Stripe'
                });

              logStep("Order cancelled due to refund", { orderId: order.id });
            }
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
