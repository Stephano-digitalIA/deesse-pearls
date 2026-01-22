import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  size?: string;
  quality?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  customerEmail?: string;
  customerName?: string;
  shippingCost: number;
}

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
    // Rate limiting using Deno KV
    const kv = await Deno.openKv();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimitKey = ['ratelimit', 'paypal-checkout', clientIp];
    const rateLimitResult = await kv.get<number>(rateLimitKey);
    const currentCount = rateLimitResult.value || 0;
    const rateLimit = 10; // 10 checkout attempts per window
    const rateLimitWindow = 600000; // 10 minutes in ms

    if (currentCount >= rateLimit) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: 'Too many checkout attempts. Please try again later.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // Increment rate limit counter
    await kv.set(rateLimitKey, currentCount + 1, { expireIn: rateLimitWindow });

    const { items, customerEmail, customerName, shippingCost } = await req.json() as CheckoutRequest;

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate shippingCost is a reasonable number
    if (typeof shippingCost !== 'number' || shippingCost < 0 || shippingCost > 1000) {
      throw new Error("Invalid shipping cost");
    }

    console.log("Creating PayPal order for", items.length, "items from IP:", clientIp);

    // Initialize Supabase client to validate prices
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract product IDs from cart items
    const productIds = items.map(item => item.id);

    // Fetch real prices from database
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, images, in_stock')
      .in('id', productIds);

    if (dbError) {
      console.error("Database error fetching products:", dbError);
      throw new Error("Failed to validate products");
    }

    if (!products || products.length === 0) {
      throw new Error("No valid products found");
    }

    // Create a map of product ID to product data for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate each cart item against database
    const validatedItems: Array<{
      product: typeof products[0];
      quantity: number;
      variant?: string;
      size?: string;
      quality?: string;
      clientItem: CartItem;
    }> = [];

    let itemsTotal = 0;

    for (const item of items) {
      const product = productMap.get(item.id);

      if (!product) {
        console.warn(`Product not found: ${item.id}`);
        throw new Error(`Product not found: ${item.name || item.id}`);
      }

      if (!product.in_stock) {
        throw new Error(`Product out of stock: ${product.name}`);
      }

      // Log if client price doesn't match (potential manipulation attempt)
      if (Math.abs(product.price - item.price) > 0.01) {
        console.warn(`Price mismatch for ${product.name}: client sent ${item.price}, DB has ${product.price}`);
      }

      // Validate quantity
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      itemsTotal += itemTotal;

      validatedItems.push({
        product,
        quantity: item.quantity,
        variant: item.variant,
        size: item.size,
        quality: item.quality,
        clientItem: item,
      });
    }

    // Calculate total with shipping
    const totalAmount = itemsTotal + shippingCost;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    const mode = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const baseUrl = mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create PayPal order items
    const paypalItems = validatedItems.map(item => {
      const description = [item.variant, item.size, item.quality].filter(Boolean).join(" • ");
      return {
        name: item.product.name.substring(0, 127), // PayPal max 127 chars
        description: description ? description.substring(0, 127) : undefined,
        unit_amount: {
          currency_code: "EUR",
          value: item.product.price.toFixed(2),
        },
        quantity: item.quantity.toString(),
      };
    });

    // Create PayPal order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "EUR",
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "EUR",
              value: itemsTotal.toFixed(2),
            },
            shipping: {
              currency_code: "EUR",
              value: shippingCost.toFixed(2),
            },
          },
        },
        items: paypalItems,
        custom_id: JSON.stringify({
          customerEmail,
          customerName,
          items: validatedItems.map(vi => ({
            id: vi.product.id,
            name: vi.product.name,
            price: vi.product.price,
            quantity: vi.quantity,
            variant: vi.variant,
            size: vi.size,
            quality: vi.quality,
          })),
        }),
      }],
      application_context: {
        brand_name: "D'Esse Pearls",
        locale: "fr-FR",
        landing_page: "LOGIN",
        shipping_preference: "GET_FROM_FILE",
        user_action: "PAY_NOW",
        return_url: `${origin}/payment-success`,
        cancel_url: `${origin}/payment-cancelled`,
      },
    };

    const createOrderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!createOrderResponse.ok) {
      const errorText = await createOrderResponse.text();
      console.error("PayPal create order error:", errorText);
      throw new Error("Failed to create PayPal order");
    }

    const orderData = await createOrderResponse.json();
    console.log("PayPal order created:", orderData.id);

    // Find approval URL
    const approvalUrl = orderData.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL in PayPal response");
    }

    return new Response(JSON.stringify({
      url: approvalUrl,
      orderId: orderData.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating PayPal order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
