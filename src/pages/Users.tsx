import React, { useState, useEffect } from 'react';
import { UserPlus, Users as UsersIcon, Trash2, UserX, UserCheck, Loader2, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{ user: UserProfile; newRole: 'bibliotecario' | 'user' } | null>(null);
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

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete' | 'change_role', newRole?: 'bibliotecario' | 'user') => {
    setActionLoading(userId);
    
    try {
      const body: { userId: string; action: string; newRole?: string } = { userId, action };
      if (action === 'change_role' && newRole) {
        body.newRole = newRole;
      }

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body,
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const messages: Record<string, string> = {
        activate: 'Usuário ativado com sucesso',
        deactivate: 'Usuário desativado com sucesso',
        delete: 'Usuário excluído com sucesso',
        change_role: data?.message || 'Função alterada com sucesso',
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
      setRoleChangeConfirm(null);
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
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/95">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-display">Usuários Cadastrados</CardTitle>
                </div>
                <CardDescription className="ml-12">
                  {users.length} {users.length === 1 ? 'usuário registrado' : 'usuários registrados'} no sistema
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto bg-gradient-primary hover:opacity-90 shadow-md">
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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <UsersIcon className="h-10 w-10 opacity-40" />
                </div>
                <p className="text-lg font-medium">Nenhum usuário cadastrado</p>
                <p className="text-sm mt-1">Clique em "Novo Usuário" para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                      <TableHead className="font-semibold text-foreground/80">Nome</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Email</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Tipo</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold text-foreground/80">Cadastro</TableHead>
                      <TableHead className="w-[70px] font-semibold text-foreground/80">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem, index) => (
                      <TableRow 
                        key={userItem.id} 
                        className={`
                          transition-all duration-200 
                          hover:bg-primary/5 
                          ${!userItem.is_active ? 'opacity-50 bg-muted/20' : ''} 
                          ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}
                        `}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                              ${userItem.role === 'admin' 
                                ? 'bg-primary/15 text-primary' 
                                : userItem.role === 'bibliotecario' 
                                  ? 'bg-accent/15 text-accent-foreground' 
                                  : 'bg-muted text-muted-foreground'}
                            `}>
                              {(userItem.name || userItem.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{userItem.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[180px]">
                          <span className="truncate block">{userItem.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={userItem.role === 'admin' ? 'default' : 'outline'}
                            className={`
                              font-medium
                              ${userItem.role === 'admin' 
                                ? 'bg-primary/90 hover:bg-primary' 
                                : userItem.role === 'bibliotecario' 
                                  ? 'border-accent/50 text-accent-foreground bg-accent/10' 
                                  : 'border-muted-foreground/30'}
                            `}
                          >
                            {ROLE_LABELS[userItem.role || 'user']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${userItem.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
                            <span className={`text-sm ${userItem.is_active ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                              {userItem.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {userItem.role !== 'admin' && (
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                                    onClick={() => setRoleChangeConfirm({
                                      user: userItem,
                                      newRole: userItem.role === 'bibliotecario' ? 'user' : 'bibliotecario'
                                    })}
                                    disabled={actionLoading === userItem.user_id}
                                  >
                                    {actionLoading === userItem.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {userItem.role === 'bibliotecario' 
                                      ? 'Alterar para Usuário comum' 
                                      : 'Alterar para Bibliotecário'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {userItem.is_active ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-all duration-200"
                                      onClick={() => handleUserAction(userItem.user_id, 'deactivate')}
                                      disabled={actionLoading === userItem.user_id}
                                    >
                                      {actionLoading === userItem.user_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserX className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2.5 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-900/50 transition-all duration-200"
                                      onClick={() => handleUserAction(userItem.user_id, 'activate')}
                                      disabled={actionLoading === userItem.user_id}
                                    >
                                      {actionLoading === userItem.user_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserCheck className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{userItem.is_active ? 'Desativar usuário' : 'Ativar usuário'}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200"
                                    onClick={() => setDeleteConfirm(userItem)}
                                    disabled={actionLoading === userItem.user_id}
                                  >
                                    {actionLoading === userItem.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Excluir usuário</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

      <AlertDialog open={!!roleChangeConfirm} onOpenChange={() => setRoleChangeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de função</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar a função de <strong>{roleChangeConfirm?.user.name || roleChangeConfirm?.user.email}</strong> de{' '}
              <strong>{ROLE_LABELS[roleChangeConfirm?.user.role || 'user']}</strong> para{' '}
              <strong>{ROLE_LABELS[roleChangeConfirm?.newRole || 'user']}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleChangeConfirm && handleUserAction(roleChangeConfirm.user.user_id, 'change_role', roleChangeConfirm.newRole)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
