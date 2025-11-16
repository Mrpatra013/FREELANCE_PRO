import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data
}

export async function getCurrentUser() {
  const session = await getSession()
  const email = session?.user?.email
  if (!email) return null

  // Map Supabase user to local Prisma user record
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: { id: true, name: true, email: true },
  })
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}