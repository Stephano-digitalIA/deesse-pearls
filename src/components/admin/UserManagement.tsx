import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, deleteUser, User, getProfileByUserId } from '@/lib/localStorage';

interface UserWithProfile extends User {
  firstName?: string;
  lastName?: string;
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Loader2,
  ShieldCheck,
  UserCog,
  Mail,
  Calendar,
  Pencil,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserWithProfile[]> => {
      const allUsers = getUsers();
      return allUsers
        .map(user => {
          const profile = getProfileByUserId(user.id);
          return {
            ...user,
            firstName: profile?.firstName || '',
            lastName: profile?.lastName || '',
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const openEditDialog = (user: User) => {
    setSelectedRole(user.role);
    setEditingUser(user);
  };

  const handleSaveRole = () => {
    if (!editingUser) return;

    updateUser(editingUser.id, { role: selectedRole });

    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-count'] });
    toast({
      title: 'Rôle modifié',
      description: `${editingUser.email} est maintenant ${selectedRole === 'admin' ? 'Administrateur' : 'Utilisateur'}`,
    });
    setEditingUser(null);
  };

  const handleDelete = () => {
    if (!deletingUser) return;

    deleteUser(deletingUser.id);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-count'] });
    toast({
      title: 'Utilisateur supprimé',
      description: `${deletingUser.email} a été supprimé`,
    });
    setDeletingUser(null);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.firstName?.toLowerCase() || '').includes(searchLower) ||
      (user.lastName?.toLowerCase() || '').includes(searchLower)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <UserCog className="w-3 h-3 mr-1" />
            Utilisateur
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Utilisateurs ({users.length})
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
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <span className="text-gold font-medium text-sm">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={user.firstName ? '' : 'text-muted-foreground'}>
                        {user.firstName || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={user.lastName ? '' : 'text-muted-foreground'}>
                        {user.lastName || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => setDeletingUser(user)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit User Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Modifiez le rôle de <strong>{editingUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'user') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      Utilisateur
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Administrateur
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{deletingUser?.email}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserManagement;
