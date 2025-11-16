import { Metadata } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Profile Settings | FreelancePro',
  description: 'Manage your personal profile information',
}

export default async function ProfileSettingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: data.user.email },
    select: {
      name: true,
      email: true,
      // limit to safe fields available in current client types
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal profile information</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal details and photo</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm initialData={user} />
        </CardContent>
      </Card>
    </div>
  )
}