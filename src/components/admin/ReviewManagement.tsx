import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  product_id: string;
  author_name: string;
  author_email: string;
  comment: string;
  rating: number;
  approved: boolean;
  created_at: string;
}
import { Check, X, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReviewWithProduct extends Review {
  product_name?: string;
}

const ReviewManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: async (): Promise<ReviewWithProduct[]> => {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data: allReviews, error } = await query;
      if (error) throw error;

      const { data: products } = await supabase
        .from('products')
        .select('id, name');

      const productMap = new Map<string, string>();
      (products || []).forEach(p => productMap.set(p.id, p.name));

      return (allReviews || []).map(review => ({
        ...review,
        product_name: productMap.get(review.product_id),
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Avis approuvé' });
    },
    onError: () => {
      toast({ title: 'Erreur lors de l\'approbation', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Avis retiré' });
    },
    onError: () => {
      toast({ title: 'Erreur lors du rejet', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Avis supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          En attente
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          size="sm"
        >
          Approuvés
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Tous
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun avis {filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvé' : ''}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {review.author_name}
                      <Badge variant={review.approved ? 'default' : 'secondary'}>
                        {review.approved ? 'Approuvé' : 'En attente'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {review.author_email} • {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {review.product_name && (
                      <p className="text-sm text-gold mt-1">
                        Produit: {review.product_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{review.comment}</p>
                <div className="flex gap-2">
                  {!review.approved && (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(review.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                  )}
                  {review.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(review.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Retirer
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(review.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
