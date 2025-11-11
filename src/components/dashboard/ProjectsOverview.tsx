'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import Link from 'next/link';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

interface Project {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  startDate: string;
  deadline: string | null;
  client: {
    id: string;
    name: string;
  };
}

interface ProjectsOverviewProps {
  projects: Project[];
  activeCount: number;
  completedCount: number;
}

export function ProjectsOverview({ projects, activeCount, completedCount }: ProjectsOverviewProps) {
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
  
  // Get recently updated projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);
  
  return (
    <div className="space-y-4">
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
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between rounded-md border px-3 py-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium truncate">{project.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProjectStatusBadge status={project.status} />
                    {project.deadline && isBefore(new Date(project.deadline), today) && project.status === 'ACTIVE' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/projects" className="w-full">
            <Button variant="outline" className="w-full">
              View All Projects
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}