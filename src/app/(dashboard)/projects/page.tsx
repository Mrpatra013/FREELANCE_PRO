'use client';

import { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Clock, AlertTriangle, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/clients/DeleteConfirmationModal';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [rateTypeFilter, setRateTypeFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const deferredSearch = useDeferredValue(searchQuery);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: '',
    rateType: 'HOURLY' as 'HOURLY' | 'FIXED',
    startDate: '',
    deadline: '',
    clientId: '',
  });
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects and clients data
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...projects];

    if (activeTab !== 'all') {
      result = result.filter(project => project.status === activeTab.toUpperCase());
    }

    if (deferredSearch) {
      const query = deferredSearch.toLowerCase();
      result = result.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.client.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }

    if (clientFilter !== 'all') {
      result = result.filter(project => project.client.id === clientFilter);
    }

    if (rateTypeFilter !== 'all') {
      result = result.filter(project => project.rateType === rateTypeFilter.toUpperCase());
    }

    setFilteredProjects(result);
  }, [projects, activeTab, deferredSearch, clientFilter, rateTypeFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    const controller = new AbortController();
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        fetch('/api/projects', { signal: controller.signal }),
        fetch('/api/clients', { signal: controller.signal })
      ]);

      if (!projectsRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [projectsData, clientsData] = await Promise.all([
        projectsRes.json(),
        clientsRes.json()
      ]);

      setProjects(projectsData);
      setClients(clientsData);
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Error fetching data:', error);
      toast.error('Failed to load projects data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rate: parseFloat(formData.rate),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${editingProject ? 'update' : 'create'} project`);
      }
      
      toast.success(`Project ${editingProject ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      setEditingProject(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(`Failed to ${editingProject ? 'update' : 'create'} project`);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      rate: project.rate.toString(),
      rateType: project.rateType,
      startDate: format(new Date(project.startDate), 'yyyy-MM-dd'),
      deadline: project.deadline ? format(new Date(project.deadline), 'yyyy-MM-dd') : '',
      clientId: project.clientId,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (projectId: string) => {
    setDeleteProjectId(projectId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProjectId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteProjectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      toast.success('Project deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteProjectId(null);
    }
  };

  const handleDelete = (projectId: string) => {
    handleDeleteClick(projectId);
  };

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
      
      toast.success('Project status updated successfully');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
      
      // Revert to original state on error
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rate: '',
      rateType: 'HOURLY',
      startDate: '',
      deadline: '',
      clientId: '',
    });
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Memoized computations must run every render to keep hook order stable
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [projects]);

  const projectCounts = useMemo(() => ({
    all: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    paused: projects.filter(p => p.status === 'PAUSED').length
  }), [projects]);

  // Calculate project statistics
  const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
  const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
  const pausedCount = projects.filter(p => p.status === 'PAUSED').length;
  
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
  
  // Early return for loading state, after hooks above have run
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your projects and track their progress
            </p>
          </div>
        </div>
        <ProjectsSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track their progress
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateType">Rate Type</Label>
                  <Select
                    value={formData.rateType}
                    onValueChange={(value: 'HOURLY' | 'FIXED') => setFormData({ ...formData, rateType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? 'Update' : 'Create'} Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Separator */}
      <div className="border-t border-gray-200"></div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={rateTypeFilter} onValueChange={setRateTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Rate type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project tabs and list */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({projectCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({projectCounts.active})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({projectCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({projectCounts.paused})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || clientFilter !== 'all' || rateTypeFilter !== 'all'
                  ? 'No projects match your current filters.'
                  : 'No projects found. Create your first project to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DeleteConfirmationModal
        isOpen={deleteProjectId !== null}
        onClose={() => setDeleteProjectId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}

// Skeleton loader for the projects page
function ProjectsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-[120px] w-full" />
        ))}
      </div>
      
      {/* Recent projects skeleton */}
      <Skeleton className="h-[200px] w-full" />
      
      {/* Search and filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-grow" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-[400px]" />
      
      {/* Project list skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={`project-${i}`} className="h-[250px] w-full" />
        ))}
      </div>
    </div>
  );
}