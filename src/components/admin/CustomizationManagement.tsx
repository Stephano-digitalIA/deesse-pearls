import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Search, Loader2, Eye, Trash2, Mail, Phone } from 'lucide-react';
import type { CustomizationRequest } from '@/types/supabase';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  contacted: { label: 'Contacté', variant: 'default' },
  in_progress: { label: 'En cours', variant: 'default' },
  completed: { label: 'Terminé', variant: 'outline' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const CustomizationManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CustomizationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['customization-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customization_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomizationRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('customization_requests')
        .update({ status, admin_notes: notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customization-requests'] });
      toast({ title: 'Demande mise à jour' });
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customization_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customization-requests'] });
      toast({ title: 'Demande supprimée' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const filteredRequests = requests?.filter(req =>
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetails = (request: CustomizationRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
  };

  const handleUpdate = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Personnalisations ({requests?.length || 0})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{request.name}</div>
                    <div className="text-sm text-muted-foreground">{request.email}</div>
                  </TableCell>
                  <TableCell>
                    {request.request_type}
                  </TableCell>
                  <TableCell>{request.budget_range || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[request.status]?.variant || 'secondary'}>
                      {statusLabels[request.status]?.label || request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === request.id ? (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(request.id)}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(request.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune demande de personnalisation
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 mt-4">
              {/* Client Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nom:</span>
                    <p className="font-medium">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                        {selectedRequest.email}
                      </a>
                    </p>
                  </div>
                  {selectedRequest.phone && (
                    <div>
                      <span className="text-muted-foreground">Téléphone:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedRequest.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-3">
                <h3 className="font-semibold">Détails de la personnalisation</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type de demande:</span>
                    <p className="font-medium">{selectedRequest.request_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <p className="font-medium">{selectedRequest.budget_range || '-'}</p>
                  </div>
                </div>
                {selectedRequest.description && (
                  <div>
                    <span className="text-muted-foreground text-sm">Description:</span>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">{selectedRequest.description}</p>
                  </div>
                )}
              </div>

              {/* Admin Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Gestion</h3>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Statut</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Notes admin</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notes internes..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CustomizationManagement;
