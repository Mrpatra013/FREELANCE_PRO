import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, reachable: true, sampleUserCount: data?.users?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}