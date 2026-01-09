import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const useReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      // Use public_reviews view to avoid exposing author_email
      const { data, error } = await supabase
        .from('public_reviews')
        .select('id, product_id, author_name, rating, comment, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
};
