import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccessLogs,
  deleteAccessLog,
  clearAccessLogs,
  getAccessBlocks,
  deleteAccessBlock,
  clearAccessBlocks,
  AccessLog,
  AccessBlock,
} from '@/lib/localStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Trash2, RefreshCw, Clock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AccessLogsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch access logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-access-logs'],
    queryFn: async () => {
      return getAccessLogs();
    }
  });

  // Fetch blocked users
  const { data: blocks, isLoading: blocksLoading, refetch: refetchBlocks } = useQuery({
    queryKey: ['admin-access-blocks'],
    queryFn: async () => {
      return getAccessBlocks();
    }
  });

  // Delete log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const success = deleteAccessLog(logId);
      if (!success) throw new Error('Log not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] });
      toast.success('Log supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  // Clear all logs mutation
  const clearAllLogsMutation = useMutation({
    mutationFn: async () => {
      clearAccessLogs();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] });
      toast.success('Tous les logs ont été supprimés');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const success = deleteAccessBlock(blockId);
      if (!success) throw new Error('Block not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-blocks'] });
      toast.success('Utilisateur débloqué');
    },
    onError: () => {
      toast.error('Erreur lors du déblocage');
    }
  });

  // Clear all blocks mutation
  const clearAllBlocksMutation = useMutation({
    mutationFn: async () => {
      clearAccessBlocks();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-blocks'] });
      toast.success('Tous les blocages ont été levés');
    },
    onError: () => {
      toast.error('Erreur lors du déblocage');
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

  const isCurrentlyBlocked = (blockedUntil: string | null) => {
    if (!blockedUntil) return false;
    return new Date(blockedUntil) > new Date();
  };

  const getRemainingTime = (blockedUntil: string | null) => {
    if (!blockedUntil) return null;
    const remaining = new Date(blockedUntil).getTime() - Date.now();
    if (remaining <= 0) return null;
    const minutes = Math.ceil(remaining / (1000 * 60));
    return `${minutes} min`;
  };

  const activeBlocks = blocks?.filter(b => isCurrentlyBlocked(b.blockedUntil)) || [];

  if (logsLoading || blocksLoading) {
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
              Sécurité & Accès
            </CardTitle>
            <CardDescription>
              Journal des tentatives d'accès non autorisées et gestion des blocages
            </CardDescription>
          </div>
          {activeBlocks.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {activeBlocks.length} utilisateur{activeBlocks.length > 1 ? 's' : ''} bloqué{activeBlocks.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Logs ({logs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="blocks" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Blocages ({activeBlocks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
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
                          {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-medium">{log.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.attemptType === 'admin_login_success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.attemptType === 'unauthorized_admin_access'
                              ? 'Non autorisé'
                              : log.attemptType === 'admin_login_success'
                              ? 'Autorisé'
                              : log.attemptType}
                          </Badge>
                        </TableCell>
                        <TableCell>{getBrowserInfo(log.userAgent)}</TableCell>
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
          </TabsContent>

          <TabsContent value="blocks" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchBlocks()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              {blocks && blocks.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearAllBlocksMutation.mutate()}
                  disabled={clearAllBlocksMutation.isPending}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Tout débloquer
                </Button>
              )}
            </div>

            {!blocks || blocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun utilisateur bloqué</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Tentatives</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Temps restant</TableHead>
                      <TableHead>Dernière mise à jour</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.map((block) => {
                      const blocked = isCurrentlyBlocked(block.blockedUntil);
                      const remaining = getRemainingTime(block.blockedUntil);

                      return (
                        <TableRow key={block.id}>
                          <TableCell className="font-medium">{block.email}</TableCell>
                          <TableCell>{block.attemptCount}</TableCell>
                          <TableCell>
                            {blocked ? (
                              <Badge variant="destructive">Bloqué</Badge>
                            ) : (
                              <Badge variant="secondary">Expiré</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {remaining || '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(block.updatedAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unblockMutation.mutate(block.id)}
                              disabled={unblockMutation.isPending}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Débloquer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AccessLogsManagement;
