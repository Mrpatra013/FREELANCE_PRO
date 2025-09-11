// Browser-compatible PDF generator
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type assertion for autoTable
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

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<Uint8Array> => {
  try {
    console.log('Starting PDF generation with data:', invoiceData);
    
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
    const margin = 15;
    
    // Invoice title - large and bold with blue color
    doc.setFontSize(36);
    doc.setTextColor(0, 102, 204); // Blue color
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', margin, 40);
    
    // Invoice details (top right)
    doc.setFontSize(11);
    doc.setTextColor(0, 102, 204); // Blue color for labels
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin - 80;
    doc.text('Date:', rightX, 30);
    doc.text('Invoice #:', rightX, 42);
    
    // Values for invoice details - keep black
    doc.setTextColor(0, 0, 0);
    doc.text(`[${invoiceData.invoiceDate}]`, rightX + 35, 30);
    doc.text(`[${invoiceData.invoiceNumber}]`, rightX + 35, 42);
    
    // Horizontal line under header in blue
    doc.setDrawColor(0, 102, 204); // Blue color
    doc.setLineWidth(1);
    doc.line(margin, 55, pageWidth - margin, 55);
    
    let yPos = 75;
    
    // From section (left) - Compact layout
    doc.setFontSize(11);
    doc.setTextColor(0, 102, 204); // Blue color for header
    doc.setFont('helvetica', 'bold');
    doc.text('From:', margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    let fromY = yPos + 12;
    
    // Name
    doc.setTextColor(0, 102, 204); // Blue for label
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, fromY);
    doc.setTextColor(0, 0, 0); // Black for value
    doc.setFont('helvetica', 'normal');
    const nameText = doc.splitTextToSize(invoiceData.from.businessName, 80);
    doc.text(nameText, margin + 25, fromY);
    fromY += nameText.length * 10;
    
    // Address
    if (invoiceData.from.businessAddress) {
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', margin, fromY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      const addressText = doc.splitTextToSize(invoiceData.from.businessAddress, 80);
      doc.text(addressText, margin + 25, fromY);
      fromY += addressText.length * 10;
    }
    
    // Phone
    if (invoiceData.from.phoneNumber) {
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', margin, fromY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.from.phoneNumber, margin + 25, fromY);
      fromY += 10;
    }
    
    // Email
    if (invoiceData.from.businessEmail) {
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin, fromY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      const emailText = doc.splitTextToSize(invoiceData.from.businessEmail, 80);
      doc.text(emailText, margin + 25, fromY);
      fromY += emailText.length * 10;
    }
    
    // Bill To section (right) - Compact layout
    const billToX = pageWidth / 2 + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204); // Blue color for header
    doc.text('Bill To:', billToX, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    let billToY = yPos + 12;
    const maxBillToWidth = pageWidth - billToX - margin - 25;
    
    // Name
    doc.setTextColor(0, 102, 204); // Blue for label
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', billToX, billToY);
    doc.setTextColor(0, 0, 0); // Black for value
    doc.setFont('helvetica', 'normal');
    const clientNameText = doc.splitTextToSize(invoiceData.to.clientName, maxBillToWidth);
    doc.text(clientNameText, billToX + 35, billToY);
    billToY += clientNameText.length * 10;
    
    // Company
    if (invoiceData.to.clientCompany) {
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('Company:', billToX, billToY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      const companyText = doc.splitTextToSize(invoiceData.to.clientCompany, maxBillToWidth);
      doc.text(companyText, billToX + 35, billToY);
      billToY += companyText.length * 10;
    }
    
    // Email
    if (invoiceData.to.clientEmail) {
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', billToX, billToY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      const clientEmailText = doc.splitTextToSize(invoiceData.to.clientEmail, maxBillToWidth);
      doc.text(clientEmailText, billToX + 35, billToY);
      billToY += clientEmailText.length * 10;
    }
    
    // Calculate the maximum height used by both sections
    const maxSectionHeight = Math.max(fromY - yPos, billToY - yPos);
    
    // Horizontal line after addresses
    yPos += maxSectionHeight + 15;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Items table
    yPos += 15;
    if (invoiceData.items && invoiceData.items.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: invoiceData.items.map(item => [
          item.description,
          item.hours.toString(),
          `$${item.rate.toFixed(2)}`,
          `$${item.total.toFixed(2)}`
        ]),
        theme: 'plain',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 102, 204], // Blue color for table headers
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' }
        },
        margin: { left: margin, right: margin },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        }
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 60;
    } else {
      // If no items, create a simple project-based table
      const amount = invoiceData.project?.amount || 0;
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: [[
          invoiceData.project.name + (invoiceData.project.description ? ` - ${invoiceData.project.description}` : ''),
          '1',
          invoiceData.project.rate ? `$${invoiceData.project.rate.toFixed(2)}` : `$${amount.toFixed(2)}`,
          `$${amount.toFixed(2)}`
        ]],
        theme: 'plain',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 102, 204], // Blue color for table headers
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' }
        },
        margin: { left: margin, right: margin },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        }
      });
      
      yPos = (doc as any).lastAutoTable?.finalY || yPos + 60;
    }
    
    // Calculate subtotal
    const subtotalAmount = invoiceData.subtotal || invoiceData.project?.amount || 0;
    
    // Summary section - clean right-aligned layout
    yPos += 30;
    const summaryX = pageWidth - margin - 120;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Subtotal
    doc.text('Subtotal:', summaryX, yPos);
    doc.text(`$${subtotalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    
    // Tax if applicable
    if (invoiceData.taxRate && invoiceData.taxRate > 0) {
      yPos += 12;
      const taxAmount = invoiceData.taxAmount || (subtotalAmount * (invoiceData.taxRate / 100));
      doc.text(`Tax (${invoiceData.taxRate}%):`, summaryX, yPos);
      doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    }
    
    // Horizontal line before total
    yPos += 15;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(summaryX, yPos, pageWidth - margin, yPos);
    
    // Total
    yPos += 15;
    const totalAmount = invoiceData.amount || subtotalAmount;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', summaryX, yPos);
    doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Payment details section
    yPos += 40;
    
    // Check if we need a new page for payment information
    if (yPos > pageHeight - 150) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', margin, yPos);
    
    // Add a line under the payment information header
    yPos += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let paymentY = yPos + 20;
    
    // Bank Transfer section
    if (invoiceData.payment.bankName || invoiceData.payment.accountNumber || invoiceData.payment.ifscCode || invoiceData.payment.accountHolderName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 102, 204);
      doc.text('Bank Transfer Details:', margin, paymentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      paymentY += 15;
      
      // Create a bordered section for bank details
      const bankSectionStartY = paymentY - 5;
      
      if (invoiceData.payment.bankName) {
        doc.setTextColor(0, 102, 204); // Blue for label
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Name:', margin + 10, paymentY);
        doc.setTextColor(0, 0, 0); // Black for value
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceData.payment.bankName, margin + 70, paymentY);
        paymentY += 12;
      }
      
      if (invoiceData.payment.accountHolderName) {
        doc.setTextColor(0, 102, 204); // Blue for label
        doc.setFont('helvetica', 'bold');
        doc.text('Account Holder:', margin + 10, paymentY);
        doc.setTextColor(0, 0, 0); // Black for value
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceData.payment.accountHolderName, margin + 70, paymentY);
        paymentY += 12;
      }
      
      if (invoiceData.payment.accountNumber) {
        doc.setTextColor(0, 102, 204); // Blue for label
        doc.setFont('helvetica', 'bold');
        doc.text('Account Number:', margin + 10, paymentY);
        doc.setTextColor(0, 0, 0); // Black for value
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceData.payment.accountNumber, margin + 70, paymentY);
        paymentY += 12;
      }
      
      if (invoiceData.payment.ifscCode) {
        doc.setTextColor(0, 102, 204); // Blue for label
        doc.setFont('helvetica', 'bold');
        doc.text('IFSC Code:', margin + 10, paymentY);
        doc.setTextColor(0, 0, 0); // Black for value
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceData.payment.ifscCode, margin + 70, paymentY);
        paymentY += 12;
      }
      
      // Draw border around bank details
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(margin + 5, bankSectionStartY, pageWidth - 2 * margin - 10, paymentY - bankSectionStartY + 5);
      
      paymentY += 15;
    }
    
    // UPI details
    if (invoiceData.payment.upiId) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 102, 204);
      doc.text('UPI Payment Details:', margin, paymentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      paymentY += 15;
      
      // Create a bordered section for UPI details
      const upiSectionStartY = paymentY - 5;
      
      doc.setTextColor(0, 102, 204); // Blue for label
      doc.setFont('helvetica', 'bold');
      doc.text('UPI ID:', margin + 10, paymentY);
      doc.setTextColor(0, 0, 0); // Black for value
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.payment.upiId, margin + 70, paymentY);
      paymentY += 12;
      
      // Add QR code placeholder text
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Scan QR code or use UPI ID for payment', margin + 10, paymentY);
      paymentY += 10;
      
      // Draw border around UPI details
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(margin + 5, upiSectionStartY, pageWidth - 2 * margin - 10, paymentY - upiSectionStartY + 5);
      
      paymentY += 15;
    }
    
    // Payment terms section removed to eliminate 'Net 30' text
    
    // Additional payment instructions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 102, 204);
    doc.text('Important Payment Instructions:', margin, paymentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black color for instruction text
    paymentY += 15;
    
    const instructions = [
      '• Please include invoice number in payment reference',
      '• Payment should be made within the specified due date',
      '• For any payment queries, contact us immediately',
      '• Keep payment receipt for your records'
    ];
    
    instructions.forEach(instruction => {
      doc.text(instruction, margin + 10, paymentY);
      paymentY += 10;
    });
    
    // Footer
    const footerY = pageHeight - 30;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    
    // Return the PDF as bytes
    return doc.output('arraybuffer') as unknown as Uint8Array;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

export const downloadInvoicePDF = async (invoiceData: InvoiceData, fileName?: string): Promise<void> => {
  try {
    console.log('Downloading PDF with data:', invoiceData);
    const pdfBytes = await generateInvoicePDF(invoiceData);
    // Convert back to ArrayBuffer for Blob constructor
    const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

export const getInvoicePDFBlob = async (invoiceData: InvoiceData): Promise<Blob> => {
  const pdfBytes = await generateInvoicePDF(invoiceData);
  return new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
};

export const getInvoicePDFDataURL = async (invoiceData: InvoiceData): Promise<string> => {
  const pdfBytes = await generateInvoicePDF(invoiceData);
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};