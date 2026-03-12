'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthModalStore } from '@/stores/auth-modal-store';

export function Header() {
  const { user, clearAuth } = useAuthStore();
  const { openLogin, openRegister } = useAuthModalStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-2 flex-1">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Chatbot</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'clay' ? 'light' : 'clay')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.username}</span>
            <Button variant="ghost" size="icon" onClick={clearAuth} aria-label="Çıkış yap">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={openLogin}>
              Giriş Yap
            </Button>
            <Button size="sm" onClick={openRegister}>
              Kayıt Ol
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
