import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminStats from '@/components/admin/AdminStats';
import ProductTable from '@/components/admin/ProductTable';
import ProductForm from '@/components/admin/ProductForm';
import { Product } from '@/types';
import { Loader2, Plus, Package, LogOut, Gem } from 'lucide-react';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'admin2025';

const AdminDashboard: React.FC = () => {
  const { secretKey } = useParams<{ secretKey: string }>();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isValidSecret, setIsValidSecret] = useState<boolean | null>(null);

  useEffect(() => {
    if (!secretKey) {
      setIsValidSecret(false);
      return;
    }
    setIsValidSecret(secretKey === ADMIN_SECRET);
  }, [secretKey]);

  useEffect(() => {
    if (authLoading || isValidSecret === null) return;
    if (!isValidSecret) return;

    if (!user || !isAdmin) {
      navigate(`/admin/${secretKey}/connexion`, { replace: true });
    }
  }, [user, authLoading, secretKey, isValidSecret, isAdmin, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        updates: data,
      });
    } else {
      await createProduct.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: number | string) => {
    await deleteProduct.mutateAsync(id);
  };

  if (authLoading || productsLoading || isValidSecret === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">404</h1>
          <p className="text-muted-foreground">Page introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-semibold">
              Dashboard Admin
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
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

        {/* Products Section */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produits ({products?.length || 0})
            </CardTitle>
            <Button onClick={handleCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </CardHeader>
          <CardContent>
            <ProductTable
              products={products || []}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              isDeleting={deleteProduct.isPending}
            />
          </CardContent>
        </Card>
      </main>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  );
};

export default AdminDashboard;
