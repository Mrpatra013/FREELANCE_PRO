import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if local user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check current Supabase session and reuse if matches the registration email
    const supabase = await getSupabaseServerClient()
    const { data: supaSession } = await supabase.auth.getUser()

    let supabaseId: string | undefined = undefined
    let supabaseError: string | undefined = undefined
    const currentUser = supaSession?.user
    if (currentUser && currentUser.email === email) {
      supabaseId = currentUser.id
    } else {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY

      if (hasService) {
        const admin = getSupabaseAdminClient()
        const { data: created, error: adminError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        })

        if (adminError) {
          const msg = adminError.message.toLowerCase()
          if (!(msg.includes('already') && msg.includes('register'))) {
            supabaseError = `Supabase error: ${adminError.message}`
          }
        } else {
          supabaseId = created?.user?.id
        }
      } else if (url && anon) {
        const publicClient = createClient(url, anon, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const { data: created, error: createError } = await publicClient.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })

        if (createError) {
          const msg = createError.message.toLowerCase()
          if (!(msg.includes('already') && msg.includes('register'))) {
            supabaseError = `Supabase error: ${createError.message}`
          }
        } else {
          supabaseId = created?.user?.id
        }
      } else {
        supabaseError = 'Supabase not configured (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      }
    }

    // Hash password for local record (not used for auth post-migration)
    const hashedPassword = await hash(password, 10)

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true }
    })

    return NextResponse.json({ user, supabaseId, supabaseError }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}