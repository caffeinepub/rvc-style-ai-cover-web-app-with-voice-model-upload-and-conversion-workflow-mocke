import { Link, useRouterState } from '@tanstack/react-router';
import { Music, Upload, History } from 'lucide-react';
import BrandLogo from './BrandLogo';
import LoginButton from './LoginButton';

export default function AppNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { path: '/models', label: 'Voice Models', icon: Music },
    { path: '/create', label: 'Create Cover', icon: Upload },
    { path: '/jobs', label: 'Jobs', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <BrandLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/models');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <LoginButton />
      </div>
      <nav className="md:hidden border-t border-border">
        <div className="container mx-auto px-4 flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/models');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

