import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product, ProductTranslation } from '@/hooks/useProducts';
import { verifyAdminSecret } from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Package,
  Loader2,
  Search,
  X,
  ImageIcon,
  ShoppingCart,
  MessageSquare,
  Users,
  Home,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderManagement from '@/components/admin/OrderManagement';
import ReviewManagement from '@/components/admin/ReviewManagement';
import UserManagement from '@/components/admin/UserManagement';
import AdminStats from '@/components/admin/AdminStats';
import { resolveImagePath } from '@/lib/utils';

type ProductCategory = 'pearls' | 'bracelets' | 'necklaces' | 'rings' | 'other';
type ProductBadge = 'new' | 'bestseller';

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'pearls', label: 'Perles' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'necklaces', label: 'Colliers' },
  { value: 'rings', label: 'Bagues' },
  { value: 'other', label: 'Autres' },
];

const badges: { value: ProductBadge | 'none'; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'new', label: 'Nouveau' },
  { value: 'bestseller', label: 'Bestseller' },
];

const translationLanguages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
] as const;

type TranslationCode = typeof translationLanguages[number]['code'];

interface ProductFormData {
  slug: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  images: string[];
  badge: ProductBadge | null;
  rating: number;
  reviews: number;
  variants: null;
  in_stock: boolean;
  translations: {
    [key in TranslationCode]?: {
      name: string;
      description: string;
    };
  };
}

const emptyTranslations = {
  en: { name: '', description: '' },
  de: { name: '', description: '' },
  es: { name: '', description: '' },
  pt: { name: '', description: '' },
  it: { name: '', description: '' },
  nl: { name: '', description: '' },
  ja: { name: '', description: '' },
  ko: { name: '', description: '' },
};

const emptyProduct: ProductFormData = {
  slug: '',
  category: 'pearls',
  name: '',
  description: '',
  price: 0,
  images: [],
  badge: null,
  rating: 0,
  reviews: 0,
  variants: null,
  in_stock: true,
  translations: { ...emptyTranslations },
};

const AdminDashboard: React.FC = () => {
  const { secretKey } = useParams<{ secretKey: string }>();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { data: products, isLoading: productsLoading, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isValidSecret, setIsValidSecret] = useState<boolean | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [activeTranslationTab, setActiveTranslationTab] = useState<TranslationCode>('en');

  // Verify the secret URL key
  useEffect(() => {
    if (!secretKey) {
      setIsValidSecret(false);
      return;
    }

    const isValid = verifyAdminSecret(secretKey);
    setIsValidSecret(isValid);
  }, [secretKey]);

  // Verify admin access
  useEffect(() => {
    if (authLoading || isValidSecret === null) return;

    if (!isValidSecret) return;

    if (!user) {
      navigate(`/admin/${secretKey}/connexion`);
      return;
    }

    if (!isAdmin) {
      navigate(`/admin/${secretKey}/connexion`);
    }
  }, [user, authLoading, navigate, secretKey, isValidSecret, isAdmin]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImageUrl('');
    setShowTranslations(false);
    setActiveTranslationTab('en');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Merge existing translations with empty structure
    const mergedTranslations = { ...emptyTranslations };
    if (product.translations) {
      Object.keys(product.translations).forEach((lang) => {
        const key = lang as TranslationCode;
        if (product.translations?.[key]) {
          mergedTranslations[key] = {
            name: product.translations[key]?.name || '',
            description: product.translations[key]?.description || '',
          };
        }
      });
    }
    setFormData({
      slug: product.slug,
      category: product.category,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      badge: product.badge || null,
      rating: product.rating,
      reviews: product.reviews,
      variants: product.variants,
      in_stock: product.in_stock,
      translations: mergedTranslations,
    });
    setImageUrl(product.images[0] || '');
    setShowTranslations(false);
    setActiveTranslationTab('en');
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const slug = formData.slug || generateSlug(formData.name);

    // Filter out empty translations
    const cleanTranslations: typeof formData.translations = {};
    Object.entries(formData.translations).forEach(([lang, trans]) => {
      if (trans && (trans.name.trim() || trans.description.trim())) {
        cleanTranslations[lang as TranslationCode] = {
          name: trans.name.trim(),
          description: trans.description.trim(),
        };
      }
    });

    const productData = {
      slug,
      category: formData.category,
      name: formData.name,
      description: formData.description,
      price: formData.price,
      images: imageUrl ? [imageUrl] : [],
      badge: formData.badge,
      rating: formData.rating || 0,
      reviews: formData.reviews || 0,
      variants: formData.variants,
      in_stock: formData.in_stock,
      translations: Object.keys(cleanTranslations).length > 0 ? cleanTranslations : undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          updates: productData,
        });

        toast({
          title: "Produit modifié",
          description: "Le produit a été mis à jour avec succès.",
        });
      } else {
        await createProduct.mutateAsync(productData);

        toast({
          title: "Produit créé",
          description: "Le nouveau produit a été ajouté avec succès.",
        });
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductMutation.mutateAsync(id);

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while verifying secret
  if (authLoading || productsLoading || isValidSecret === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid secret key - show 404-like page
  if (!isValidSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-6">Page introuvable</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Erreur: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-semibold">Administration</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Accueil</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <AdminStats />

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Avis</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produits ({products?.length || 0})
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openCreateDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau produit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              placeholder="auto-généré si vide"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="category">Catégorie *</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
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
                              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="badge">Badge</Label>
                            <Select
                              value={formData.badge || 'none'}
                              onValueChange={(value) => setFormData({ ...formData, badge: value === 'none' ? null : value as ProductBadge })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {badges.map((badge) => (
                                  <SelectItem key={badge.value || 'none'} value={badge.value || 'none'}>
                                    {badge.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Image du produit</Label>

                          {imageUrl ? (
                            <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-muted">
                              <img
                                src={resolveImagePath(imageUrl)}
                                alt="Aperçu"
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => setImageUrl('')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/50">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">Entrez une URL d'image ci-dessous</p>
                            </div>
                          )}

                          <Input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="URL ou chemin de l'image"
                            className="mt-2"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="in_stock"
                            checked={formData.in_stock}
                            onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                          />
                          <Label htmlFor="in_stock">En stock</Label>
                        </div>

                        {/* Translations Section */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                            onClick={() => setShowTranslations(!showTranslations)}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-primary" />
                              <span className="font-medium">Traductions</span>
                              <span className="text-xs text-muted-foreground">(8 langues)</span>
                            </div>
                            {showTranslations ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {showTranslations && (
                            <div className="p-4 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Le francais (FR) est la langue par defaut. Ajoutez les traductions pour les autres langues.
                              </p>

                              {/* Language Tabs */}
                              <div className="flex flex-wrap gap-2">
                                {translationLanguages.map((lang) => (
                                  <button
                                    key={lang.code}
                                    type="button"
                                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                      activeTranslationTab === lang.code
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-border hover:bg-muted'
                                    }`}
                                    onClick={() => setActiveTranslationTab(lang.code)}
                                  >
                                    <span className="mr-1">{lang.flag}</span>
                                    {lang.label}
                                    {formData.translations[lang.code]?.name && (
                                      <span className="ml-1 text-xs opacity-70">*</span>
                                    )}
                                  </button>
                                ))}
                              </div>

                              {/* Translation Fields */}
                              <div className="space-y-3 pt-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`trans-name-${activeTranslationTab}`}>
                                    Nom ({translationLanguages.find(l => l.code === activeTranslationTab)?.label})
                                  </Label>
                                  <Input
                                    id={`trans-name-${activeTranslationTab}`}
                                    value={formData.translations[activeTranslationTab]?.name || ''}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      translations: {
                                        ...formData.translations,
                                        [activeTranslationTab]: {
                                          ...formData.translations[activeTranslationTab],
                                          name: e.target.value,
                                        },
                                      },
                                    })}
                                    placeholder={formData.name || 'Nom du produit...'}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`trans-desc-${activeTranslationTab}`}>
                                    Description ({translationLanguages.find(l => l.code === activeTranslationTab)?.label})
                                  </Label>
                                  <Textarea
                                    id={`trans-desc-${activeTranslationTab}`}
                                    value={formData.translations[activeTranslationTab]?.description || ''}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      translations: {
                                        ...formData.translations,
                                        [activeTranslationTab]: {
                                          ...formData.translations[activeTranslationTab],
                                          description: e.target.value,
                                        },
                                      },
                                    })}
                                    rows={3}
                                    placeholder={formData.description || 'Description du produit...'}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enregistrement...
                              </>
                            ) : editingProduct ? (
                              'Modifier'
                            ) : (
                              'Créer'
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Badge</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img
                                  src={resolveImagePath(product.images[0])}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{product.name}</p>
                                  {product.translations && Object.keys(product.translations).length > 0 && (
                                    <Globe className="w-3.5 h-3.5 text-primary" title={`${Object.keys(product.translations).length} traduction(s)`} />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{product.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {categories.find(c => c.value === product.category)?.label}
                          </TableCell>
                          <TableCell>{product.price.toFixed(2)} €</TableCell>
                          <TableCell>
                            {product.badge && (
                              <Badge variant={product.badge === 'new' ? 'default' : 'secondary'}>
                                {product.badge === 'new' ? 'Nouveau' : 'Bestseller'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.in_stock ? 'outline' : 'destructive'}>
                              {product.in_stock ? 'En stock' : 'Rupture'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(product)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {deleteConfirmId === product.id ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(product.id)}
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirmId(null)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteConfirmId(product.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredProducts?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Gestion des avis clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
