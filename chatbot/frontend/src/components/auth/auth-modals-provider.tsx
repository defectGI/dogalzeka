'use client';

import { LoginModal } from './login-modal';
import { RegisterModal } from './register-modal';

export function AuthModalsProvider() {
  return (
    <>
      <LoginModal />
      <RegisterModal />
    </>
  );
}
