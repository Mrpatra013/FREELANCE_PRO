'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign, Calendar, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import PDFGenerator from '@/components/pdf/PDFGenerator';
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
  rate?: number;
  client: Client;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  description?: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  project: Project;
  createdAt: string;
  freelancerCompanyName?: string;
  freelancerBusinessEmail?: string;
  freelancerLogoUrl?: string;
}

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    projectId: '',
    amount: '',
    description: '',
    dueDate: '',
    status: 'UNPAID' as 'PAID' | 'UNPAID',
  });
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userBusinessInfo, setUserBusinessInfo] = useState<{
    companyName?: string;
    businessEmail?: string;
    logoUrl?: string;
    invoiceSettingsComplete?: boolean;
  } | null>(null);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchInvoices();
      fetchProjects();
      fetchUserBusinessInfo();
      fetchNextInvoiceNumber();
    }
  }, [status, session]);
  
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

  const fetchUserBusinessInfo = async () => {
    try {
      const response = await fetch('/api/user/business-info');
      if (response.ok) {
        const data = await response.json();
        setUserBusinessInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user business info:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';
      
      // Prepare request body
      const requestBody: any = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      // Include business information for new invoices if available
      if (!editingInvoice && userBusinessInfo && userBusinessInfo.invoiceSettingsComplete) {
        requestBody.freelancerInfo = {
          companyName: userBusinessInfo.companyName,
          businessEmail: userBusinessInfo.businessEmail,
          logoUrl: userBusinessInfo.logoUrl,
        };
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success(editingInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
        setIsDialogOpen(false);
        setEditingInvoice(null);
        resetForm();
        fetchInvoices();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save invoice');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      projectId: invoice.project.id,
      amount: invoice.amount.toString(),
      description: invoice.description || '',
      dueDate: invoice.dueDate.split('T')[0],
      status: invoice.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteInvoiceId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteInvoiceId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/invoices/${deleteInvoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete invoice');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteInvoiceId(null);
    }
  };

  const prepareInvoiceData = async (invoice: Invoice) => {
    // Fetch user business info for the invoice
    const userResponse = await fetch('/api/user/business-info');
    const userData = await userResponse.json();
    
    // Prepare the invoice data for PDF generation
    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
      status: invoice.status,
      amount: Number(invoice.amount),
      from: {
        businessName: invoice.freelancerCompanyName || userData?.companyName || 'Your Business',
        phoneNumber: userData?.phoneNumber || '',
        businessAddress: userData?.businessAddress || '',
        businessEmail: invoice.freelancerBusinessEmail || userData?.businessEmail || ''
      },
      to: {
        clientName: invoice.project?.client?.name || 'Unknown Client',
        clientEmail: invoice.project?.client?.email || '',
        clientCompany: invoice.project?.client?.company || undefined
      },
      project: {
        name: invoice.project?.name || 'Unknown Project',
        description: invoice.description || '',
        rate: Number(invoice.project?.rate) || 0,
        amount: Number(invoice.amount) || 0
      },
      payment: {
        bankName: userData?.bankName || '',
        accountNumber: userData?.accountNumber || '',
        accountHolderName: userData?.accountHolderName || userData?.name || '',
        ifscCode: userData?.ifscCode || '',
        upiId: userData?.upiId || ''
      },
      items: [{
        description: invoice.description || invoice.project?.name || 'Project work',
        hours: 1,
        rate: Number(invoice.amount),
        total: Number(invoice.amount)
      }],
      subtotal: Number(invoice.amount),
      taxRate: 0,
      taxAmount: 0,
      paymentTerms: ''
    };
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const invoiceData = await prepareInvoiceData(invoice);
      setSelectedInvoiceData(invoiceData);
      
      // Open the PDF generation dialog
      setShowPDFDialog(true);
      toast.success('Preparing PDF for download...');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Error preparing PDF data');
    }
  };

  const handlePreviewPDF = async (invoice: Invoice) => {
    try {
      const invoiceData = await prepareInvoiceData(invoice);
      setSelectedInvoiceData(invoiceData);
      
      // Open the PDF generation dialog with preview mode
      setShowPDFDialog(true);
      toast.success('Preparing PDF preview...');
    } catch (error) {
      console.error('Error preparing invoice data for preview:', error);
      toast.error('Error preparing invoice data');
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      amount: '',
      description: '',
      dueDate: '',
      status: 'UNPAID',
    });
    setEditingInvoice(null);
    fetchNextInvoiceNumber();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading invoices...</div>
        </div>

        {/* PDF Generator Dialog */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Invoice PDF</DialogTitle>
            </DialogHeader>
            {selectedInvoiceData && (
              <PDFGenerator 
                invoiceData={selectedInvoiceData} 
                onDownloadComplete={() => {
                  toast.success('PDF downloaded successfully');
                  setShowPDFDialog(false);
                }}
                onError={(error) => {
                  console.error('PDF generation error:', error);
                  toast.error('Error generating PDF');
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {nextInvoiceNumber && (
                <div className="bg-muted p-3 rounded-md mb-4">
                  <div className="text-sm font-medium">Invoice Number (auto-generated)</div>
                  <div className="text-lg font-bold">{nextInvoiceNumber}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Invoice description or notes..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'PAID' | 'UNPAID') => setFormData({ ...formData, status: value })}
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
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingInvoice ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{invoice.project.name}</div>
                        {invoice.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {invoice.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.project.client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {formatCurrency(invoice.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {formatDate(invoice.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPDF(invoice)}
                          title="Preview PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteInvoiceId !== null}
        onClose={() => setDeleteInvoiceId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        isLoading={isDeleting}
      />

      {/* PDF Generator Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice PDF</DialogTitle>
          </DialogHeader>
          {selectedInvoiceData && (
            <PDFGenerator 
              invoiceData={selectedInvoiceData} 
              onDownloadComplete={() => {
                toast.success('PDF downloaded successfully');
                setShowPDFDialog(false);
              }}
              onError={(error) => {
                console.error('PDF generation error:', error);
                toast.error('Error generating PDF');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}