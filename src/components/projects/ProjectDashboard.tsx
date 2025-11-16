'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProjectStats } from './ProjectStats';
import { ProjectList } from './ProjectList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { toast } from 'sonner';

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

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch projects and clients data
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          fetch('/api/projects', { signal: controller.signal }),
          fetch('/api/clients', { signal: controller.signal }),
        ]);

        if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
        if (!clientsResponse.ok) throw new Error('Failed to fetch clients');

        const [projectsData, clientsData] = await Promise.all([
          projectsResponse.json(),
          clientsResponse.json(),
        ]);

        setProjects(projectsData);
        setClients(clientsData);
      } catch (error: any) {
        if (controller.signal.aborted) return;
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);
  
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [projects]);

  // Handle project status change
  const handleStatusChange = async (projectId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED', notes?: string) => {
    try {
      // Optimistic update
      const updatedProjects = projects.map(project => 
        project.id === projectId ? { ...project, status: newStatus } : project
      );
      setProjects(updatedProjects);
      
      // Call API to update status
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, statusNotes: notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project status');
      }
      
      // No need to update state again as we already did it optimistically
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
      
      // Revert to original state on error
      const originalProjects = await fetch('/api/projects').then(res => res.json());
      setProjects(originalProjects);
    }
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  // Calculate project statistics
  const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
  const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
  
  // Get projects due this week
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const dueThisWeek = projects.filter(project => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    return isAfter(deadline, today) && isBefore(deadline, nextWeek) && project.status === 'ACTIVE';
  });
  
  // Get overdue projects
  const overdue = projects.filter(project => {
    if (!project.deadline) return false;
    const deadline = new Date(project.deadline);
    return isBefore(deadline, today) && project.status === 'ACTIVE';
  });
  
  

  return (
    <div className="space-y-8">
      {/* Project Overview Statistics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully delivered projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueThisWeek.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects with upcoming deadlines
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdue.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects past their deadline
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently created projects</CardDescription>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No projects found. Create your first project to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{project.client.name}</div>
                    <div className="flex items-center space-x-2">
                      <ProjectStatusBadge status={project.status} />
                      {project.deadline && isBefore(new Date(project.deadline), today) && project.status === 'ACTIVE' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    {project.deadline ? (
                      <div className="flex items-center justify-end text-muted-foreground">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Started {format(new Date(project.startDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ProjectStats projects={projects} />
      <ProjectList 
        projects={projects} 
        clients={clients} 
        onStatusChange={handleStatusChange} 
      />
    </div>
  );
}

// Skeleton loader for the dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-[120px] w-full" />
        ))}
      </div>
      
      {/* Status distribution skeleton */}
      <Skeleton className="h-[200px] w-full" />
      
      {/* Project list skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={`project-${i}`} className="h-[250px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}