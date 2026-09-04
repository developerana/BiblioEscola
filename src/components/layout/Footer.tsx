import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-4">
      <div className="container flex flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          Desenvolvido com <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> por{' '}
          <a
            href="https://www.instagram.com/overlouise/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
          >
            Ana Helouise
          </a>
        </p>
        <p className="text-xs">
          © {new Date().getFullYear()} BiblioEscola
        </p>
      </div>
    </footer>
  );
}
