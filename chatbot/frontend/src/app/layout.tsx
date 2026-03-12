import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { AuthModalsProvider } from '@/components/auth/auth-modals-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chatbot',
  description: 'AI destekli sohbet uygulaması',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="clay" themes={['light', 'dark', 'clay']}>
          <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex flex-1 overflow-hidden">{children}</main>
          </div>
          <AuthModalsProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
