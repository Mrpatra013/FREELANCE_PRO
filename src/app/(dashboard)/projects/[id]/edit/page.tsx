'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch project and clients in parallel
        const [projectResponse, clientsResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch('/api/clients')
        ]);
        
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project');
        }
        
        if (!clientsResponse.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const [projectData, clientsData] = await Promise.all([
          projectResponse.json(),
          clientsResponse.json()
        ]);
        
        setProject(projectData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/projects')}>Go to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Project</h1>
        <ProjectForm 
          clients={clients}
          project={project}
          isEditing={true}
          onSubmitSuccess={() => {
            toast.success('Project updated successfully');
            router.push(`/projects/${projectId}`);
          }}
        />
      </div>
    </div>
  );
}