import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  content: string | null;
  title: string | null;
  created_at: string;
}

export const useReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      // Use public_reviews view to avoid exposing user_email
      const { data, error } = await supabase
        .from('public_reviews')
        .select('id, product_id, user_name, rating, content, title, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Review[];
    },
    enabled: !!productId,
  });
};
