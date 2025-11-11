'use client';

import { useEffect, useState } from 'react';
import { ProjectDetail } from '@/components/projects/ProjectDetail';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  if (!projectId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <ProjectDetail projectId={projectId} />
    </div>
  );
}