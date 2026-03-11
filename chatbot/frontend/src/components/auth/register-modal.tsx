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
import { register as registerApi } from '@/lib/api/auth';

const schema = z.object({
  username: z.string().min(3, 'En az 3 karakter').max(50, 'En fazla 50 karakter'),
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(6, 'En az 6 karakter'),
});

type FormData = z.infer<typeof schema>;

export function RegisterModal() {
  const { modal, closeModal, openLogin } = useAuthModalStore();
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
      const res = await registerApi(data);
      setAuth(res.user, res.token);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Kayıt başarısız');
    }
  };

  return (
    <Dialog open={modal === 'register'} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Hesap Oluştur</DialogTitle>
          <DialogDescription>
            Sohbet geçmişini kaydetmek için hesap oluştur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-username">Kullanıcı Adı</Label>
            <Input
              id="reg-username"
              placeholder="kullanici_adi"
              autoComplete="username"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="ornek@mail.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Şifre</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
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
            {isSubmitting ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{' '}
            <button
              type="button"
              onClick={() => {
                reset();
                setServerError('');
                openLogin();
              }}
              className="text-primary hover:underline font-medium"
            >
              Giriş yap
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
