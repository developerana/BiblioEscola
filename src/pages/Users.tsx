import React, { useState, useEffect } from 'react';
import { UserPlus, Users as UsersIcon, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  role?: 'admin' | 'user';
}

const DEFAULT_PASSWORD = 'Biblioteca@2024';

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '' });
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

    // Fetch roles for each user
    const usersWithRoles = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .single();
        
        return {
          ...profile,
          role: roleData?.role as 'admin' | 'user' || 'user',
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
          password: DEFAULT_PASSWORD,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Usuário cadastrado',
        description: `${formData.email} foi cadastrado com a senha padrão.`,
      });

      setFormData({ email: '', name: '' });
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
                    O usuário receberá acesso com a senha padrão: {DEFAULT_PASSWORD}
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
                    <TableHead>Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        {userItem.name || '-'}
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
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
            <p>• A senha padrão para novos usuários é: <strong>{DEFAULT_PASSWORD}</strong></p>
            <p>• Os usuários devem alterar a senha após o primeiro login.</p>
            <p>• Apenas administradores podem cadastrar novos usuários.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
