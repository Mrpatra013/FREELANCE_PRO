'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CalendarIcon, 
  Clock, 
  DollarSign, 
  Edit, 
  FileText, 
  Trash2, 
  User, 
  ArrowLeft,
  Building,
  Mail,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Plus,
  MapPin
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ProjectStatusBadge } from './ProjectStatusBadge';
import { StatusChangeModal } from './StatusChangeModal';
import { ProjectEarnings } from './project-earnings';
import FreelancerDetailsModal from '@/components/modals/FreelancerDetailsModal';
import { downloadBlueInvoicePDF } from '@/lib/new-invoice-template';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  clientId: string;
  rate: number;
  rateType: 'HOURLY' | 'FIXED';
  startDate: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  client: Client;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  description: string | null;
  notes: string | null;
}

interface Invoice {
  id: string;
  projectId: string;
  amount: number;
  status: 'PAID' | 'UNPAID';
  dueDate: string;
  createdAt: string;
}



export function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isFreelancerModalOpen, setIsFreelancerModalOpen] = useState(false);
  const [userBusinessInfo, setUserBusinessInfo] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [invoiceFormData, setInvoiceFormData] = useState({
    amount: '',
    description: '',
    dueDate: '',
    status: 'UNPAID' as 'PAID' | 'UNPAID',
  });

  
  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const projectData = await response.json();
        setProject(projectData);
        
        // Fetch invoices related to this project
        const invoicesResponse = await fetch(`/api/invoices?projectId=${projectId}`);
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
        }
        
        // Fetch next invoice number
        const invoiceCountResponse = await fetch('/api/invoices/count');
        if (invoiceCountResponse.ok) {
          const countData = await invoiceCountResponse.json();
          const count = countData.count;
          setNextInvoiceNumber(`INV-${String(count + 1).padStart(4, '0')}`);
        }
        
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);

  // Fetch user business information
  useEffect(() => {
    const fetchUserBusinessInfo = async () => {
      try {
        const response = await fetch('/api/user/business-info');
        if (response.ok) {
          const businessInfo = await response.json();
          setUserBusinessInfo(businessInfo);
        }
      } catch (error) {
        console.error('Error fetching user business info:', error);
      }
    };

    fetchUserBusinessInfo();
  }, []);
  
  // Handle project deletion
  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      toast.success('Project deleted successfully');
      router.push('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (projectId: string, newStatus: 'ACTIVE' | 'COMPLETED' | 'PAUSED', notes?: string) => {
    if (!project) return;
    
    // Optimistic update
    const previousStatus = project.status;
    setProject({ ...project, status: newStatus });
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          statusNotes: notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project status');
      }
      
      const updatedProject = await response.json();
      setProject(updatedProject);
      
      toast.success(`Project status updated to ${newStatus}`);
    } catch (error) {
      // Revert on error
      setProject({ ...project, status: previousStatus });
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };
  
  // Calculate project statistics
  const calculateStatistics = () => {
    if (!project) return { daysActive: 0, daysLeft: 0, progress: 0, totalInvoiced: 0, netEarnings: 0, estimatedEarnings: 0 };
    
    // Calculate days active
    const startDate = new Date(project.startDate);
    const today = new Date();
    const daysActive = Math.max(0, differenceInDays(today, startDate));
    
    // Calculate days left and progress
    let daysLeft = 0;
    let progress = 0;
    
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      daysLeft = Math.max(0, differenceInDays(deadline, today));
      
      const totalDuration = differenceInDays(deadline, startDate);
      progress = totalDuration > 0 ? Math.min(100, Math.round((daysActive / totalDuration) * 100)) : 100;
    }
    
    // Calculate financial metrics - ensure amounts are numbers
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const paidInvoices = invoices.filter(invoice => invoice.status === 'PAID');
    const netEarnings = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    
    // Calculate estimated earnings based on rate
    let estimatedEarnings = 0;
    if (project.rateType === 'FIXED') {
      estimatedEarnings = project.rate;
    } else if (project.rateType === 'HOURLY') {
      // Assume 8 hours per day for simplicity
      const estimatedHours = daysActive * 8;
      estimatedEarnings = estimatedHours * project.rate;
    }
    
    return { 
      daysActive, 
      daysLeft, 
      progress, 
      totalInvoiced, 
      netEarnings, 
      estimatedEarnings 
    };
  };
  
  // Handle invoice creation - create invoice directly without business info check
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    console.log('handleInvoiceSubmit called');
    e.preventDefault();
    
    if (!invoiceFormData.amount || !invoiceFormData.dueDate) {
      console.log('Validation failed: missing required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    
    console.log('Form validation passed, creating invoice directly...');
    
    // Always create invoice directly without checking business info
    await createInvoiceDirectly();
  };

  // Create invoice directly with existing business info
  const createInvoiceDirectly = async () => {
    console.log('createInvoiceDirectly called');
    setIsGeneratingInvoice(true);
    
    try {
      await fetch('/api/user/sync', { method: 'POST' });
      console.log('Generating invoice data for project:', projectId);
      // First, generate invoice data
      const generateResponse = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId }),
      });

      if (!generateResponse.ok) {
        console.error('Invoice data generation failed:', generateResponse.status);
        toast.error('Failed to generate invoice data');
        return;
      }
      
      const invoiceData = await generateResponse.json();
      console.log('Generated invoice data:', invoiceData);
      
      // Then create the actual invoice in the database
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          amount: parseFloat(invoiceFormData.amount) || 0,
          description: invoiceFormData.description || `Invoice for ${project?.name}`,
          dueDate: new Date(invoiceFormData.dueDate).toISOString(),
          // Use the selected status from the form
          status: invoiceFormData.status,
          freelancerInfo: {
            companyName: userBusinessInfo?.companyName || 'Your Business',
            businessEmail: userBusinessInfo?.businessEmail || 'email@business.com',
            logoUrl: userBusinessInfo?.logoUrl,
          },
        }),
      });

      if (response.ok) {
        const createdInvoice = await response.json();
        
        toast.success('Invoice created successfully');
        setIsInvoiceDialogOpen(false);
        resetInvoiceForm();
        
        // Refresh invoices
        const invoicesResponse = await fetch(`/api/invoices?projectId=${projectId}`);
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('An error occurred while creating the invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Handle freelancer details submission and invoice generation
  const handleFreelancerDetailsSubmit = async (freelancerData: {
    companyName: string;
    businessEmail: string;
    logoUrl?: string;
    saveForFuture: boolean;
  }) => {
    setIsGeneratingInvoice(true);
    
    try {
      await fetch('/api/user/sync', { method: 'POST' });
      // Save freelancer business info if requested
      if (freelancerData.saveForFuture) {
        await fetch('/api/user/business-info', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: freelancerData.companyName,
            businessEmail: freelancerData.businessEmail,
            logoUrl: freelancerData.logoUrl,
            invoiceSettingsComplete: true,
          }),
        });
      }

      // First, generate invoice data
      const generateResponse = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId }),
      });

      if (!generateResponse.ok) {
        console.error('Invoice data generation failed');
        toast.error('Failed to generate invoice data');
        return;
      }
      
      const invoiceData = await generateResponse.json();
      
      // Then create the actual invoice with freelancer details
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          amount: parseFloat(invoiceFormData.amount),
          description: invoiceFormData.description || `Invoice for ${project?.name}`,
          dueDate: new Date(invoiceFormData.dueDate).toISOString(),
          status: invoiceFormData.status,
          freelancerInfo: {
            companyName: freelancerData.companyName,
            businessEmail: freelancerData.businessEmail,
            logoUrl: freelancerData.logoUrl,
          },
        }),
      });

      if (response.ok) {
        const createdInvoice = await response.json();
        
        // Generate and download the blue invoice PDF
        const invoiceDataForPDF = {
          ...invoiceData,
          project: {
            ...invoiceData.project,
            amount: parseFloat(invoiceFormData.amount) || 0,
            description: invoiceFormData.description || `Invoice for ${project?.name}`,
          },
          from: {
            businessName: freelancerData.companyName || 'Your Business',
            businessEmail: freelancerData.businessEmail || 'email@business.com',
            phoneNumber: userBusinessInfo?.phone || 'Phone not provided',
            businessAddress: userBusinessInfo?.address || 'Address not provided',
          },
          payment: {
            accountHolderName: freelancerData.companyName || 'Account Holder',
            bankName: userBusinessInfo?.bankName || 'Bank Name',
            accountNumber: userBusinessInfo?.accountNumber || 'Account Number',
            ifscCode: userBusinessInfo?.ifscCode || 'IFSC Code',
            upiId: userBusinessInfo?.upiId || 'UPI ID',
          },
        };
        
        downloadBlueInvoicePDF(invoiceDataForPDF);
        
        toast.success('Invoice created and downloaded successfully with your business information');
        setIsFreelancerModalOpen(false);
        resetInvoiceForm();
        
        // Refresh invoices
        const invoicesResponse = await fetch(`/api/invoices?projectId=${projectId}`);
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
        }
        
        // Update user business info state if saved
        if (freelancerData.saveForFuture) {
          setUserBusinessInfo({
            companyName: freelancerData.companyName,
            businessEmail: freelancerData.businessEmail,
            logoUrl: freelancerData.logoUrl,
            invoiceSettingsComplete: true,
          });
        }
        
        // Navigate to the invoice detail page
        router.push(`/invoices/${createdInvoice.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('An error occurred while creating the invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };
  
  const resetInvoiceForm = () => {
    console.log('resetInvoiceForm called - New Invoice button clicked');
    setInvoiceFormData({
      amount: '',
      description: '',
      dueDate: '',
      status: 'UNPAID',
    });
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch('/api/invoices/count');
      if (response.ok) {
        const data = await response.json();
        const count = data.count;
        setNextInvoiceNumber(`INV-${String(count + 1).padStart(4, '0')}`);
      }
    } catch (error) {
      console.error('Error fetching invoice count:', error);
    }
  };






  
  const stats = calculateStatistics();
  
  // Check if project is overdue
  const isOverdue = () => {
    if (!project || !project.deadline) return false;
    return isBefore(new Date(project.deadline), new Date()) && project.status !== 'COMPLETED';
  };
  
  if (loading) {
    return <ProjectDetailSkeleton />;
  }
  
  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Project not found or you don&apos;t have access to it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Change Status
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the project and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Project title and status */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2 sm:mt-0">
          <ProjectStatusBadge status={project.status} />
          {isOverdue() && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Project overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {project.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Rate</h3>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {Number(project.rate).toFixed(2)} {project.rateType === 'HOURLY' ? 'per hour' : 'fixed'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(project.startDate), 'dd/MM/yyyy')}
                    {project.deadline && (
                      <> - {format(new Date(project.deadline), 'dd/MM/yyyy')}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress section removed as requested */}
            
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              style={{ marginTop: 'auto', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'stretch' }}
            >
              <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent
                  className="pt-6"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flexGrow: 1 }}
                >
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Days Active</p>
                    <p className="text-2xl font-bold">{stats.daysActive}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent
                  className="pt-6"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flexGrow: 1 }}
                >
                  <div className="text-center">
                    <FileSpreadsheet className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Invoices</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                </CardContent>
              </Card>
              

              
              <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent
                  className="pt-6"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flexGrow: 1 }}
                >
                  <div className="text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Net Earnings</p>
                    <p className="text-2xl font-bold">{Number(stats.netEarnings).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {/* Client information */}
        {project.client && (
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <User className="h-10 w-10 p-2 rounded-full bg-primary/10 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">{project.client.name}</h3>
                  {project.client.company && (
                    <p className="text-sm text-muted-foreground">{project.client.company}</p>
                  )}
                </div>
              </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                <a href={`mailto:${project.client.email}`} className="text-sm hover:underline">
                  {project.client.email}
                </a>
              </div>
              
              {project.client.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                  <a href={`tel:${project.client.phone}`} className="text-sm hover:underline">
                    {project.client.phone}
                  </a>
                </div>
              )}
              
              {project.client.company && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">{project.client.company}</span>
                </div>
              )}
              
              {project.client.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">{project.client.address}</span>
                </div>
              )}
            </div>
            
            {project.client.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">{project.client.description}</p>
                </div>
              </>
            )}
            
            {project.client.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Notes</h3>
                  <p className="text-sm text-muted-foreground">{project.client.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}
      </div>
      
      {/* Tabs for invoices, etc. */}
      <Tabs defaultValue="earnings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="earnings" className="space-y-4">
          <ProjectEarnings projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Manage project invoices and payments</CardDescription>
              </div>
              <div className="flex gap-2">
                  <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => { resetInvoiceForm(); fetchNextInvoiceNumber(); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                        {nextInvoiceNumber && (
                          <div className="bg-muted p-3 rounded-md mb-4">
                            <div className="text-sm font-medium">Invoice Number (auto-generated)</div>
                            <div className="text-lg font-bold">{nextInvoiceNumber}</div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount *</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={invoiceFormData.amount}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={invoiceFormData.description}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                            rows={3}
                            placeholder="Invoice description or notes..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date *</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={invoiceFormData.dueDate}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={invoiceFormData.status}
                            onValueChange={(value: 'PAID' | 'UNPAID') => setInvoiceFormData({ ...invoiceFormData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNPAID">Unpaid</SelectItem>
                              <SelectItem value="PAID">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsInvoiceDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isGeneratingInvoice}>
                            {isGeneratingInvoice ? 'Creating...' : 'Create Invoice'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No invoices yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first invoice for this project to start tracking payments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden">
                      <div className="flex items-center p-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Invoice #{invoice.id.substring(0, 8)}</h3>
                            <Badge 
                              className={invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'}
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                            </div>
                            <div className="font-medium">{Number(invoice.amount).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        

      </Tabs>
      
      {/* Status change modal */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={project.status}
        projectId={project.id}
        projectName={project.name}
        onStatusChange={handleStatusUpdate}
      />
      
      {/* Freelancer details modal */}
      <FreelancerDetailsModal
        isOpen={isFreelancerModalOpen}
        onClose={() => {
          setIsFreelancerModalOpen(false);
          // Reopen invoice dialog if user cancels
          setIsInvoiceDialogOpen(true);
        }}
        onSubmit={handleFreelancerDetailsSubmit}
        initialData={userBusinessInfo}
        isLoading={isGeneratingInvoice}
      />

    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div>
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Skeleton className="h-10 w-full mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}