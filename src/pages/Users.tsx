import React, { useState, useEffect } from 'react';
import { UserPlus, Users as UsersIcon, Trash2, UserX, UserCheck, MoreHorizontal } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_active: boolean;
  role?: 'admin' | 'bibliotecario' | 'user';
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  bibliotecario: 'Bibliotecário',
  user: 'Usuário',
};

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', role: 'user' as 'bibliotecario' | 'user' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserProfile | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && !isAdmin) {
      navigate('/dashboard');
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [loading, user, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    const usersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        
        return {
          ...profile,
          is_active: profile.is_active ?? true,
          role: roleData?.role as 'admin' | 'bibliotecario' | 'user' || 'user',
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast({
        title: 'Campo obrigatório',
        description: 'O email é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Store the generated password to show to admin
      if (data?.temporaryPassword) {
        setGeneratedPassword(data.temporaryPassword);
      }

      toast({
        title: 'Usuário cadastrado',
        description: `${formData.email} foi cadastrado como ${ROLE_LABELS[formData.role]}. A senha temporária foi gerada.`,
      });

      setFormData({ email: '', name: '', role: 'user' });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message || 'Ocorreu um erro ao cadastrar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    setActionLoading(userId);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { userId, action },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const messages = {
        activate: 'Usuário ativado com sucesso',
        deactivate: 'Usuário desativado com sucesso',
        delete: 'Usuário excluído com sucesso',
      };

      toast({
        title: 'Sucesso',
        description: messages[action],
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar a ação.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Gerenciar Usuários"
        description="Cadastre novos usuários para acessar o sistema"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Usuários Cadastrados</CardTitle>
              <CardDescription>
                Lista de todos os usuários com acesso ao sistema
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Uma senha temporária segura será gerada automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Nome do usuário"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo de Usuário *</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: 'bibliotecario' | 'user') => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bibliotecario">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Bibliotecário</span>
                            <span className="text-xs text-muted-foreground">Pode cadastrar, editar e excluir livros</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Usuário</span>
                            <span className="text-xs text-muted-foreground">Apenas empréstimos e devoluções</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário cadastrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id} className={!userItem.is_active ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        {userItem.name || '-'}
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === 'admin' ? 'default' : userItem.role === 'bibliotecario' ? 'outline' : 'secondary'}>
                          {ROLE_LABELS[userItem.role || 'user']}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userItem.is_active ? 'outline' : 'destructive'}>
                          {userItem.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {userItem.role !== 'admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={actionLoading === userItem.user_id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {userItem.is_active ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(userItem.user_id, 'deactivate')}
                                  className="text-warning"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(userItem.user_id, 'activate')}
                                  className="text-success"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirm(userItem)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Informações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Senhas temporárias seguras são geradas automaticamente para novos usuários.</p>
            <p>• Os usuários devem alterar a senha após o primeiro login.</p>
            <p>• Apenas administradores podem cadastrar novos usuários.</p>
            <p>• Usuários desativados não conseguem fazer login no sistema.</p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deleteConfirm?.email}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleUserAction(deleteConfirm.user_id, 'delete')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuário Criado com Sucesso</DialogTitle>
            <DialogDescription>
              Copie a senha temporária abaixo e compartilhe de forma segura com o usuário.
              Esta senha não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm text-muted-foreground">Senha Temporária</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-lg font-mono bg-background p-2 rounded border">
                  {generatedPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword || '');
                    toast({
                      title: 'Copiado!',
                      description: 'Senha copiada para a área de transferência.',
                    });
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ O usuário deve alterar esta senha após o primeiro login.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setGeneratedPassword(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
