import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface TranslationRequest {
  name: string;
  description: string;
  slug: string;
}

interface TranslationResult {
  slug: string;
  translations: {
    name: Record<string, string>;
    description: Record<string, string>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, slug }: TranslationRequest = await req.json();

    console.log(`[generate-translations] Generating translations for: ${slug}`);

    if (!name || !description || !slug) {
      throw new Error('Missing required fields: name, description, slug');
    }

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

French Product Name: "${name}"
French Product Description: "${description}"

Please translate into these languages:
${languages.map(l => `- ${l.name} (${l.code})`).join('\n')}

IMPORTANT: Respond ONLY with valid JSON in exactly this format, no other text:
{
  "name": {
    "fr": "${name}",
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
    "fr": "${description}",
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-translations] AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generate-translations] Could not parse JSON from:', content);
      throw new Error('Could not parse translations from AI response');
    }

    const translations = JSON.parse(jsonMatch[0]);

    console.log(`[generate-translations] Successfully generated translations for: ${slug}`);

    const result: TranslationResult = {
      slug,
      translations,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-translations] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
