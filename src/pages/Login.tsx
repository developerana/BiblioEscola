import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Eye, EyeOff, LogIn, BookOpen, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha email e senha.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        let message = 'Erro ao fazer login. Tente novamente.';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email ou senha inválidos.';
        }
        toast({
          title: 'Erro de autenticação',
          description: message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        });
        navigate('/dashboard');
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-primary relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-accent blur-3xl" />
        </div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bookPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect x="10" y="10" width="30" height="40" rx="2" fill="currentColor" />
                <rect x="45" y="15" width="25" height="35" rx="2" fill="currentColor" />
                <rect x="20" y="55" width="35" height="35" rx="2" fill="currentColor" />
                <rect x="60" y="60" width="28" height="30" rx="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bookPattern)" className="text-primary-foreground" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-primary-foreground">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">BiblioEscola</h1>
              <p className="text-sm text-primary-foreground/70">Sistema de Gestão</p>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
                Gerencie sua biblioteca escolar com facilidade
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-md">
                Controle de empréstimos, devoluções e acervo em uma plataforma intuitiva e moderna.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">Catálogo Digital</h3>
                  <p className="text-sm text-primary-foreground/70">Organize todo seu acervo</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">Gestão de Alunos</h3>
                  <p className="text-sm text-primary-foreground/70">Controle de empréstimos por aluno</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">Alertas Automáticos</h3>
                  <p className="text-sm text-primary-foreground/70">Notificações de devoluções pendentes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-primary-foreground/60">
            © 2024 BiblioEscola • Profª Laís Peralta Carneiro
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20 bg-background">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg">
              <Library className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">BiblioEscola</h1>
            <p className="text-sm text-muted-foreground">Profª Laís Peralta Carneiro</p>
          </div>

          {/* Form Header */}
          <div className="mb-8 lg:mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Digite suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 px-4 pr-12 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all duration-200 font-medium text-base gap-2 shadow-lg hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar no Sistema
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Problemas para acessar? Entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
