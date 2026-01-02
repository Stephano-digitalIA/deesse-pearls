import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccessLog {
  id: string;
  user_id: string | null;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_type: string;
  created_at: string;
}

const AccessLogsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['admin-access-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AccessLog[];
    }
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('admin_access_logs')
        .delete()
        .eq('id', logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] });
      toast.success('Log supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const clearAllLogsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_access_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] });
      toast.success('Tous les logs ont été supprimés');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Inconnu';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Autre';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Tentatives d'accès non autorisées
            </CardTitle>
            <CardDescription>
              Journal des tentatives de connexion à l'administration par des utilisateurs non autorisés
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            {logs && logs.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => clearAllLogsMutation.mutate()}
                disabled={clearAllLogsMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tout effacer
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune tentative d'accès non autorisée enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Navigateur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{log.email}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {log.attempt_type === 'unauthorized_admin_access' 
                          ? 'Accès refusé' 
                          : log.attempt_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getBrowserInfo(log.user_agent)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLogMutation.mutate(log.id)}
                        disabled={deleteLogMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessLogsManagement;
