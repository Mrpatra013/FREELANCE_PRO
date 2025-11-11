'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { downloadBlueInvoicePDF, getBlueInvoicePDFDataURL } from '@/lib/new-invoice-template';

interface PDFGeneratorProps {
  invoiceData: any;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export default function PDFGenerator({ invoiceData, onDownloadComplete, onError }: PDFGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = async () => {
    setIsLoading(true);
    try {
      await downloadBlueInvoicePDF(invoiceData);
      toast.success('PDF downloaded successfully!');
      onDownloadComplete?.();
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = 'Failed to generate PDF. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const previewPDF = async () => {
    setIsLoading(true);
    try {
      const dataUrl = await getBlueInvoicePDFDataURL(invoiceData);
      
      // Open PDF in new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.location.href = dataUrl;
        toast.success('PDF preview opened in new window!');
      } else {
        toast.error('Please allow pop-ups to preview PDF');
      }
    } catch (error) {
      console.error('Error previewing PDF:', error);
      const errorMessage = 'Failed to preview PDF. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={generatePDF} 
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Generating...' : 'Download PDF'}
        </Button>
        
        <Button 
          onClick={previewPDF} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isLoading ? 'Generating...' : 'Preview PDF'}
        </Button>
      </div>
    </div>
  );
}