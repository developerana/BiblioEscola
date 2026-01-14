import { Heart, Mail, Instagram, Linkedin, Github } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const socialLinks = [
  { icon: Mail, href: 'mailto:contato@anahelouise.com', label: 'E-mail' },
  { icon: Instagram, href: 'https://instagram.com/', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/in/', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/', label: 'GitHub' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-4">
      <div className="container flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          {socialLinks.map((link) => (
            <Tooltip key={link.label}>
              <TooltipTrigger asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={link.label}
                >
                  <link.icon className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{link.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <p className="flex items-center gap-1.5">
          Desenvolvido com <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> por{' '}
          <span className="font-medium text-foreground">Ana Helouise</span>
        </p>
        <p className="text-xs">
          © {new Date().getFullYear()} Sistema de Biblioteca
        </p>
      </div>
    </footer>
  );
}
