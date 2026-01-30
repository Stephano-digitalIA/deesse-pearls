import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ImageUploader from './ImageUploader';
import TranslationPanel from './TranslationPanel';
import {
  Product,
  ProductCategory,
  ProductBadge,
  PRODUCT_CATEGORIES,
  PRODUCT_BADGES,
  ProductTranslation,
} from '@/types';
import { generateSlug } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ProductFormData {
  slug: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  image: string[];  // 'image' dans Supabase (pas 'images')
  badge: ProductBadge | null;
  in_stock: boolean;
  rating: number;
  reviews: number;
  translations: { [key: string]: ProductTranslation };
}

const emptyFormData: ProductFormData = {
  slug: '',
  category: 'pearls',
  name: '',
  description: '',
  price: 0,
  image: [],  // tableau vide par défaut
  badge: null,
  in_stock: true,
  rating: 0,
  reviews: 0,
  translations: {},
};

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  product?: Product | null;
  isSubmitting: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);

  useEffect(() => {
    if (product) {
      setFormData({
        slug: product.slug,
        category: product.category,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image || [],  // 'image' dans Supabase
        badge: product.badge || null,
        in_stock: product.in_stock,
        rating: product.rating,
        reviews: product.reviews,
        translations: product.translations || {},
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    };

    await onSubmit(finalData);
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Nom et Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Perle de Tahiti Ronde AAA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="auto-généré si vide"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée du produit..."
              rows={3}
              required
            />
          </div>

          {/* Catégorie, Prix, Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value as ProductCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Badge</Label>
              <Select
                value={formData.badge || 'none'}
                onValueChange={(value) =>
                  handleChange('badge', value === 'none' ? null : (value as ProductBadge))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_BADGES.map((badge) => (
                    <SelectItem key={badge.value} value={badge.value}>
                      {badge.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images du produit</Label>
            <ImageUploader
              images={formData.image || []}
              onImagesChange={(images) => handleChange('image', images)}
              productId={product?.id}
            />
          </div>

          {/* En stock */}
          <div className="flex items-center space-x-2">
            <Switch
              id="in_stock"
              checked={formData.in_stock}
              onCheckedChange={(checked) => handleChange('in_stock', checked)}
            />
            <Label htmlFor="in_stock">En stock</Label>
          </div>

          {/* Traductions */}
          <TranslationPanel
            name={formData.name}
            description={formData.description}
            translations={formData.translations}
            onTranslationsChange={(translations) => handleChange('translations', translations)}
          />

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : product ? (
                'Modifier'
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
