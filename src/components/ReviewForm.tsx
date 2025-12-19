import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocale } from '@/contexts/LocaleContext';
import { z } from 'zod';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

const reviewTranslations: Record<string, Record<string, string>> = {
  'review.title': {
    fr: 'Laisser un avis',
    en: 'Leave a review',
  },
  'review.name': {
    fr: 'Votre nom',
    en: 'Your name',
  },
  'review.email': {
    fr: 'Votre email',
    en: 'Your email',
  },
  'review.rating': {
    fr: 'Votre note',
    en: 'Your rating',
  },
  'review.comment': {
    fr: 'Votre commentaire',
    en: 'Your comment',
  },
  'review.submit': {
    fr: 'Envoyer mon avis',
    en: 'Submit review',
  },
  'review.success': {
    fr: 'Merci pour votre avis ! Il sera visible après modération.',
    en: 'Thank you for your review! It will be visible after moderation.',
  },
  'review.error': {
    fr: 'Erreur lors de l\'envoi de votre avis',
    en: 'Error submitting your review',
  },
  'review.selectRating': {
    fr: 'Sélectionnez une note',
    en: 'Select a rating',
  },
  'review.namePlaceholder': {
    fr: 'Marie D.',
    en: 'Jane D.',
  },
  'review.emailPlaceholder': {
    fr: 'votre@email.com',
    en: 'your@email.com',
  },
  'review.commentPlaceholder': {
    fr: 'Partagez votre expérience avec ce produit...',
    en: 'Share your experience with this product...',
  },
  'review.validationName': {
    fr: 'Le nom doit contenir entre 2 et 50 caractères',
    en: 'Name must be between 2 and 50 characters',
  },
  'review.validationEmail': {
    fr: 'Veuillez entrer un email valide',
    en: 'Please enter a valid email',
  },
  'review.validationComment': {
    fr: 'Le commentaire doit contenir entre 10 et 1000 caractères',
    en: 'Comment must be between 10 and 1000 characters',
  },
};

const reviewSchema = z.object({
  author_name: z.string().trim().min(2).max(50),
  author_email: z.string().trim().email().max(255),
  comment: z.string().trim().min(10).max(1000),
  rating: z.number().min(1).max(5),
});

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted }) => {
  const { language } = useLocale();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = (key: string) => reviewTranslations[key]?.[language] || reviewTranslations[key]?.['fr'] || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      author_name: name,
      author_email: email,
      comment,
      rating,
    };

    const result = reviewSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'author_name') {
          newErrors.name = t('review.validationName');
        } else if (field === 'author_email') {
          newErrors.email = t('review.validationEmail');
        } else if (field === 'comment') {
          newErrors.comment = t('review.validationComment');
        } else if (field === 'rating') {
          newErrors.rating = t('review.selectRating');
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          author_name: name.trim(),
          author_email: email.trim(),
          rating,
          comment: comment.trim(),
        });

      if (error) throw error;

      toast.success(t('review.success'));
      setName('');
      setEmail('');
      setComment('');
      setRating(0);
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('review.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-secondary p-6 rounded-lg space-y-4">
      <h3 className="font-display text-xl mb-4">{t('review.title')}</h3>
      
      {/* Rating */}
      <div>
        <Label className="block mb-2">{t('review.rating')}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-gold text-gold'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-destructive text-sm mt-1">{errors.rating}</p>}
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="review-name">{t('review.name')}</Label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('review.namePlaceholder')}
          maxLength={50}
          className="mt-1"
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="review-email">{t('review.email')}</Label>
        <Input
          id="review-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('review.emailPlaceholder')}
          maxLength={255}
          className="mt-1"
        />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Comment */}
      <div>
        <Label htmlFor="review-comment">{t('review.comment')}</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review.commentPlaceholder')}
          rows={4}
          maxLength={1000}
          className="mt-1"
        />
        {errors.comment && <p className="text-destructive text-sm mt-1">{errors.comment}</p>}
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-gold hover:bg-gold-light text-deep-black"
      >
        {isSubmitting ? '...' : t('review.submit')}
      </Button>
    </form>
  );
};

export default ReviewForm;
