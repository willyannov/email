'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

export function ThemeProviderClient({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
