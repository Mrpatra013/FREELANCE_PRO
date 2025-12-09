'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
// Import jsPDF dynamically in the downloadPDF function

interface InvoiceViewerProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    createdAt: string;
    dueDate?: string;
    status: 'PAID' | 'UNPAID' | 'DRAFT';
    amount: number;
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
    description?: string;
  };
}

const InvoiceViewer = ({ invoice }: InvoiceViewerProps) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}/template-data`);
        if (res.ok) {
          const data = await res.json();
          setTemplateData(data);
        }
      } catch {}
    };
    fetchTemplateData();
  }, [invoice.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500';
      case 'UNPAID':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'PAID';
      case 'PAID':
        return 'UNPAID';
      default:
        return 'UNPAID';
    }
  };

  const updateInvoiceStatus = async () => {
    setIsUpdating(true);
    try {
      const nextStatus = getNextStatus(invoice.status || 'UNPAID');
      toast.info(`Updating invoice status to ${nextStatus}...`);

      console.log('Current invoice:', invoice);
      console.log('Updating to status:', nextStatus);

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: invoice.project.id,
          amount:
            typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount || 0,
          dueDate: invoice.dueDate,
          status: nextStatus,
          description: invoice.description || `Invoice for ${invoice.project?.name || 'Project'}`,
        }),
      });

      const responseData = await response.json();
      console.log('Update response:', responseData);

      if (response.ok) {
        toast.success(`Invoice status updated to ${nextStatus}`);
        // Force a hard refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('Failed to update invoice status:', responseData);
        toast.error(`Failed to update invoice status: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error(
        `Error updating invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadPDF = async () => {
    try {
      // Show loading state or toast
      toast.info('Generating PDF...');

      // Fetch template data from API
      const response = await fetch(`/api/invoices/${invoice.id}/template-data`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to fetch invoice template data: ${errorData.error || 'Unknown error'}`
        );
      }
      const templateData = await response.json();

      console.log('Template data received:', templateData);

      // Use the blue template
      const { downloadBlueInvoicePDF } = await import('@/lib/new-invoice-template');

      // Download PDF using blue template
      await downloadBlueInvoicePDF(templateData);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(
        'Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const printInvoice = async () => {
    try {
      if (!templateData) return;
      const { getBlueInvoicePDFDataURL } = await import('@/lib/new-invoice-template');
      const url = await getBlueInvoicePDFDataURL(templateData);
      const win = window.open('', '_blank');
      if (win) {
        win.location.href = url;
      }
    } catch {}
  };

  const editInvoice = () => {
    router.push(`/invoices/edit/${invoice.id}`);
  };

  return (
    <div className="invoice-viewer max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadPDF}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={printInvoice}>
            Print
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button variant="outline" onClick={editInvoice}>
              Edit
            </Button>
          )}
          <Button variant="default" onClick={updateInvoiceStatus} disabled={isUpdating}>
            Mark as {getNextStatus(invoice.status)}
          </Button>
        </div>
      </div>

      {/* Invoice Template */}
      <div className="invoice-template border p-8 rounded-md print:border-none print:shadow-none">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800">INVOICE</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          {/* FROM Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-600">FROM:</h3>
            <div className="space-y-1">
              <p className="font-semibold">{templateData?.from?.businessName || 'Freelancer'}</p>
              <p>{templateData?.from?.businessEmail || 'Email not available'}</p>
              <p>{templateData?.from?.phoneNumber || 'Phone not available'}</p>
              <p>{templateData?.from?.businessAddress || 'Address not available'}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <p>
              <strong>Invoice #:</strong> {invoice.invoiceNumber || 'N/A'}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {invoice.createdAt ? format(new Date(invoice.createdAt), 'dd/MM/yyyy') : 'N/A'}
            </p>
            {invoice.dueDate && (
              <p>
                <strong>Due:</strong> {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
              </p>
            )}
            <p>
              <strong>Status:</strong>{' '}
              <Badge className={getStatusColor(invoice.status || 'DRAFT')}>
                {invoice.status || 'DRAFT'}
              </Badge>
            </p>
          </div>
        </div>

        {/* TO Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">TO:</h3>
          <p className="font-semibold">
            {templateData?.to?.clientName || invoice.project?.client?.name || 'Client Name'}
          </p>
          <p>
            {templateData?.to?.clientEmail ||
              invoice.project?.client?.email ||
              'client.email@example.com'}
          </p>
          <p>{templateData?.to?.clientPhone || 'Phone not available'}</p>
          <p>{templateData?.to?.clientAddress || 'Address not available'}</p>
        </div>

        {/* Project/Items Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">ITEMS:</h3>
          
          {templateData?.items && templateData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {templateData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">${Number(item.rate || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${Number(item.total || item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 space-y-2">
                {templateData.subtotal !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>${Number(templateData.subtotal).toFixed(2)}</span>
                  </div>
                )}
                {templateData.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Tax ({templateData.taxRate}%):</span>
                    <span>${Number(templateData.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${Number(invoice.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p>
                <strong>Project:</strong> {invoice.project?.name || 'Project Name'}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {invoice.description && !invoice.description.startsWith('{') 
                  ? invoice.description 
                  : invoice.project?.description || 'No description available'}
              </p>
              <p>
                <strong>Rate:</strong> {Number(invoice.project?.rate || 0).toFixed(2)}
              </p>
              <div className="text-right mt-4">
                <p className="text-2xl font-bold">Total: {Number(invoice.amount || 0).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Notes / Terms */}
        {templateData?.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-gray-600">NOTES:</h3>
            <p className="whitespace-pre-wrap text-sm">{templateData.notes}</p>
          </div>
        )}

        {/* Payment Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-600">PAYMENT INFORMATION:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p>
              <strong>Bank Name:</strong> Payment information not available
            </p>
            <p>
              <strong>Account:</strong> Payment information not available
            </p>
            <p>
              <strong>IFSC Code:</strong> Payment information not available
            </p>
            <p>
              <strong>UPI ID:</strong> Payment information not available
            </p>
          </div>
        </div>

        <div className="text-center pt-8 border-t">
          <p className="text-gray-600">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;
