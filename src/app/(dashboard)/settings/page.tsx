import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { BusinessInfoSection } from '@/components/settings/BusinessInfoSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Settings | FreelancePro',
  description: 'Manage your account and business settings',
};

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({ 
    where: { email: data.user.email },
    select: { name: true, email: true },
  });
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and business information
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* Business Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Manage your company details for professional invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessInfoSection />
          </CardContent>
        </Card>
        
        {/* Account Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your personal account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}