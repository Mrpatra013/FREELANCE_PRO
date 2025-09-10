'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  client: {
    name: string;
  };
}

interface InvoiceCreationModalProps {
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextInvoiceNumber?: string;
}

const InvoiceCreationModal = ({
  projects,
  open,
  onOpenChange,
  nextInvoiceNumber,
}: InvoiceCreationModalProps) => {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');
  const [isCreating, setIsCreating] = useState(false);

  const createInvoice = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    setIsCreating(true);
    try {
      // First, generate invoice data
      const generateResponse = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      });

      if (!generateResponse.ok) {
        console.error('Invoice data generation failed');
        toast.error('Failed to generate invoice data');
        return;
      }
      
      const invoiceData = await generateResponse.json();
      
      // Then create the actual invoice in the database
      console.log('Creating invoice with status:', selectedStatus);
      
      const invoicePayload = {
        projectId: selectedProject,
        amount: invoiceData.project.amount,
        description: `Invoice for ${invoiceData.project.name}`,
        dueDate: invoiceData.dueDate,
        status: selectedStatus,
        freelancerInfo: {
          companyName: invoiceData.from.businessName,
          businessEmail: invoiceData.from.businessEmail
        }
      };
      
      console.log('Invoice payload:', invoicePayload);
      
      const createResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload),
      });

      if (createResponse.ok) {
        const invoice = await createResponse.json();
        toast.success('Invoice created successfully');
        onOpenChange(false);
        // Use router.push with { forceRefresh: true } to ensure page reloads with new data
        setTimeout(() => {
          router.push(`/invoices/${invoice.id}`);
        }, 100);
      } else {
        const errorData = await createResponse.json();
        toast.error(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation failed:', error);
      toast.error('An error occurred while creating the invoice');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        
        {nextInvoiceNumber && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <div className="text-sm font-medium">Invoice Number (auto-generated)</div>
            <div className="text-lg font-bold">{nextInvoiceNumber}</div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-4">
          <div>
            <Label htmlFor="project">Select Project</Label>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.client.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
              <Label htmlFor="status">Invoice Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: 'PAID' | 'UNPAID') => setSelectedStatus(value)}
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
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createInvoice}
              disabled={!selectedProject || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceCreationModal;