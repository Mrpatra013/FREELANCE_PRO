import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { profileSchema } from '@/lib/validations'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: {
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parseResult = profileSchema.safeParse(body)
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 })
    }

    const { name } = parseResult.data

    const updated = await prisma.user.update({
      where: { email: data.user.email },
      data: {
        name,
      },
      select: {
        name: true,
        email: true,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}