import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, User, Mail, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user, role, mustChangePassword, clearMustChangePassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      // Update the must_change_password flag in the database
      if (user) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('user_id', user.id);
        
        // Clear the local state
        clearMustChangePassword();
      }

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      });

      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Ocorreu um erro ao alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'bibliotecario': return 'Bibliotecário';
      case 'user': return 'Usuário';
      default: return 'Usuário';
    }
  };

  return (
    <MainLayout>
      <PageHeader 
        title="Configurações" 
        description="Gerencie suas configurações de conta"
      />

      {mustChangePassword && (
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Primeiro acesso detectado!</strong> Por segurança, você deve alterar sua senha temporária antes de continuar usando o sistema.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <User className="h-5 w-5 text-primary" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Suas informações de usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Usuário</p>
                <p className="font-medium">{getRoleLabel(role)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <KeyRound className="h-5 w-5 text-primary" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite a nova senha"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
