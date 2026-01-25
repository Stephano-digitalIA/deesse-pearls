import { useQuery } from '@tanstack/react-query';
import { getReviewsByProductId } from '@/lib/localStorage';

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
      // Get approved reviews from localStorage
      const reviews = getReviewsByProductId(productId, true);

      // Map to expected format
      return reviews.map(r => ({
        id: r.id,
        product_id: r.productId,
        author_name: r.authorName,
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt,
      })) as Review[];
    },
    enabled: !!productId,
  });
};
