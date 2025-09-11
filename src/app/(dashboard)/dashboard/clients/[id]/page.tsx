import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ChevronLeft, Mail, Phone, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { Prisma } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Client Details | FreelancePro',
  description: 'View client details and related projects',
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

type ClientWithProjects = Prisma.ClientGetPayload<{
  include: {
    projects: true;
  };
}>;

export default async function ClientDetailPage({ params }: Props) {
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

  const client: ClientWithProjects | null = await prisma.client.findFirst({
    where: {
      id: id,
      userId: user.id,
    },
    include: {
      projects: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">
              Client details and related projects
            </p>
          </div>
        </div>
        <Link href={`/clients/${client.id}/edit`}>
          <Button>Edit Client</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${client.email}`}
                className="hover:underline"
              >
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${client.phone}`}
                  className="hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{client.company}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-2">
                <ScrollText className="h-4 w-4 text-muted-foreground" />
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No projects found for this client.
                </p>
                <Link href={`/projects/new?client=${client.id}`}>
                  <Button className="mt-4" variant="outline">
                    Create New Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block"
                  >
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Status: {project.status.toLowerCase()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}