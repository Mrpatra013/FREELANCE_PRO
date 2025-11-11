'use client';

import { format, isAfter, isBefore } from 'date-fns';
import { CalendarIcon, Clock, DollarSign, Edit, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { StatusChangeModal } from './StatusChangeModal';
import { useState } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  rate: number;
  rateType: 'HOURLY' | 'FIXED';
  startDate: string | Date;
  deadline?: string | Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  client: Client;
  clientId: string;
  createdAt: string | Date;
}

interface ProjectCardProps {
  project: Project;
  onStatusChange?: (projectId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED') => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onStatusChange, onEdit, onDelete }: ProjectCardProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Format dates for display
  const formattedStartDate = typeof project.startDate === 'string' 
    ? format(new Date(project.startDate), 'MMM d, yyyy')
    : format(project.startDate, 'MMM d, yyyy');
  
  const formattedDeadline = project.deadline 
    ? (typeof project.deadline === 'string' 
      ? format(new Date(project.deadline), 'MMM d, yyyy')
      : format(project.deadline, 'MMM d, yyyy'))
    : 'No deadline';
  
  // Check if project is overdue
  const isOverdue = project.deadline && project.status === 'ACTIVE' && 
    isBefore(new Date(project.deadline), new Date());
  
  // Calculate progress based on dates
  const calculateProgress = () => {
    if (!project.deadline || project.status === 'COMPLETED') return 100;
    if (project.status === 'PAUSED') return 50;
    
    const start = new Date(project.startDate);
    const end = new Date(project.deadline);
    const today = new Date();
    
    if (isBefore(today, start)) return 0;
    if (isAfter(today, end)) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = today.getTime() - start.getTime();
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };
  
  const progress = calculateProgress();
  
  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Link href={`/projects/${project.id}`} className="hover:underline">
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </Link>
            <ProjectStatusBadge status={project.status} />
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{project.client.name}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {Number(project.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {project.rateType === 'HOURLY' ? '/hr' : ' total'}
              </span>
            </div>
            
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                {isOverdue ? 'Overdue: ' : 'Due: '}{formattedDeadline}
              </span>
            </div>
            
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Started: {formattedStartDate}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`} 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-right mt-1 text-muted-foreground">
                {progress}% complete
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsStatusModalOpen(true)}
          >
            Change Status
          </Button>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onEdit(project)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Link href={`/projects/${project.id}`}>
              <Button size="sm" variant="default">
                Details
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {onStatusChange && (
        <StatusChangeModal 
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          currentStatus={project.status}
          projectId={project.id}
          projectName={project.name}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
}