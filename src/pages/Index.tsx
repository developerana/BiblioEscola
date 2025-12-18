import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profiles && profiles.length > 0) {
        navigate('/login');
      } else {
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  };

  const initializeAdmin = async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke('init-admin');

      if (error) throw error;

      toast({
        title: 'Administrador criado!',
        description: 'Agora você pode fazer login com as credenciais de administrador.',
      });

      setIsInitialized(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao inicializar';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
            <Library className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-2xl">BiblioEscola</CardTitle>
            <CardDescription className="mt-1">
              Configuração Inicial do Sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInitialized ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-success" />
              <div>
                <p className="font-medium">Sistema inicializado com sucesso!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Email: <strong>anahelouise.ss@gmail.com</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Senha: <strong>Biblioteca@2024</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login...
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Bem-vindo! Este é o primeiro acesso ao sistema. Clique no botão abaixo para criar o usuário administrador.
              </p>
              <Button
                onClick={initializeAdmin}
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  'Inicializar Sistema'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
