'use client'

import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Supabase does not require a global provider for session in App Router.
  // Cookies are managed via middleware and the SSR helpers.
  return children as any
}