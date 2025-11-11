import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Server Component / Server Action client.
 * Only reads cookies; sufficient for data fetching with existing sessions.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

/**
 * Route Handler client with full cookie management for auth flows.
 * Use inside app/api route handlers.
 */
export function createSupabaseRouteHandlerClient(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: Parameters<NextResponse['cookies']['set']>[2]) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: Parameters<NextResponse['cookies']['set']>[2]) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })
}