import { ProductTranslation, LanguageCode, SUPPORTED_LANGUAGES } from '@/types';

interface TranslationInput {
  name: string;
  description: string;
}

interface TranslationResult {
  [key: string]: ProductTranslation;
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  it: 'Italian',
  nl: 'Dutch',
  ja: 'Japanese',
  ko: 'Korean',
};

// Utiliser l'API OpenAI
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API OpenAI non configurée');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un traducteur professionnel spécialisé dans le luxe et la joaillerie. Tu réponds uniquement en JSON valide.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Réponse vide de OpenAI');
  }

  return text;
}

// Fonction helper pour traduire une seule langue
async function translateSingleLang(
  input: TranslationInput,
  langCode: LanguageCode
): Promise<{ langCode: LanguageCode; translation: ProductTranslation }> {
  const langName = LANGUAGE_NAMES[langCode];

  const prompt = `Traduis le texte suivant du français vers ${langName}.
Conserve le ton luxueux et élégant approprié pour des perles de Tahiti.

Texte à traduire:
Nom: ${input.name}
Description: ${input.description}

Réponds UNIQUEMENT en JSON valide:
{"name": "traduction du nom", "description": "traduction de la description"}`;

  try {
    const text = await callOpenAI(prompt);
    console.log(`[OpenAI] Réponse pour ${langCode}:`, text);

    // Nettoyer la réponse des backticks markdown si présents
    let cleanedText = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Essayer d'extraire le JSON si enveloppé dans du texte
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanedText);

    const translation = {
      name: parsed.name || '',
      description: parsed.description || '',
    };

    console.log(`[OpenAI] ✓ Traduction ${langCode}:`, translation);

    return {
      langCode,
      translation,
    };
  } catch (error) {
    console.error(`[OpenAI] ✗ Erreur de traduction pour ${langCode}:`, error);
    return {
      langCode,
      translation: { name: '', description: '' },
    };
  }
}

export async function translateProduct(
  input: TranslationInput,
  targetLanguages: LanguageCode[]
): Promise<TranslationResult> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('Clé API OpenAI non configurée. Ajoutez VITE_OPENAI_API_KEY dans .env');
  }

  // Exécuter toutes les traductions en parallèle (OpenAI a de bons rate limits)
  const translationPromises = targetLanguages.map(langCode =>
    translateSingleLang(input, langCode)
  );

  const translationResults = await Promise.all(translationPromises);

  // Convertir le tableau de résultats en objet
  const results: TranslationResult = {};
  for (const { langCode, translation } of translationResults) {
    results[langCode] = translation;
  }

  return results;
}

export async function translateToAllLanguages(
  input: TranslationInput
): Promise<TranslationResult> {
  const allLanguages = SUPPORTED_LANGUAGES.map(l => l.code);
  return translateProduct(input, allLanguages);
}

export async function translateSingleLanguage(
  input: TranslationInput,
  targetLanguage: LanguageCode
): Promise<ProductTranslation> {
  const result = await translateProduct(input, [targetLanguage]);
  return result[targetLanguage] || { name: '', description: '' };
}
