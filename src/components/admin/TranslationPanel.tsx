import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTED_LANGUAGES, LanguageCode, ProductTranslation } from '@/types';
import { translateToAllLanguages, translateSingleLanguage } from '@/services/gemini';
import { Loader2, Globe, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TranslationPanelProps {
  name: string;
  description: string;
  translations: { [key: string]: ProductTranslation };
  onTranslationsChange: (translations: { [key: string]: ProductTranslation }) => void;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
  name,
  description,
  translations,
  onTranslationsChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<LanguageCode>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);

  const handleTranslateAll = async () => {
    if (!name || !description) {
      toast.error('Veuillez remplir le nom et la description en français d\'abord');
      return;
    }

    setIsTranslating(true);

    try {
      const results = await translateToAllLanguages({ name, description });
      console.log('[TranslationPanel] Résultats reçus:', results);

      // Vérifier que les traductions ne sont pas vides
      const hasContent = Object.values(results).some(
        (t: any) => t.name || t.description
      );
      console.log('[TranslationPanel] Traductions avec contenu:', hasContent);

      onTranslationsChange({ ...translations, ...results });

      if (hasContent) {
        toast.success('Traductions générées avec succès');
      } else {
        toast.warning('Traductions générées mais vides - vérifiez la console');
      }
    } catch (error: any) {
      console.error('Erreur traduction:', error);
      const message = error?.message || 'Erreur lors de la traduction';
      if (message.includes('API') || message.includes('OpenAI')) {
        toast.error('Clé API OpenAI manquante. Ajoutez VITE_OPENAI_API_KEY dans .env');
      } else {
        toast.error(message);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingle = async (langCode: LanguageCode) => {
    if (!name || !description) {
      toast.error('Veuillez remplir le nom et la description en français d\'abord');
      return;
    }

    setTranslatingLang(langCode);

    try {
      const result = await translateSingleLanguage({ name, description }, langCode);
      onTranslationsChange({
        ...translations,
        [langCode]: result,
      });
      toast.success(`Traduction ${langCode.toUpperCase()} générée`);
    } catch (error: any) {
      console.error('Erreur traduction:', error);
      const message = error?.message || 'Erreur lors de la traduction';
      if (message.includes('API') || message.includes('OpenAI')) {
        toast.error('Clé API OpenAI manquante. Ajoutez VITE_OPENAI_API_KEY dans .env');
      } else {
        toast.error(message);
      }
    } finally {
      setTranslatingLang(null);
    }
  };

  const handleTranslationChange = (
    langCode: LanguageCode,
    field: 'name' | 'description',
    value: string
  ) => {
    onTranslationsChange({
      ...translations,
      [langCode]: {
        ...translations[langCode],
        [field]: value,
      },
    });
  };

  const hasTranslation = (langCode: LanguageCode) => {
    return translations[langCode]?.name || translations[langCode]?.description;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-medium">Traductions multilingues</span>
          <span className="text-xs text-muted-foreground">(8 langues)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Le français (FR) est la langue par défaut. Utilisez OpenAI pour traduire automatiquement.
          </p>

          {/* Bouton traduction globale */}
          <Button
            type="button"
            onClick={handleTranslateAll}
            disabled={isTranslating || !name || !description}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traduction en cours (peut prendre 2-3 min)...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Traduire toutes les langues avec OpenAI
              </>
            )}
          </Button>

          {/* Onglets de langues */}
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md border transition-colors relative",
                  activeTab === lang.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                )}
                onClick={() => setActiveTab(lang.code)}
              >
                <span className="mr-1">{lang.flag}</span>
                {lang.code.toUpperCase()}
                {hasTranslation(lang.code) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Champs de traduction */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {SUPPORTED_LANGUAGES.find(l => l.code === activeTab)?.flag}{' '}
                {SUPPORTED_LANGUAGES.find(l => l.code === activeTab)?.label}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleTranslateSingle(activeTab)}
                disabled={translatingLang === activeTab || !name || !description}
              >
                {translatingLang === activeTab ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Traduire
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`trans-name-${activeTab}`}>Nom</Label>
              <Input
                id={`trans-name-${activeTab}`}
                value={translations[activeTab]?.name || ''}
                onChange={(e) => handleTranslationChange(activeTab, 'name', e.target.value)}
                placeholder={name || 'Nom du produit...'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`trans-desc-${activeTab}`}>Description</Label>
              <Textarea
                id={`trans-desc-${activeTab}`}
                value={translations[activeTab]?.description || ''}
                onChange={(e) => handleTranslationChange(activeTab, 'description', e.target.value)}
                placeholder={description || 'Description du produit...'}
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationPanel;
