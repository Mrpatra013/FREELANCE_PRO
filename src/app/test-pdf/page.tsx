'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InvoiceData } from '@/lib/browser-pdf-generator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PDFGenerator from '@/components/pdf/PDFGenerator';

export default function TestPDFPage() {
  const [status, setStatus] = useState('');
  const [sampleInvoiceData, setSampleInvoiceData] = useState({
    invoiceNumber: 'INV-0001',
    invoiceDate: '',
    dueDate: '',
    amount: 1500,
    status: 'UNPAID',
    from: {
      businessName: 'FreelancePro Solutions',
      phoneNumber: '+1 (555) 123-4567',
      businessAddress: '123 Business Street\nSuite 456\nNew York, NY 10001',
      businessEmail: 'business@freelancepro.com',
    },
    to: {
      clientName: 'Test Client',
      clientEmail: 'client@example.com',
      clientCompany: 'Test Company',
    },
    project: {
      name: 'Website Development',
      description: 'Full-stack web application development',
      rate: 50,
      amount: 1500,
    },
    payment: {
      bankName: 'Chase Bank',
      accountNumber: '1234567890',
      accountHolderName: 'FreelancePro Solutions LLC',
      ifscCode: 'CHAS0001234',
      upiId: 'freelancepro@paytm',
    },
    items: [
      {
        description: 'Frontend Development',
        hours: 20,
        rate: 50,
        total: 1000,
      },
      {
        description: 'Backend Development',
        hours: 10,
        rate: 50,
        total: 500,
      },
    ],
    subtotal: 1500,
    taxRate: 0,
    taxAmount: 0,
    paymentTerms: '',
  });

  useEffect(() => {
    setSampleInvoiceData((prev) => ({
      ...prev,
      invoiceDate: format(new Date(), 'dd/MM/yyyy'),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy'),
    }));
  }, []);

  // Status update function
  const updateStatus = (message: string) => {
    setStatus(message);
    console.log(message);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">PDF Generation Test</h1>

      <div className="space-y-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">PDF Generation with Client-Side Component:</h3>
          <p className="mb-4">
            This uses the PDFGenerator component that dynamically loads jsPDF and jspdf-autotable in
            the browser.
          </p>
          <PDFGenerator invoiceData={sampleInvoiceData} />
        </div>
      </div>

      {status && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Status:</h3>
          <p>{status}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Sample Invoice Data:</h3>
        <pre className="text-sm overflow-auto">{JSON.stringify(sampleInvoiceData, null, 2)}</pre>
      </div>
    </div>
  );
}
