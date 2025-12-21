import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log("Fetching checkout session:", sessionId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details", "shipping_details"],
    });

    console.log("Session retrieved successfully");

    // Format the response with relevant order details
    const orderDetails = {
      id: session.id,
      customerEmail: session.customer_details?.email || session.customer_email,
      customerName: session.customer_details?.name || session.metadata?.customer_name,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() || "EUR",
      paymentStatus: session.payment_status,
      shippingAddress: session.shipping_details?.address
        ? {
            line1: session.shipping_details.address.line1,
            line2: session.shipping_details.address.line2,
            city: session.shipping_details.address.city,
            postalCode: session.shipping_details.address.postal_code,
            country: session.shipping_details.address.country,
          }
        : null,
      items: session.line_items?.data.map((item: Stripe.LineItem) => ({
        name: item.description,
        quantity: item.quantity,
        unitAmount: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        total: item.amount_total ? item.amount_total / 100 : 0,
      })) || [],
      createdAt: new Date(session.created * 1000).toISOString(),
    };

    return new Response(JSON.stringify(orderDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error fetching checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
