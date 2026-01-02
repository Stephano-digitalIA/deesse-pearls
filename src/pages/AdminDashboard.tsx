import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTyped } from '@/lib/supabaseTyped';
import { Product, ProductInsert, ProductCategory, ProductBadge } from '@/types/supabase';
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
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut, 
  Package, 
  Loader2,
  Search,
  Upload,
  X,
  ImageIcon,
  ShoppingCart,
  MessageSquare,
  Users,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderManagement from '@/components/admin/OrderManagement';
import ReviewManagement from '@/components/admin/ReviewManagement';
import UserManagement from '@/components/admin/UserManagement';
import AccessLogsManagement from '@/components/admin/AccessLogsManagement';
import AdminStats from '@/components/admin/AdminStats';


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

const emptyProduct: Omit<ProductInsert, 'id'> = {
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
};

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { data: products, isLoading: productsLoading, error } = useProducts();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<ProductInsert, 'id'>>(emptyProduct);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 Mo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({
        title: "Image téléchargée",
        description: "L'image a été téléchargée avec succès",
      });
    } catch (err: any) {
      toast({
        title: "Erreur d'upload",
        description: err.message || "Impossible de télécharger l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  // Server-side admin verification
  React.useEffect(() => {
    const verifyAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/admin/login');
        return;
      }
      
      // Verify admin access server-side using RPC
      const { data: isAdminVerified, error } = await supabase.rpc('verify_admin_access');
      
      if (error || !isAdminVerified) {
        navigate('/admin/login');
      }
    };
    
    verifyAdminAccess();
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setImageUrl('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      slug: product.slug,
      category: product.category,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      badge: product.badge,
      rating: product.rating,
      reviews: product.reviews,
      variants: product.variants,
      in_stock: product.in_stock,
    });
    setImageUrl(product.images[0] || '');
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

    const productData = {
      slug: formData.slug || generateSlug(formData.name),
      category: formData.category,
      name: formData.name,
      description: formData.description,
      price: formData.price,
      images: imageUrl ? [imageUrl] : [],
      badge: formData.badge,
      in_stock: formData.in_stock,
    };

    try {
      if (editingProduct) {
        const { error } = await supabaseTyped
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Produit modifié",
          description: "Le produit a été mis à jour avec succès.",
        });
      } else {
        const { error } = await supabaseTyped
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "Produit créé",
          description: "Le nouveau produit a été ajouté avec succès.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
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
      const { error } = await supabaseTyped
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
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

  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
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
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Sécurité</span>
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
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          
                          {imageUrl ? (
                            <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-muted">
                              <img
                                src={imageUrl}
                                alt="Aperçu"
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                  <p className="mt-2 text-sm text-muted-foreground">Téléchargement...</p>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                  <p className="mt-2 text-sm text-muted-foreground">Cliquez pour ajouter une image</p>
                                  <p className="text-xs text-muted-foreground/70">PNG, JPG jusqu'à 5 Mo</p>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>ou</span>
                            <Input
                              type="text"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="Chemin ou URL d'image"
                              className="flex-1 h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="in_stock"
                            checked={formData.in_stock}
                            onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                          />
                          <Label htmlFor="in_stock">En stock</Label>
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
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
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

          <TabsContent value="security">
            <AccessLogsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
