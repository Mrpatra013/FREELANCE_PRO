'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectCard } from './ProjectCard';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter } from 'lucide-react';
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

interface ProjectListProps {
  projects: Project[];
  clients: Client[];
  onStatusChange: (projectId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED', notes?: string) => void;
}

export function ProjectList({ projects, clients, onStatusChange }: ProjectListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [rateTypeFilter, setRateTypeFilter] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  
  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...projects];
    
    // Filter by status tab
    if (activeTab !== 'all') {
      result = result.filter(project => project.status === activeTab.toUpperCase());
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(query) || 
        project.client.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by client
    if (clientFilter !== 'all') {
      result = result.filter(project => project.client.id === clientFilter);
    }
    
    // Filter by rate type
    if (rateTypeFilter !== 'all') {
      result = result.filter(project => project.rateType === rateTypeFilter.toUpperCase());
    }
    
    setFilteredProjects(result);
  }, [projects, activeTab, searchQuery, clientFilter, rateTypeFilter]);
  
  // Count projects by status for tab indicators
  const projectCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    paused: projects.filter(p => p.status === 'PAUSED').length
  };
  
  // Handle bulk status change
  const handleBulkStatusChange = (newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED') => {
    // In a real app, you would implement this with a confirmation dialog
    // and then call the API to update multiple projects
    toast.info(`Bulk status change to ${newStatus} would be implemented here`);
  };
  
  return (
    <div className="space-y-4">
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
        
        <div className="flex gap-2">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rate Types</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tabs for status filtering */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
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
          
          <div className="flex gap-2">
            {activeTab !== 'all' && filteredProjects.length > 0 && (
              <div className="flex gap-2">
                {activeTab === 'active' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkStatusChange('PAUSED')}
                  >
                    Pause Selected
                  </Button>
                )}
                {activeTab === 'paused' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkStatusChange('ACTIVE')}
                  >
                    Activate Selected
                  </Button>
                )}
                {(activeTab === 'active' || activeTab === 'paused') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkStatusChange('COMPLETED')}
                  >
                    Complete Selected
                  </Button>
                )}
              </div>
            )}
            
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-6">
          {renderProjectGrid(filteredProjects, onStatusChange)}
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          {renderProjectGrid(filteredProjects, onStatusChange)}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {renderProjectGrid(filteredProjects, onStatusChange)}
        </TabsContent>
        
        <TabsContent value="paused" className="mt-6">
          {renderProjectGrid(filteredProjects, onStatusChange)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to render the project grid with empty state
function renderProjectGrid(
  projects: Project[], 
  onStatusChange: (projectId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED', notes?: string) => void
) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Filter className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No projects found</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          No projects match your current filters. Try adjusting your search or filters, or create a new project.
        </p>
        <Button asChild className="mt-4">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}