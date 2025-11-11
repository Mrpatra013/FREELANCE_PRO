'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description?: string;
  rate: number;
  rateType: 'HOURLY' | 'FIXED';
  startDate: string | Date;
  deadline?: string | Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  clientId: string;
  createdAt: string | Date;
}

interface ProjectStatsProps {
  projects: Project[];
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  // Calculate project statistics
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');
  const pausedProjects = projects.filter(p => p.status === 'PAUSED');
  
  // Calculate projects due this week
  const today = new Date();
  const endOfWeek = addDays(today, 7);
  const dueThisWeek = projects.filter(p => {
    if (!p.deadline || p.status === 'COMPLETED') return false;
    const deadline = new Date(p.deadline);
    return isAfter(deadline, today) && isBefore(deadline, endOfWeek);
  });
  
  // Calculate overdue projects
  const overdue = projects.filter(p => {
    if (!p.deadline || p.status !== 'ACTIVE') return false;
    return isBefore(new Date(p.deadline), today);
  });
  
  // Calculate total potential earnings
  const totalEarnings = projects.reduce((sum, project) => {
    if (project.status === 'COMPLETED') return sum;
    return sum + project.rate;
  }, 0);
  
  // Get recently updated projects
  const recentlyUpdated = [...projects]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedProjects.length} completed, {pausedProjects.length} paused
            </p>
          </CardContent>
        </Card>
        
        {/* Due This Week Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Due This Week
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueThisWeek.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdue.length} overdue projects
            </p>
          </CardContent>
        </Card>
        
        {/* Potential Earnings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEarnings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            <p className="text-xs text-muted-foreground">
              From {activeProjects.length + pausedProjects.length} active/paused projects
            </p>
          </CardContent>
        </Card>
        
        {/* Recently Updated Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyUpdated.length}</div>
            <p className="text-xs text-muted-foreground">
              Projects updated recently
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
          <CardDescription>
            Overview of your projects by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Active Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ProjectStatusBadge status="ACTIVE" showTooltip={false} />
                  <span className="ml-2 text-sm font-medium">Active</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activeProjects.length} projects ({Math.round((activeProjects.length / projects.length) * 100) || 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(activeProjects.length / projects.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Completed Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ProjectStatusBadge status="COMPLETED" showTooltip={false} />
                  <span className="ml-2 text-sm font-medium">Completed</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedProjects.length} projects ({Math.round((completedProjects.length / projects.length) * 100) || 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(completedProjects.length / projects.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Paused Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ProjectStatusBadge status="PAUSED" showTooltip={false} />
                  <span className="ml-2 text-sm font-medium">Paused</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {pausedProjects.length} projects ({Math.round((pausedProjects.length / projects.length) * 100) || 0}%)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${(pausedProjects.length / projects.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Updated Projects</CardTitle>
          <CardDescription>
            Your most recently updated projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentlyUpdated.length > 0 ? (
              recentlyUpdated.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Updated {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}