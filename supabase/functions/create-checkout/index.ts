import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const rateLimitKey = ['ratelimit', 'checkout', clientIp];
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

    console.log("Creating checkout session for", items.length, "items from IP:", clientIp);

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
    }> = [];

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

      validatedItems.push({
        product,
        quantity: item.quantity,
        variant: item.variant,
        size: item.size,
        quality: item.quality,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Helper to validate if a string is an absolute URL
    const isAbsoluteUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    // Create line items for Stripe using DATABASE prices (not client-supplied)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map((item) => {
      const description = [item.variant, item.size, item.quality].filter(Boolean).join(" • ");
      
      // Get first image from product
      const productImage = item.product.images?.[0];
      const validImage = productImage && isAbsoluteUrl(productImage) ? productImage : null;
      
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.product.name,
            ...(description && { description }),
            ...(validImage && { images: [validImage] }),
          },
          // Use DATABASE price, not client-supplied price
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frais de livraison",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session - Force EUR only, no currency conversion
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancelled`,
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC"],
      },
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      // Disable currency conversion - customer pays in EUR only
      locale: "fr",
      metadata: {
        customer_name: customerName || "",
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
