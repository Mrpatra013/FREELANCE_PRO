'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import PDFGenerator from '@/components/pdf/PDFGenerator';
import { Printer, Download, Edit, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface InvoiceDetailPageProps {
  params: { id: string };
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  description?: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID';
  createdAt: string;
  project: {
    id: string;
    name: string;
    description?: string;
    rate?: number;
    client: {
      id: string;
      name: string;
      email: string;
      company?: string;
    };
  };
  freelancerCompanyName?: string;
  freelancerBusinessEmail?: string;
  freelancerLogoUrl?: string;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [formattedInvoiceData, setFormattedInvoiceData] = useState<any>(null);
  const [userBusinessInfo, setUserBusinessInfo] = useState<any>(null);
  const invoiceId = params.id;

  useEffect(() => {
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          router.push('/login');
          return;
        }
        await fetchInvoice();
        await fetchUserBusinessInfo();
      } catch (e) {
        console.error('Auth check failed:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  const fetchUserBusinessInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/user/business-info');
      if (response.ok) {
        const data = await response.json();
        setUserBusinessInfo(data);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  }, []);

  // Fetch handled after Supabase auth check above

  const prepareInvoiceData = async () => {
    if (!invoice || !userBusinessInfo) return null;
    
    // Prepare the invoice data for PDF generation
    const data = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
      status: invoice.status,
      amount: Number(invoice.amount),
      from: {
        businessName: invoice.freelancerCompanyName || userBusinessInfo?.companyName || 'Your Business',
        phoneNumber: userBusinessInfo?.phoneNumber || userBusinessInfo?.phone || '',
        businessAddress: userBusinessInfo?.businessAddress || userBusinessInfo?.address || '',
        businessEmail: invoice.freelancerBusinessEmail || userBusinessInfo?.businessEmail || userBusinessInfo?.email || ''
      },
      to: {
        clientName: invoice.project?.client?.name || 'Unknown Client',
        clientEmail: invoice.project?.client?.email || '',
        clientPhone: invoice.project?.client?.phone || '',
        clientAddress: invoice.project?.client?.address || ''
      },
      project: {
        name: invoice.project?.name || 'Unknown Project',
        description: invoice.description || '',
        rate: Number(invoice.project?.rate) || 0,
        amount: Number(invoice.amount) || 0
      },
      payment: {
        bankName: userBusinessInfo?.bankName || '',
        accountNumber: userBusinessInfo?.accountNumber || '',
        accountHolderName: userBusinessInfo?.accountHolderName || userBusinessInfo?.name || '',
        ifscCode: userBusinessInfo?.ifscCode || '',
        upiId: userBusinessInfo?.upiId || ''
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
    
    setFormattedInvoiceData(data);
    return data;
  };

  const handleDownloadPDF = async () => {
    try {
      const invoiceData = await prepareInvoiceData();
      if (!invoiceData) {
        toast.error('Failed to prepare invoice data');
        return;
      }
      
      // Use the new blue template
      const { downloadBlueInvoicePDF } = await import('@/lib/new-invoice-template');
      await downloadBlueInvoicePDF(invoiceData);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrint = async () => {
    try {
      const invoiceData = await prepareInvoiceData();
      if (!invoiceData) {
        toast.error('Failed to prepare invoice data');
        return;
      }
      const { getBlueInvoicePDFDataURL } = await import('@/lib/new-invoice-template');
      const url = await getBlueInvoicePDFDataURL(invoiceData);
      const win = window.open('', '_blank');
      if (win) {
        win.location.href = url;
      } else {
        toast.error('Please allow pop-ups to preview PDF');
      }
    } catch (error) {
      console.error('Error preparing for print:', error);
      toast.error('Failed to prepare for printing');
    }
  };

  const handleUpdateStatus = async (newStatus: 'PAID' | 'UNPAID') => {
    if (!invoice) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: invoice.project.id,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          status: newStatus,
          description: invoice.description
        }),
      });

      if (response.ok) {
        toast.success(`Invoice marked as ${newStatus}`);
        fetchInvoice(); // Refresh the invoice data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to update invoice status`);
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('An error occurred while updating status');
    }
  };

  const handleEdit = () => {
    // Navigate to the invoices page with a query parameter to open the edit dialog
    router.push(`/invoices?edit=${invoice?.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'UNPAID':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading invoice details...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg">Invoice not found</div>
        <Button onClick={() => router.push('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>
        <div className="flex space-x-2">
          {invoice.status === 'UNPAID' && (
            <Button onClick={() => handleUpdateStatus('PAID')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          {invoice.status === 'PAID' && (
            <Button onClick={() => handleUpdateStatus('UNPAID')}>
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Unpaid
            </Button>
          )}
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice details */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            Created on {new Date(invoice.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* From section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">From</h3>
              <div className="space-y-1">
                <p className="font-medium">{invoice.freelancerCompanyName || userBusinessInfo?.companyName || 'Your Business'}</p>
                <p>{invoice.freelancerBusinessEmail || userBusinessInfo?.businessEmail || userBusinessInfo?.email || 'your.email@example.com'}</p>
                <p>{userBusinessInfo?.phoneNumber || userBusinessInfo?.phone || 'Your Phone'}</p>
                <p>{userBusinessInfo?.businessAddress || userBusinessInfo?.address || 'Your Address'}</p>
              </div>
            </div>

            {/* To section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">To</h3>
              <div className="space-y-1">
                <p className="font-medium">{invoice.project.client.name}</p>
                <p>{invoice.project.client.email}</p>
                <p>{invoice.project.client.phone || 'Client Phone'}</p>
                <p>{invoice.project.client.address || 'Client Address'}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Invoice summary */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Invoice Number:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Project:</span>
              <span>{invoice.project.name}</span>
            </div>
            {invoice.description && (
              <div className="flex justify-between">
                <span className="font-medium">Description:</span>
                <span>{invoice.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Issue Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Due Date:</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Payment details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Details</h3>
            {userBusinessInfo?.bankName && (
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">Bank Name:</span>
                <span>{userBusinessInfo.bankName}</span>
                
                <span className="font-medium">Account Holder:</span>
                <span>{userBusinessInfo.accountHolderName || userBusinessInfo.name}</span>
                
                <span className="font-medium">Account Number:</span>
                <span>{userBusinessInfo.accountNumber}</span>
                
                {userBusinessInfo.ifscCode && (
                  <>
                    <span className="font-medium">IFSC Code:</span>
                    <span>{userBusinessInfo.ifscCode}</span>
                  </>
                )}
                
                {userBusinessInfo.upiId && (
                  <>
                    <span className="font-medium">UPI ID:</span>
                    <span>{userBusinessInfo.upiId}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Amount */}
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Amount:</span>
            <span>{Number(invoice.amount).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* PDF Generator Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice PDF</DialogTitle>
          </DialogHeader>
          {formattedInvoiceData && (
            <PDFGenerator 
              invoiceData={formattedInvoiceData} 
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