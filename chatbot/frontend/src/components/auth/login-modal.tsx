'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthModalStore } from '@/stores/auth-modal-store';
import { useAuthStore } from '@/stores/auth-store';
import { login } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(6, 'En az 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export function LoginModal() {
  const { modal, closeModal, openRegister } = useAuthModalStore();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onClose = () => {
    reset();
    setServerError('');
    closeModal();
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await login(data);
      setAuth(res.user, res.token);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Giriş başarısız');
    }
  };

  return (
    <Dialog open={modal === 'login'} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Giriş Yap</DialogTitle>
          <DialogDescription>Hesabına giriş yaparak sohbet geçmişine ulaş.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="ornek@mail.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Şifre</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Hesabın yok mu?{' '}
            <button
              type="button"
              onClick={() => {
                reset();
                setServerError('');
                openRegister();
              }}
              className="text-primary hover:underline font-medium"
            >
              Kayıt ol
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
