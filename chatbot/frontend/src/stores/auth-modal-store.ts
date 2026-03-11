import { create } from 'zustand';

type ModalType = 'login' | 'register' | null;

interface AuthModalState {
  modal: ModalType;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  modal: null,
  openLogin: () => set({ modal: 'login' }),
  openRegister: () => set({ modal: 'register' }),
  closeModal: () => set({ modal: null }),
}));
