import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware stub wiring Supabase auth cookies. It does not enforce redirects yet
 * to avoid breaking current flows; use this as a base to add route protection.
 */
export async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Enforce auth for matched routes
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    // Preserve original destination to return after login
    loginUrl.searchParams.set('redirectTo', url.pathname + url.search)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

// Limit to dashboard-like routes to keep overhead low
export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/clients/:path*', '/invoices/:path*', '/settings/:path*'],
}