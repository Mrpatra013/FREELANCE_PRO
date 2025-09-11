import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
  lastAutoTable?: {
    finalY: number;
  };
};

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount?: number;
  status?: string;
  from: {
    businessName: string;
    phoneNumber: string;
    businessAddress: string;
    businessEmail: string;
  };
  to: {
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
  };
  project: {
    name: string;
    description?: string;
    rate?: number;
    amount: number;
  };
  payment: {
    bankName: string;
    accountNumber: string;
    accountHolderName?: string;
    ifscCode: string;
    upiId: string;
  };
  items?: Array<{
    description: string;
    hours: number;
    rate: number;
    total: number;
  }>;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  paymentTerms?: string;
}

export const generateCleanInvoicePDF = async (invoiceData: InvoiceData): Promise<ArrayBuffer> => {
  try {
    console.log('Starting clean PDF generation with data:', invoiceData);
    
    // Validate required fields
    const requiredFields = {
      'Invoice Number': invoiceData.invoiceNumber,
      'Invoice Date': invoiceData.invoiceDate,
      'Due Date': invoiceData.dueDate,
      'Business Name': invoiceData.from.businessName,
      'Client Name': invoiceData.to.clientName,
      'Project Name': invoiceData.project.name,
      'Project Amount': invoiceData.project.amount
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || (typeof value === 'string' && !value.trim()))
      .map(([field]) => field);
    
    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields for PDF generation: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Create a new jsPDF instance
    const doc = new jsPDF() as jsPDFWithAutoTable;
  
    // Set up the document
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Invoice title - large and bold
    doc.setFontSize(36);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', margin, 40);
    
    // Invoice details (top right)
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin - 80;
    doc.text('Date:', rightX, 30);
    doc.text('Invoice #:', rightX, 42);
    
    // Values for invoice details
    doc.setTextColor(0, 0, 0);
    doc.text(`[${invoiceData.invoiceDate}]`, rightX + 35, 30);
    doc.text(`[${invoiceData.invoiceNumber}]`, rightX + 35, 42);
    
    // Horizontal line under header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, 55, pageWidth - margin, 55);
    
    let yPos = 75;
    
    // From section (left)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`[${invoiceData.from.businessName}]`, margin, yPos + 15);
    doc.text(`[${invoiceData.from.businessAddress.split(',')[0] || 'Address Line 1'}]`, margin, yPos + 27);
    doc.text(`[${invoiceData.from.businessAddress.split(',')[1] || 'Address Line 2'}]`, margin, yPos + 39);
    doc.text(`[${invoiceData.from.businessAddress.split(',')[2] || 'City, State ZipCode'}]`, margin, yPos + 51);
    
    // Bill To section (right)
    const billToX = pageWidth / 2 + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', billToX, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`[${invoiceData.to.clientName}${invoiceData.to.clientCompany ? '/' + invoiceData.to.clientCompany : ''}]`, billToX, yPos + 15);
    doc.text('[Address Line 1]', billToX, yPos + 27);
    doc.text('[Address Line 2]', billToX, yPos + 39);
    doc.text('[City, State ZipCode]', billToX, yPos + 51);
    
    // Horizontal line after addresses
    yPos += 65;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Items table
    yPos += 15;
    
    // Create table data
    const tableData = [];
    if (invoiceData.items && invoiceData.items.length > 0) {
      tableData.push(...invoiceData.items.map(item => [
        item.description,
        item.hours.toString(),
        `$${item.rate.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]));
    } else {
      // Add empty rows for template
      for (let i = 0; i < 8; i++) {
        tableData.push(['', '', '', '']);
      }
    }
    
    // Generate table
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Hours', 'Rate/Hour', 'Total']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5
    });
    
    yPos = (doc as any).lastAutoTable?.finalY || yPos + 120;
    
    // Summary section - right aligned
    const summaryX = pageWidth - margin - 100;
    yPos += 10;
    
    // Calculate amounts
    const subtotalAmount = invoiceData.subtotal || invoiceData.project?.amount || 0;
    const taxRate = invoiceData.taxRate || 0;
    const taxAmount = invoiceData.taxAmount || (subtotalAmount * (taxRate / 100));
    const totalAmount = invoiceData.amount || (subtotalAmount + taxAmount);
    
    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', summaryX, yPos);
    doc.text(`$${subtotalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    
    // Tax Rate
    yPos += 15;
    doc.text(`Tax Rate: ${taxRate}%`, summaryX, yPos);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    
    // Total Due - highlighted
    yPos += 20;
    doc.setFillColor(200, 200, 200);
    doc.rect(summaryX - 10, yPos - 8, 120, 15, 'F');
    doc.setFont('helvetica', 'bold');
    // Payment terms text removed to eliminate 'Net 30'
    doc.text('Total Due:', summaryX, yPos);
    doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Terms and Conditions section
    yPos += 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and Conditions', margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total payment must be completed within 30 days.', margin, yPos + 15);
    doc.text('Thank you for your business!', margin, yPos + 27);
    
    // Send Payment To section (right side)
    const paymentX = pageWidth / 2 + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Send Payment To:', paymentX, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`[${invoiceData.payment.accountHolderName || 'Name'}]`, paymentX, yPos + 15);
    doc.text(`[${invoiceData.payment.bankName}]`, paymentX, yPos + 27);
    doc.text(`[${invoiceData.payment.accountNumber}]`, paymentX, yPos + 39);
    doc.text(`[${invoiceData.payment.ifscCode || 'Other Bank Info'}]`, paymentX, yPos + 51);
    
    // Powered by GeneralBlue (bottom left)
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('powered by', margin, pageHeight - 25);
    doc.setFontSize(12);
    doc.setTextColor(0, 100, 200);
    doc.setFont('helvetica', 'bold');
    doc.text('GeneralBlue', margin, pageHeight - 15);
    
    console.log('Clean PDF generation completed successfully');
    return doc.output('arraybuffer') as ArrayBuffer;
    
  } catch (error) {
    console.error('Error generating clean PDF:', error);
    throw error;
  }
};

export const downloadCleanInvoicePDF = async (invoiceData: InvoiceData, fileName?: string): Promise<void> => {
  try {
    const pdfBytes = await generateCleanInvoicePDF(invoiceData);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading clean PDF:', error);
    throw error;
  }
};

export const getCleanInvoicePDFBlob = async (invoiceData: InvoiceData): Promise<Blob> => {
  const pdfBytes = await generateCleanInvoicePDF(invoiceData);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const getCleanInvoicePDFDataURL = async (invoiceData: InvoiceData): Promise<string> => {
  const blob = await getCleanInvoicePDFBlob(invoiceData);
  return URL.createObjectURL(blob);
};