import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ClientForm } from '@/components/clients/ClientForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Edit Client | FreelancePro',
  description: 'Edit client information',
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/login');
  }

  const client = await prisma.client.findFirst({
    where: {
      id: id,
      userId: user.id,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${client.id}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">
            Update {client.name}&apos;s information
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <ClientForm client={client} />
      </div>
    </div>
  );
}