import { ProjectDetail } from '@/components/projects/ProjectDetail';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <ProjectDetail projectId={params.id} />
    </div>
  );
}