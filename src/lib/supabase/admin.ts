import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client using the service role key. Bypasses RLS.
 * Use sparingly for administrative operations.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}