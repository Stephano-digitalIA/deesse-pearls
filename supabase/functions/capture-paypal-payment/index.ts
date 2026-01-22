import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CaptureRequest {
  orderId: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYPAL-CAPTURE] ${step}${detailsStr}`);
};

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  const mode = Deno.env.get("PAYPAL_MODE") || "sandbox";

  const baseUrl = mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal auth error:", errorText);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json() as CaptureRequest;

    if (!orderId) {
      throw new Error("Missing orderId");
    }

    logStep("Capturing PayPal order", { orderId });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if order already exists (idempotency)
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .eq('notes', `paypal_order:${orderId}`)
      .single();

    if (existingOrder) {
      logStep("Order already exists", { orderId: existingOrder.id });

      // Fetch order details to return
      const { data: orderDetails } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', existingOrder.id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        order: orderDetails,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    const mode = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const baseUrl = mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    // Capture the order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      logStep("PayPal capture error", { error: errorText });
      throw new Error("Failed to capture PayPal payment");
    }

    const captureData = await captureResponse.json();
    logStep("PayPal capture successful", { status: captureData.status });

    if (captureData.status !== "COMPLETED") {
      throw new Error(`Payment not completed: ${captureData.status}`);
    }

    // Extract order information from PayPal response
    const purchaseUnit = captureData.purchase_units?.[0];
    const payer = captureData.payer;
    const shipping = purchaseUnit?.shipping;

    // Parse custom_id to get original cart data
    let cartData: {
      customerEmail?: string;
      customerName?: string;
      items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        variant?: string;
        size?: string;
        quality?: string;
      }>;
    } = {};

    try {
      if (purchaseUnit?.custom_id) {
        cartData = JSON.parse(purchaseUnit.custom_id);
      }
    } catch (e) {
      logStep("Failed to parse custom_id", { error: e });
    }

    const customerEmail = payer?.email_address || cartData.customerEmail || '';
    const customerName = shipping?.name?.full_name || payer?.name?.given_name + ' ' + payer?.name?.surname || cartData.customerName || '';

    const amount = purchaseUnit?.amount;
    const total = parseFloat(amount?.value || '0');
    const breakdown = amount?.breakdown;
    const itemTotal = parseFloat(breakdown?.item_total?.value || '0');
    const shippingCost = parseFloat(breakdown?.shipping?.value || '0');

    // Get user_id if customer has an account
    let userId = null;
    if (customerEmail) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === customerEmail);
      if (user) {
        userId = user.id;
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: null,
        shipping_address: {
          line1: shipping?.address?.address_line_1 || '',
          line2: shipping?.address?.address_line_2 || '',
          city: shipping?.address?.admin_area_2 || '',
          postal_code: shipping?.address?.postal_code || '',
          country: shipping?.address?.country_code || '',
          name: shipping?.name?.full_name || customerName,
        },
        subtotal: itemTotal,
        shipping_cost: shippingCost,
        total,
        status: 'confirmed',
        user_id: userId,
        notes: `paypal_order:${orderId}`,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", { error: orderError.message });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id, orderNumber: order.order_number });

    // Create order items from cart data
    if (cartData.items && cartData.items.length > 0) {
      for (const item of cartData.items) {
        await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: order.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            product_image: null,
          });
      }
      logStep("Order items created", { count: cartData.items.length });
    }

    // Create order history entry
    await supabaseAdmin
      .from('order_history')
      .insert({
        order_id: order.id,
        new_status: 'confirmed',
        note: 'Paiement reçu via PayPal',
      });

    logStep("Order history created");

    // Fetch complete order with items
    const { data: completeOrder } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();

    return new Response(JSON.stringify({
      success: true,
      order: completeOrder,
      paypalOrderId: orderId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error capturing payment", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
