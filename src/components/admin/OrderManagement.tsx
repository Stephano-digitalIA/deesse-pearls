import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrder, Order } from '@/lib/localStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Eye,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolveImagePath } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500', icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: 'Expédiée', color: 'bg-purple-500', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Livrée', color: 'bg-green-500', icon: <Package className="w-4 h-4" /> },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
};

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      return getOrders();
    },
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      updateOrder(selectedOrder.id, { status: newStatus });

      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant "${statusConfig[newStatus].label}"`,
      });

      setSelectedOrder({ ...selectedOrder, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Commandes ({orders?.length || 0})
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[order.status].color} text-white`}>
                          <span className="flex items-center gap-1">
                            {statusConfig[order.status].icon}
                            {statusConfig[order.status].label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.total.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openOrderDetail(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Commande {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Status Section */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
                  <Badge className={`${statusConfig[selectedOrder.status].color} text-white`}>
                    <span className="flex items-center gap-1">
                      {statusConfig[selectedOrder.status].icon}
                      {statusConfig[selectedOrder.status].label}
                    </span>
                  </Badge>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-muted-foreground mb-1">Changer le statut</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(v) => handleStatusChange(v as OrderStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Client</h3>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                  )}
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Adresse de livraison</h3>
                  <p className="text-sm whitespace-pre-line">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 border-b">
                  <h3 className="font-semibold">Articles</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Prix unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.productImage && (
                              <img
                                src={resolveImagePath(item.productImage)}
                                alt={item.productName}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <span>{item.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.unitPrice.toFixed(2)} €</TableCell>
                        <TableCell className="text-right font-medium">{item.totalPrice.toFixed(2)} €</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{selectedOrder.shippingCost.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{selectedOrder.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderManagement;
