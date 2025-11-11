import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'

// POST /api/user/sync - Ensure a Prisma user exists for the current Supabase session
export async function POST(_request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = data.user.email

    // Check if local user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Return a minimal safe payload
      const { password: _pw, ...safeUser } = existing as any
      return NextResponse.json({ user: safeUser }, { status: 200 })
    }

    // Create a local user using Supabase metadata
    const name = (data.user.user_metadata as any)?.name || email.split('@')[0]
    const placeholder = await hash(`supabase_${data.user.id}_placeholder`, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: placeholder,
      },
    })

    const { password: _pw2, ...safeCreated } = user as any
    return NextResponse.json({ user: safeCreated }, { status: 201 })
  } catch (err) {
    console.error('User sync error:', err)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}