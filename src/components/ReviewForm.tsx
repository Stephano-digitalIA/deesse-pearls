import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

const reviewTranslations: Record<string, Record<string, string>> = {
  'review.title': {
    fr: 'Laisser un avis',
    en: 'Leave a review',
    de: 'Bewertung schreiben',
    es: 'Dejar una opinión',
    pt: 'Deixar uma avaliação',
    it: 'Lascia una recensione',
    nl: 'Schrijf een beoordeling',
    ja: 'レビューを書く',
    ko: '리뷰 작성하기',
  },
  'review.name': {
    fr: 'Votre nom',
    en: 'Your name',
    de: 'Ihr Name',
    es: 'Su nombre',
    pt: 'Seu nome',
    it: 'Il tuo nome',
    nl: 'Uw naam',
    ja: 'お名前',
    ko: '이름',
  },
  'review.email': {
    fr: 'Votre email',
    en: 'Your email',
    de: 'Ihre E-Mail',
    es: 'Su email',
    pt: 'Seu email',
    it: 'La tua email',
    nl: 'Uw e-mail',
    ja: 'メールアドレス',
    ko: '이메일',
  },
  'review.rating': {
    fr: 'Votre note',
    en: 'Your rating',
    de: 'Ihre Bewertung',
    es: 'Su puntuación',
    pt: 'Sua avaliação',
    it: 'La tua valutazione',
    nl: 'Uw beoordeling',
    ja: '評価',
    ko: '평점',
  },
  'review.comment': {
    fr: 'Votre commentaire',
    en: 'Your comment',
    de: 'Ihr Kommentar',
    es: 'Su comentario',
    pt: 'Seu comentário',
    it: 'Il tuo commento',
    nl: 'Uw opmerking',
    ja: 'コメント',
    ko: '댓글',
  },
  'review.submit': {
    fr: 'Envoyer mon avis',
    en: 'Submit review',
    de: 'Bewertung absenden',
    es: 'Enviar opinión',
    pt: 'Enviar avaliação',
    it: 'Invia recensione',
    nl: 'Beoordeling verzenden',
    ja: 'レビューを送信',
    ko: '리뷰 제출',
  },
  'review.success': {
    fr: 'Merci pour votre avis ! Il sera visible après modération.',
    en: 'Thank you for your review! It will be visible after moderation.',
    de: 'Vielen Dank für Ihre Bewertung! Sie wird nach der Moderation sichtbar.',
    es: '¡Gracias por su opinión! Será visible después de la moderación.',
    pt: 'Obrigado pela sua avaliação! Será visível após moderação.',
    it: 'Grazie per la tua recensione! Sarà visibile dopo la moderazione.',
    nl: 'Bedankt voor uw beoordeling! Deze wordt zichtbaar na moderatie.',
    ja: 'レビューありがとうございます！審査後に表示されます。',
    ko: '리뷰 감사합니다! 검토 후 표시됩니다.',
  },
  'review.error': {
    fr: "Erreur lors de l'envoi de votre avis",
    en: 'Error submitting your review',
    de: 'Fehler beim Senden Ihrer Bewertung',
    es: 'Error al enviar su opinión',
    pt: 'Erro ao enviar sua avaliação',
    it: "Errore nell'invio della recensione",
    nl: 'Fout bij het verzenden van uw beoordeling',
    ja: 'レビューの送信中にエラーが発生しました',
    ko: '리뷰 제출 중 오류가 발생했습니다',
  },
  'review.selectRating': {
    fr: 'Sélectionnez une note',
    en: 'Select a rating',
    de: 'Wählen Sie eine Bewertung',
    es: 'Seleccione una puntuación',
    pt: 'Selecione uma avaliação',
    it: 'Seleziona una valutazione',
    nl: 'Selecteer een beoordeling',
    ja: '評価を選択してください',
    ko: '평점을 선택해주세요',
  },
  'review.namePlaceholder': {
    fr: 'Marie D.',
    en: 'Jane D.',
    de: 'Marie D.',
    es: 'María D.',
    pt: 'Maria D.',
    it: 'Maria D.',
    nl: 'Marie D.',
    ja: '田中 花子',
    ko: '김영희',
  },
  'review.emailPlaceholder': {
    fr: 'votre@email.com',
    en: 'your@email.com',
    de: 'ihre@email.de',
    es: 'su@email.com',
    pt: 'seu@email.com',
    it: 'tua@email.com',
    nl: 'uw@email.nl',
    ja: 'your@email.com',
    ko: 'your@email.com',
  },
  'review.commentPlaceholder': {
    fr: 'Partagez votre expérience avec ce produit...',
    en: 'Share your experience with this product...',
    de: 'Teilen Sie Ihre Erfahrung mit diesem Produkt...',
    es: 'Comparta su experiencia con este producto...',
    pt: 'Compartilhe sua experiência com este produto...',
    it: 'Condividi la tua esperienza con questo prodotto...',
    nl: 'Deel uw ervaring met dit product...',
    ja: 'この商品についてのご感想をお聞かせください...',
    ko: '이 제품에 대한 경험을 공유해주세요...',
  },
  'review.validationName': {
    fr: 'Le nom doit contenir entre 2 et 50 caractères',
    en: 'Name must be between 2 and 50 characters',
    de: 'Der Name muss zwischen 2 und 50 Zeichen lang sein',
    es: 'El nombre debe tener entre 2 y 50 caracteres',
    pt: 'O nome deve ter entre 2 e 50 caracteres',
    it: 'Il nome deve contenere tra 2 e 50 caratteri',
    nl: 'De naam moet tussen 2 en 50 tekens bevatten',
    ja: '名前は2〜50文字で入力してください',
    ko: '이름은 2~50자 사이여야 합니다',
  },
  'review.validationEmail': {
    fr: 'Veuillez entrer un email valide',
    en: 'Please enter a valid email',
    de: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    es: 'Por favor, introduzca un email válido',
    pt: 'Por favor, insira um email válido',
    it: 'Inserisci un indirizzo email valido',
    nl: 'Voer een geldig e-mailadres in',
    ja: '有効なメールアドレスを入力してください',
    ko: '유효한 이메일을 입력해주세요',
  },
  'review.validationComment': {
    fr: 'Le commentaire doit contenir entre 10 et 1000 caractères',
    en: 'Comment must be between 10 and 1000 characters',
    de: 'Der Kommentar muss zwischen 10 und 1000 Zeichen lang sein',
    es: 'El comentario debe tener entre 10 y 1000 caracteres',
    pt: 'O comentário deve ter entre 10 e 1000 caracteres',
    it: 'Il commento deve contenere tra 10 e 1000 caratteri',
    nl: 'De opmerking moet tussen 10 en 1000 tekens bevatten',
    ja: 'コメントは10〜1000文字で入力してください',
    ko: '댓글은 10~1000자 사이여야 합니다',
  },
  'review.noReviews': {
    fr: 'Aucun avis pour le moment. Soyez le premier à donner votre avis !',
    en: 'No reviews yet. Be the first to leave a review!',
    de: 'Noch keine Bewertungen. Seien Sie der Erste, der eine Bewertung abgibt!',
    es: 'Aún no hay opiniones. ¡Sea el primero en dejar una opinión!',
    pt: 'Ainda não há avaliações. Seja o primeiro a deixar uma avaliação!',
    it: 'Ancora nessuna recensione. Sii il primo a lasciare una recensione!',
    nl: 'Nog geen beoordelingen. Wees de eerste om een beoordeling achter te laten!',
    ja: 'まだレビューがありません。最初のレビューを書いてみませんか？',
    ko: '아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!',
  },
};

// Sanitize text by stripping HTML tags and dangerous content
const sanitizeText = (text: string): string => {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

const reviewSchema = z.object({
  user_name: z.string().trim().min(2).max(50).transform(sanitizeText),
  user_email: z.string().trim().email().max(255),
  content: z.string().trim().min(10).max(1000).transform(sanitizeText),
  rating: z.number().min(1).max(5),
});

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted }) => {
  const { language } = useLocale();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      // Set email from user
      if (user.email && !email) {
        setEmail(user.email);
      }
      // Set name from user metadata or profile
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName && !name) {
        setName(fullName);
      }
    }
  }, [user]);

  const t = (key: string) => reviewTranslations[key]?.[language] || reviewTranslations[key]?.['fr'] || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      user_name: name,
      user_email: email,
      content: comment,
      rating,
    };

    const result = reviewSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'user_name') {
          newErrors.name = t('review.validationName');
        } else if (field === 'user_email') {
          newErrors.email = t('review.validationEmail');
        } else if (field === 'content') {
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
      // First, get product info for the email notification
      const { data: productData } = await supabase
        .from('products')
        .select('name, slug')
        .eq('id', productId)
        .single();

      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_name: name.trim(),
          user_email: email.trim(),
          rating,
          content: comment.trim(),
          user_id: user?.id || null,
        });

      if (error) throw error;

      // Send email notification to admin (fire and forget - don't block on errors)
      try {
        await supabase.functions.invoke('notify-review', {
          body: {
            productName: productData?.name || 'Produit',
            productSlug: productData?.slug || '',
            authorName: name.trim(),
            authorEmail: email.trim(),
            rating,
            comment: comment.trim(),
            language,
          },
        });
        console.log('Admin notification sent successfully');
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
        // Don't fail the review submission if notification fails
      }

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

export { reviewTranslations };
export default ReviewForm;
