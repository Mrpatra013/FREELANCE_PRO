'use client';

import { ReactNode, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    // Check for initial session and handle errors if any
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth session error:', error.message);
          if (
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('Invalid Refresh Token')
          ) {
            // Clear any invalid session data
            await supabase.auth.signOut();
            router.refresh();
            // Only redirect if we are not already on the login page (to avoid loops)
            if (!window.location.pathname.includes('/login')) {
              router.push('/login');
            }
          }
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh failure
      // Cast event to string to avoid type overlap error with 'TOKEN_REFRESH_REVOKED'
      if ((event as string) === 'TOKEN_REFRESH_REVOKED') {
        console.warn('Token refresh revoked. Signing out.');
        await supabase.auth.signOut();
        router.refresh();
        if (!window.location.pathname.includes('/login')) {
          router.push('/login');
        }
      }

      // If signed out, ensure we update state/UI
      if (event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return <>{children}</>;
}
