import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  shipping_address: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  order_items: OrderItem[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    console.log("Generating invoice for order:", orderId);

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user has access to this order
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      
      if (userData?.user) {
        // Verify this order belongs to the user
        const { data: orderCheck } = await supabaseClient
          .from("orders")
          .select("user_id")
          .eq("id", orderId)
          .single();
        
        if (orderCheck && orderCheck.user_id !== userData.user.id) {
          // Check if user is admin
          const { data: isAdmin } = await supabaseClient.rpc("verify_admin_access");
          if (!isAdmin) {
            throw new Error("Unauthorized access to this order");
          }
        }
      }
    }

    // Fetch order with items
    const { data: order, error } = await supabaseClient
      .from("orders")
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        total,
        subtotal,
        shipping_cost,
        created_at,
        shipping_address,
        order_items (
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Error fetching order:", error);
      throw new Error("Order not found");
    }

    console.log("Order found:", order.order_number);

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper functions
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(price);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Colors
    const goldColor: [number, number, number] = [212, 175, 55];
    const darkColor: [number, number, number] = [26, 26, 26];
    const grayColor: [number, number, number] = [100, 100, 100];

    let y = 20;

    // Header
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(...goldColor);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PERLA D'ORO", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Bijoux en perles de luxe", pageWidth / 2, 28, { align: "center" });

    y = 55;

    // Invoice title
    doc.setTextColor(...darkColor);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 20, y);
    
    y += 15;

    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(`Numéro de facture: ${order.order_number}`, 20, y);
    doc.text(`Date: ${formatDate(order.created_at)}`, pageWidth - 20, y, { align: "right" });
    
    y += 20;

    // Customer info box
    doc.setFillColor(249, 249, 249);
    doc.rect(20, y - 5, pageWidth - 40, 35, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text("Facturé à:", 25, y + 5);
    
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_name, 25, y + 12);
    doc.text(order.customer_email, 25, y + 19);
    
    if (order.shipping_address) {
      const addr = order.shipping_address;
      let addrY = y + 5;
      doc.setFont("helvetica", "bold");
      doc.text("Livré à:", pageWidth - 85, addrY);
      addrY += 7;
      doc.setFont("helvetica", "normal");
      if (addr.line1) {
        doc.text(addr.line1, pageWidth - 85, addrY);
        addrY += 7;
      }
      if (addr.city && addr.postal_code) {
        doc.text(`${addr.postal_code} ${addr.city}`, pageWidth - 85, addrY);
        addrY += 7;
      }
      if (addr.country) {
        doc.text(addr.country, pageWidth - 85, addrY);
      }
    }

    y += 45;

    // Table header
    doc.setFillColor(...darkColor);
    doc.rect(20, y, pageWidth - 40, 10, 'F');
    
    doc.setTextColor(...goldColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Article", 25, y + 7);
    doc.text("Qté", 120, y + 7, { align: "center" });
    doc.text("Prix unit.", 145, y + 7, { align: "right" });
    doc.text("Total", pageWidth - 25, y + 7, { align: "right" });

    y += 15;

    // Table items
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "normal");
    
    for (const item of order.order_items) {
      // Truncate long product names
      let productName = item.product_name;
      if (productName.length > 45) {
        productName = productName.substring(0, 42) + "...";
      }
      
      doc.text(productName, 25, y);
      doc.text(item.quantity.toString(), 120, y, { align: "center" });
      doc.text(formatPrice(item.unit_price), 145, y, { align: "right" });
      doc.text(formatPrice(item.total_price), pageWidth - 25, y, { align: "right" });
      
      y += 8;
      
      // Draw line under item
      doc.setDrawColor(230, 230, 230);
      doc.line(25, y - 3, pageWidth - 25, y - 3);
    }

    y += 10;

    // Totals section
    const totalsX = pageWidth - 80;
    
    doc.setTextColor(...grayColor);
    doc.text("Sous-total:", totalsX, y);
    doc.setTextColor(...darkColor);
    doc.text(formatPrice(order.subtotal), pageWidth - 25, y, { align: "right" });
    
    y += 8;
    
    doc.setTextColor(...grayColor);
    doc.text("Livraison:", totalsX, y);
    doc.setTextColor(...darkColor);
    doc.text(order.shipping_cost === 0 ? "Gratuite" : formatPrice(order.shipping_cost), pageWidth - 25, y, { align: "right" });
    
    y += 12;
    
    // Total line
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, y - 5, pageWidth - 20, y - 5);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", totalsX, y);
    doc.setTextColor(...goldColor);
    doc.text(formatPrice(order.total), pageWidth - 25, y, { align: "right" });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 25;
    
    doc.setDrawColor(230, 230, 230);
    doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Perla d'Oro - Bijoux en perles de luxe", pageWidth / 2, footerY, { align: "center" });
    doc.text("contact@perladoro.fr | www.perladoro.fr", pageWidth / 2, footerY + 6, { align: "center" });
    doc.text("Merci pour votre confiance", pageWidth / 2, footerY + 12, { align: "center" });

    // Generate PDF buffer
    const pdfOutput = doc.output("arraybuffer");
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfOutput)));

    console.log("Invoice generated successfully");

    return new Response(
      JSON.stringify({ 
        pdf: pdfBase64,
        filename: `facture-${order.order_number}.pdf`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
