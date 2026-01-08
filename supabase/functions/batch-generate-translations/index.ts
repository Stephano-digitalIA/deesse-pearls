import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface Product {
  slug: string;
  name: string;
  description: string;
}

async function translateProduct(product: Product): Promise<{ success: boolean; slug: string; error?: string }> {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ];

  const prompt = `You are a professional translator for a luxury pearl jewelry e-commerce website.

Translate the following French product information into the languages listed below.
Maintain the elegant, luxurious tone appropriate for high-end jewelry.

French Product Name: "${product.name}"
French Product Description: "${product.description}"

Please translate into these languages:
${languages.map(l => `- ${l.name} (${l.code})`).join('\n')}

IMPORTANT: Respond ONLY with valid JSON in exactly this format, no other text:
{
  "name": {
    "fr": "${product.name}",
    "en": "English translation of name",
    "de": "German translation of name",
    "es": "Spanish translation of name",
    "pt": "Portuguese translation of name",
    "it": "Italian translation of name",
    "nl": "Dutch translation of name",
    "ja": "Japanese translation of name",
    "ko": "Korean translation of name"
  },
  "description": {
    "fr": "${product.description}",
    "en": "English translation of description",
    "de": "German translation of description",
    "es": "Spanish translation of description",
    "pt": "Portuguese translation of description",
    "it": "Italian translation of description",
    "nl": "Dutch translation of description",
    "ja": "Japanese translation of description",
    "ko": "Korean translation of description"
  }
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[batch-translate] AI API error for ${product.slug}:`, errorText);
      return { success: false, slug: product.slug, error: `AI API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return { success: false, slug: product.slug, error: 'No content in AI response' };
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[batch-translate] Could not parse JSON for ${product.slug}:`, content);
      return { success: false, slug: product.slug, error: 'Could not parse translations' };
    }

    const translations = JSON.parse(jsonMatch[0]);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { error: upsertError } = await supabase
      .from('product_translations')
      .upsert({
        slug: product.slug,
        name_translations: translations.name,
        description_translations: translations.description,
      }, {
        onConflict: 'slug'
      });

    if (upsertError) {
      console.error(`[batch-translate] Database error for ${product.slug}:`, upsertError);
      return { success: false, slug: product.slug, error: 'Database save failed' };
    }

    console.log(`[batch-translate] ✓ Translated: ${product.slug}`);
    return { success: true, slug: product.slug };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[batch-translate] Error for ${product.slug}:`, errorMessage);
    return { success: false, slug: product.slug, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get all products without translations
    const { data: productsWithoutTranslations, error: queryError } = await supabase
      .from('products')
      .select('slug, name, description')
      .not('slug', 'in', `(SELECT slug FROM product_translations)`);

    if (queryError) {
      // Fallback: get products and check manually
      const { data: allProducts } = await supabase.from('products').select('slug, name, description');
      const { data: existingTranslations } = await supabase.from('product_translations').select('slug');
      
      const existingSlugs = new Set((existingTranslations || []).map(t => t.slug));
      const missingProducts = (allProducts || []).filter(p => !existingSlugs.has(p.slug));
      
      console.log(`[batch-translate] Found ${missingProducts.length} products without translations`);

      if (missingProducts.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'All products already have translations',
          translated: 0,
          failed: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Limit to 15 products per call to avoid timeout
      const maxProductsPerCall = 15;
      const productsToProcess = missingProducts.slice(0, maxProductsPerCall);
      
      console.log(`[batch-translate] Processing ${productsToProcess.length} of ${missingProducts.length} remaining products`);

      // Process in batches of 5 to avoid rate limits
      const batchSize = 5;
      const results: { success: boolean; slug: string; error?: string }[] = [];
      
      for (let i = 0; i < productsToProcess.length; i += batchSize) {
        const batch = productsToProcess.slice(i, i + batchSize);
        console.log(`[batch-translate] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productsToProcess.length/batchSize)}`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(batch.map(translateProduct));
        results.push(...batchResults);
        
        // Short delay between batches
        if (i + batchSize < productsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const failures = results.filter(r => !r.success);

      console.log(`[batch-translate] Complete: ${successCount} succeeded, ${failedCount} failed`);

      return new Response(JSON.stringify({ 
        message: `Translation batch complete`,
        translated: successCount,
        failed: failedCount,
        failures: failures.length > 0 ? failures : undefined
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct query worked
    const allProducts = productsWithoutTranslations || [];
    console.log(`[batch-translate] Found ${allProducts.length} products without translations`);

    if (allProducts.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'All products already have translations',
        translated: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit to 15 products per call to avoid timeout
    const maxProductsPerCall = 15;
    const productsToProcess = allProducts.slice(0, maxProductsPerCall);
    
    console.log(`[batch-translate] Processing ${productsToProcess.length} of ${allProducts.length} remaining products`);

    // Process in batches of 5
    const batchSize = 5;
    const results: { success: boolean; slug: string; error?: string }[] = [];
    
    for (let i = 0; i < productsToProcess.length; i += batchSize) {
      const batch = productsToProcess.slice(i, i + batchSize);
      console.log(`[batch-translate] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productsToProcess.length/batchSize)}`);
      
      const batchResults = await Promise.all(batch.map(translateProduct));
      results.push(...batchResults);
      
      if (i + batchSize < productsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const failures = results.filter(r => !r.success);

    console.log(`[batch-translate] Complete: ${successCount} succeeded, ${failedCount} failed`);

    return new Response(JSON.stringify({ 
      message: `Translation batch complete`,
      translated: successCount,
      failed: failedCount,
      failures: failures.length > 0 ? failures : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[batch-translate] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
