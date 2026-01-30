import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product, CreateProductInput, UpdateProductInput, ProductTranslation, LanguageCode } from '@/types';
import { toast } from 'sonner';

// Type pour les traductions dans la base de données (structure Supabase)
interface DBProductTranslation {
  id?: string;
  product_id: number;  // integer dans Supabase
  lang: string;        // 'lang' et non 'language_code'
  name: string;
  description: string;
  category?: string;
  slug?: string;
}

// Helper pour convertir les traductions DB en format Product
function dbTranslationsToProduct(translations: DBProductTranslation[]): Product['translations'] {
  const result: Product['translations'] = {};
  translations.forEach(t => {
    result[t.lang as LanguageCode] = {
      name: t.name,
      description: t.description || '',
    };
  });
  return result;
}

// Récupérer tous les produits avec leurs traductions
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      // Récupérer les produits
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Products] Erreur chargement:', error);
        throw new Error(error.message);
      }

      console.log('[Products] Chargés:', products?.length);
      // Debug: afficher les données d'images
      if (products && products.length > 0) {
        console.log('[Products] Premier produit image:', products[0].image);
        console.log('[Products] Premier produit complet:', products[0]);
      }

      if (!products || products.length === 0) {
        return [];
      }

      // products.id est déjà un integer, utiliser directement
      const productIds = products.map(p => p.id);
      console.log('[Products] IDs pour traductions:', productIds);

      const { data: translations, error: transError } = await supabase
        .from('product_translations')
        .select('*')
        .in('product_id', productIds);

      if (transError) {
        console.error('[Translations] Erreur chargement:', transError);
      } else {
        console.log('[Translations] Chargées:', translations?.length);
        if (translations && translations.length > 0) {
          console.log('[Translations] Exemple:', translations[0]);
        }
      }

      // Associer les traductions aux produits (id est un integer)
      // Convertir image string en array si nécessaire (Supabase stocke une string, pas un array)
      return products.map(product => ({
        ...product,
        image: product.image
          ? (Array.isArray(product.image) ? product.image : [product.image])
          : [],
        translations: dbTranslationsToProduct(
          (translations || []).filter(t => t.product_id === product.id)
        ),
      }));
    },
  });
}

// Récupérer un produit par ID avec ses traductions
export function useProduct(id: string | number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }

      // Récupérer les traductions (data.id est un integer)
      const { data: translations } = await supabase
        .from('product_translations')
        .select('*')
        .eq('product_id', data.id);

      console.log('[Product] Traductions pour', data.id, ':', translations);

      return {
        ...data,
        // Convertir image string en array si nécessaire
        image: data.image
          ? (Array.isArray(data.image) ? data.image : [data.image])
          : [],
        translations: dbTranslationsToProduct(translations || []),
      };
    },
    enabled: !!id,
  });
}

// Helper pour sauvegarder les traductions
async function saveTranslations(productId: number, translations: Product['translations']) {
  if (!translations) return;

  console.log('[Translations] Sauvegarde pour produit:', productId);
  console.log('[Translations] Données:', translations);

  // Supprimer les anciennes traductions
  const { error: deleteError } = await supabase
    .from('product_translations')
    .delete()
    .eq('product_id', productId);

  if (deleteError) {
    console.error('[Translations] Erreur suppression:', deleteError);
  }

  // Insérer les nouvelles traductions
  const translationsToInsert: Omit<DBProductTranslation, 'id'>[] = [];
  Object.entries(translations).forEach(([langCode, translation]) => {
    if (translation && (translation.name || translation.description)) {
      translationsToInsert.push({
        product_id: productId,
        lang: langCode,
        name: translation.name || '',
        description: translation.description || '',
      });
    }
  });

  console.log('[Translations] À insérer:', translationsToInsert);

  if (translationsToInsert.length > 0) {
    const { error, data } = await supabase
      .from('product_translations')
      .insert(translationsToInsert)
      .select();

    if (error) {
      console.error('[Translations] Erreur insertion:', error);
      throw new Error(`Erreur traductions: ${error.message}`);
    }
    console.log('[Translations] Insérées:', data);
  }
}

// Créer un produit
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput): Promise<Product> => {
      // Extraire les traductions de l'input
      const { translations, image, ...restData } = input;

      // Convertir image array en string pour Supabase (qui stocke une seule URL)
      const productData = {
        ...restData,
        image: Array.isArray(image) ? (image[0] || null) : image,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Sauvegarder les traductions dans la table séparée (data.id est un integer)
      if (translations) {
        await saveTranslations(data.id, translations);
      }

      return { ...data, translations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Mettre à jour un produit
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number | string; updates: UpdateProductInput }): Promise<Product> => {
      // Extraire les traductions des updates
      const { translations, image, ...restUpdates } = updates;

      // Convertir image array en string pour Supabase
      const productUpdates = {
        ...restUpdates,
        ...(image !== undefined && { image: Array.isArray(image) ? (image[0] || null) : image }),
      };

      // Ne mettre à jour le produit que s'il y a des changements autres que les traductions
      let data;
      if (Object.keys(productUpdates).length > 0) {
        const result = await supabase
          .from('products')
          .update(productUpdates)
          .eq('id', id)
          .select()
          .single();

        if (result.error) {
          throw new Error(result.error.message);
        }
        data = result.data;
      } else {
        // Si seulement les traductions changent, récupérer le produit actuel
        const result = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (result.error) {
          throw new Error(result.error.message);
        }
        data = result.data;
      }

      // Sauvegarder les traductions dans la table séparée (data.id est un integer)
      if (translations) {
        await saveTranslations(data.id, translations);
      }

      return { ...data, translations };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Produit mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Supprimer un produit (et ses traductions)
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      // Supprimer d'abord les traductions (id est un integer)
      await supabase
        .from('product_translations')
        .delete()
        .eq('product_id', id);

      // Puis supprimer le produit
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Statistiques des produits
export function useProductStats() {
  return useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('category, in_stock, badge');

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total: products?.length || 0,
        inStock: products?.filter(p => p.in_stock).length || 0,
        outOfStock: products?.filter(p => !p.in_stock).length || 0,
        byCategory: {} as Record<string, number>,
        newProducts: products?.filter(p => p.badge === 'new').length || 0,
        bestsellers: products?.filter(p => p.badge === 'bestseller').length || 0,
      };

      products?.forEach(p => {
        stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
      });

      return stats;
    },
  });
}
