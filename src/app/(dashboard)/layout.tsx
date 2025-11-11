import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { DashboardNav } from '../../components/dashboard-nav';
import { Toaster } from '@/components/ui/toaster';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
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