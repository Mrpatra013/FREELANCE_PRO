import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardNav } from '../../components/dashboard-nav';
import { Toaster } from '@/components/ui/toaster';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }
  const user = await getCurrentUser();
  if (!user) {
    redirect('/register');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={user} />
      <main className="flex-1 container mx-auto py-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
}