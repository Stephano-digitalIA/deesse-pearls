import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    // Validate session ID format (Stripe session IDs start with cs_)
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_') || sessionId.length > 200) {
      throw new Error("Invalid session ID format");
    }

    console.log("Fetching checkout session:", sessionId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details", "shipping_details"],
    });

    // Security: Only return session data if payment was successful
    // This prevents enumeration attacks as most guessed session IDs won't have completed payments
    if (session.payment_status !== 'paid') {
      console.log("Session not paid, returning minimal response");
      return new Response(JSON.stringify({ 
        error: "Session not found or payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Additional security: Check if the session was created recently (within 24 hours)
    // This limits the window for potential enumeration attacks
    const sessionAge = Date.now() - (session.created * 1000);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (sessionAge > maxAge) {
      console.log("Session too old, denying access");
      return new Response(JSON.stringify({ 
        error: "Session expired. Please check your order in account area." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410, // Gone
      });
    }

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
    
    // Don't reveal internal errors - return generic message
    const safeError = errorMessage.includes("Session") ? errorMessage : "Failed to retrieve order details";
    
    return new Response(JSON.stringify({ error: safeError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
