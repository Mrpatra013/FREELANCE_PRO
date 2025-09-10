import jsPDF from 'jspdf';
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
  terms: string;
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
    clientAddress?: string;
  };
  shipTo?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
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
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  balanceDue?: number;
  paymentTerms?: string;
}

export const generateNewInvoicePDF = async (invoiceData: InvoiceData): Promise<ArrayBuffer> => {
  try {
    console.log('Starting new template PDF generation with data:', invoiceData);
    
    // Validate required fields
    const requiredFields = {
      'Invoice Number': invoiceData.invoiceNumber,
      'Invoice Date': invoiceData.invoiceDate,
      'Due Date': invoiceData.dueDate,
      'Business Name': invoiceData.from.businessName,
      'Client Name': invoiceData.to.clientName,
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (typeof value === 'string' && !value.trim()))
      .map(([field, _]) => field);
    
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
    
    // Header Section with Background
    doc.setFillColor(248, 249, 250); // Light gray background
    doc.rect(0, 0, pageWidth, 110, 'F');
    
    // Company Header Section (Left Side)
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.from.businessName, margin, 25);
    
    // Company Contact Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Phone: ${invoiceData.from.phoneNumber}`, margin, 35);
    doc.text(`Email: ${invoiceData.from.businessEmail}`, margin, 42);
    
    // Company Address
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const addressLines = invoiceData.from.businessAddress.split('\n');
    let yPos = 49;
    addressLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 4;
    });
    
    // INVOICE Title (Center-Right)
    doc.setFontSize(28);
    doc.setTextColor(41, 84, 144); // Blue color
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin - 80, 25);
    
    // Invoice Details in Header (Right Side)
    const detailsX = pageWidth - margin - 75;
    
    // Invoice Number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Invoice #:', detailsX, 40);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.invoiceNumber, detailsX + 25, 40);
    
    // Invoice Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Date:', detailsX, 50);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.invoiceDate, detailsX + 25, 50);
    
    // Terms
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Terms:', detailsX, 60);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.terms || 'Due on Receipt', detailsX + 25, 60);
    
    // Due Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Due Date:', detailsX, 70);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.dueDate, detailsX + 25, 70);
    
    // Header separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 115, pageWidth - margin, 115);
    
    // Bill To and Ship To Section
    const billToStartY = 130;
    
    // Section separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, billToStartY - 10, pageWidth - margin, billToStartY - 10);
    
    // Bill To Section with background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin - 5, billToStartY - 5, (pageWidth / 2) - margin - 10, 55, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin, billToStartY + 5);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.to.clientName, margin, billToStartY + 18);
    
    if (invoiceData.to.clientCompany) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(invoiceData.to.clientCompany, margin, billToStartY + 28);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceData.to.clientEmail, margin, billToStartY + 38);
    
    if (invoiceData.to.clientAddress) {
      const clientAddressLines = invoiceData.to.clientAddress.split('\n');
      let clientYPos = billToStartY + 48;
      clientAddressLines.forEach(line => {
        doc.text(line, margin, clientYPos);
        clientYPos += 4;
      });
    }
    
    // Ship To Section (right side) with background
    const shipToX = pageWidth / 2 + 10;
    doc.setFillColor(250, 250, 250);
    doc.rect(shipToX - 5, billToStartY - 5, (pageWidth / 2) - 25, 55, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO', shipToX, billToStartY + 5);
    
    if (invoiceData.shipTo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(invoiceData.shipTo.address, shipToX, billToStartY + 18);
      doc.text(invoiceData.shipTo.city, shipToX, billToStartY + 28);
      doc.text(`${invoiceData.shipTo.state} ${invoiceData.shipTo.zipCode}`, shipToX, billToStartY + 38);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Same as billing address', shipToX, billToStartY + 18);
    }
    
    // Items Table
    const itemsStartY = 200;
    
    // Items section separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, itemsStartY - 10, pageWidth - margin, itemsStartY - 10);
    
    // Prepare items data
    const projectAmount = invoiceData.project.amount || 0;
    const items = invoiceData.items || [
      {
        description: invoiceData.project.name || 'Project',
        quantity: 1,
        rate: projectAmount,
        amount: projectAmount
      }
    ];

    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.description || '',
      (item.quantity || 0).toFixed(2),
      `$${(item.rate || 0).toFixed(2)}`,
      `$${(item.amount || 0).toFixed(2)}`
    ]);
    
    // Create items table with enhanced styling
    autoTable(doc, {
      startY: itemsStartY,
      head: [['#', 'DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
        textColor: [60, 60, 60]
      },
      headStyles: {
        fillColor: [41, 84, 144],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      theme: 'grid',
      margin: { left: margin, right: margin }
    });
    
    // Calculate totals
    const subtotal = invoiceData.subtotal || items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = invoiceData.taxRate || 5.00;
    const taxAmount = invoiceData.taxAmount || (subtotal * taxRate / 100);
    const total = invoiceData.total || (subtotal + taxAmount);
    const balanceDue = invoiceData.balanceDue || total;
    
    // Totals Section - Enhanced with more space
    const totalsStartY = (doc as any).lastAutoTable.finalY + 20;
    const totalsX = pageWidth - margin - 120;
    const totalsWidth = 115;
    
    // Totals section background
    doc.setFillColor(248, 249, 250);
    doc.rect(totalsX - 10, totalsStartY - 5, totalsWidth, 70, 'F');
    
    // Totals border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(totalsX - 10, totalsStartY - 5, totalsWidth, 70);
    
    // Sub Total
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Sub Total:', totalsX + 5, totalsStartY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 15, totalsStartY + 10, { align: 'right' });
    
    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.line(totalsX - 5, totalsStartY + 14, pageWidth - margin - 15, totalsStartY + 14);
    
    // Tax Rate
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Tax Rate:', totalsX + 5, totalsStartY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${taxRate.toFixed(2)}%`, pageWidth - margin - 15, totalsStartY + 24, { align: 'right' });
    
    // Tax Amount
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Tax Amount:', totalsX + 5, totalsStartY + 38);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - margin - 15, totalsStartY + 38, { align: 'right' });
    
    // Separator line before total
    doc.setDrawColor(41, 84, 144);
    doc.setLineWidth(1);
    doc.line(totalsX - 5, totalsStartY + 42, pageWidth - margin - 15, totalsStartY + 42);
    
    // Total
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 84, 144);
    doc.text('TOTAL:', totalsX + 5, totalsStartY + 52);
    doc.text(`$${total.toFixed(2)}`, pageWidth - margin - 15, totalsStartY + 52, { align: 'right' });
    
    // Balance Due
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69); // Red color for balance due
    doc.text('Balance Due:', totalsX + 5, totalsStartY + 66);
    doc.text(`$${balanceDue.toFixed(2)}`, pageWidth - margin - 15, totalsStartY + 66, { align: 'right' });
    
    // Thank you message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thanks for shopping with us.', margin, totalsStartY + 20);
    
    // Terms & Conditions Section
    const termsStartY = totalsStartY + 90;
    
    // Terms section separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, termsStartY - 5, pageWidth - margin, termsStartY - 5);
    
    doc.setFontSize(16);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', margin, termsStartY + 10);
    
    // Terms background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin - 5, termsStartY + 20, pageWidth - 2 * margin + 10, 60, 'F');
    
    // Terms border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, termsStartY + 20, pageWidth - 2 * margin + 10, 60);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const termsText = [
      '• Full payment is due upon receipt of this invoice',
      '• Late payments may incur additional charges or interest as per applicable laws',
      '• All disputes must be resolved within 30 days of invoice date',
      '• This invoice is computer generated and does not require signature',
      '• For any queries regarding this invoice, please contact us immediately'
    ];
    
    let termsY = termsStartY + 35;
    termsText.forEach(term => {
      doc.text(term, margin + 5, termsY);
      termsY += 8;
    });
    
    // Professional Footer
    const footerY = pageHeight - 30;
    doc.setDrawColor(41, 84, 144);
    doc.setLineWidth(1);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', margin, footerY);
    doc.text('Page 1 of 2', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY, { align: 'right' });
    
    // Add second page for payment information and terms
    doc.addPage();
    
    // Header background for second page
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Payment Information Header
    doc.setFontSize(24);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', margin, 30);
    
    // Header separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);
    
    // Bank Details Section with background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin - 5, 55, pageWidth - 2 * margin + 10, 80, 'F');
    
    // Bank Details border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, 55, pageWidth - 2 * margin + 10, 80);
    
    doc.setFontSize(16);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('BANK DETAILS', margin, 70);
    
    // Bank information with labels in bold
    const bankDetailsY = 85;
    const labelX = margin + 10;
    const valueX = margin + 80;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Bank Name:', labelX, bankDetailsY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.bankName, valueX, bankDetailsY);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Account Number:', labelX, bankDetailsY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.accountNumber, valueX, bankDetailsY + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Account Holder:', labelX, bankDetailsY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.accountHolderName || 'N/A', valueX, bankDetailsY + 24);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('IFSC Code:', labelX, bankDetailsY + 36);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.ifscCode, valueX, bankDetailsY + 36);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('UPI ID:', labelX, bankDetailsY + 48);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.upiId, valueX, bankDetailsY + 48);
    
    // Payment Instructions Section
    const instructionsStartY = 150;
    
    // Instructions section separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, instructionsStartY - 5, pageWidth - margin, instructionsStartY - 5);
    
    doc.setFontSize(16);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INSTRUCTIONS', margin, instructionsStartY + 10);
    
    // Instructions background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin - 5, instructionsStartY + 20, pageWidth - 2 * margin + 10, 85, 'F');
    
    // Instructions border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, instructionsStartY + 20, pageWidth - 2 * margin + 10, 85);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const instructions = [
      '• Please include the invoice number in your payment reference',
      '• Payment must be made within the specified due date',
      '• For wire transfers, please add bank charges to the payment amount',
      '• Send payment confirmation to the business email address',
      '• For any payment queries, contact us immediately',
      '• Keep payment receipt for your records'
    ];
    
    let instructionY = instructionsStartY + 35;
    instructions.forEach(instruction => {
      doc.text(instruction, margin, instructionY);
      instructionY += 10;
    });
    
    // Extended Terms & Conditions Section
    const extendedTermsStartY = 270;
    
    // Extended terms section separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, extendedTermsStartY - 5, pageWidth - margin, extendedTermsStartY - 5);
    
    doc.setFontSize(16);
    doc.setTextColor(41, 84, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED TERMS & CONDITIONS', margin, extendedTermsStartY + 10);
    
    // Extended terms background
    doc.setFillColor(250, 250, 250);
    doc.rect(margin - 5, extendedTermsStartY + 20, pageWidth - 2 * margin + 10, 120, 'F');
    
    // Extended terms border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, extendedTermsStartY + 20, pageWidth - 2 * margin + 10, 120);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const extendedTerms = [
      '1. Payment Terms: Full payment is due within 30 days of invoice date unless otherwise specified.',
      '2. Late Payment: A late fee of 1.5% per month may be charged on overdue amounts.',
      '3. Dispute Resolution: Any disputes must be raised within 7 days of invoice receipt.',
      '4. Governing Law: This invoice is governed by the laws of the jurisdiction where services were provided.',
      '5. Modification: Terms can only be modified with written agreement from both parties.',
      '6. Severability: If any term is found invalid, the remaining terms continue to be enforceable.'
    ];
    
    let termsConditionY = extendedTermsStartY + 35;
    extendedTerms.forEach(term => {
      const lines = doc.splitTextToSize(term, pageWidth - 2 * margin - 20);
      lines.forEach((line: string) => {
        doc.text(line, margin + 5, termsConditionY);
        termsConditionY += 6;
      });
      termsConditionY += 4; // Extra space between terms
    });
    
    // Professional Footer for second page
    const footerY2 = pageHeight - 30;
    doc.setDrawColor(41, 84, 144);
    doc.setLineWidth(1);
    doc.line(margin, footerY2 - 10, pageWidth - margin, footerY2 - 10);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated invoice and does not require a signature.', margin, footerY2);
    doc.text('Page 2 of 2', pageWidth - margin, footerY2, { align: 'right' });
    
    console.log('New template PDF generation completed successfully');
    return doc.output('arraybuffer') as ArrayBuffer;
    
  } catch (error) {
    console.error('Error generating new template PDF:', error);
    throw error;
  }
};

// Blue Curved Header Invoice Template - Exact replica of provided design
export const downloadBlueInvoicePDF = (invoiceData: InvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Blue curved header background
  doc.setFillColor(41, 84, 144); // Blue color
  
  // Create curved header shape
  doc.setFillColor(41, 84, 144);
  
  // Main blue rectangle
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Create curved bottom using bezier curves
  doc.setFillColor(41, 84, 144);
  const curveHeight = 30;
  const controlPoint1X = pageWidth * 0.3;
  const controlPoint2X = pageWidth * 0.7;
  
  // Draw curved bottom of header
  doc.setDrawColor(41, 84, 144);
  doc.setFillColor(41, 84, 144);
  
  // Create path for curved bottom
  const path = `M 0 80 Q ${controlPoint1X} ${80 + curveHeight} ${pageWidth/2} ${80 + curveHeight/2} Q ${controlPoint2X} ${80} ${pageWidth} 80 L ${pageWidth} 0 L 0 0 Z`;
  
  // Since jsPDF doesn't support SVG paths directly, we'll simulate with multiple rectangles
  for (let x = 0; x < pageWidth; x += 2) {
    const progress = x / pageWidth;
    const curveY = 80 + Math.sin(progress * Math.PI) * (curveHeight / 2);
    doc.rect(x, 80, 2, curveY - 80, 'F');
  }
  
  // INVOICE title (white text on blue background)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin, 40);
  
  // Invoice number (white text, top right)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`NO: ${invoiceData.invoiceNumber}`, pageWidth - margin - 60, 30);
  
  // Date (under invoice number)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Date (under invoice number)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${invoiceData.invoiceDate}`, pageWidth - margin - 60, 45);
  
  // Bill To and From sections - Centered layout
  const sectionStartY = 130;
  const centerX = pageWidth / 2;
  const sectionWidth = 70;
  
  // Bill To section (centered left)
  const billToX = centerX - sectionWidth - 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', billToX, sectionStartY);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.to.clientName, billToX, sectionStartY + 15);
  doc.text(invoiceData.to.clientEmail, billToX, sectionStartY + 27);
  if (invoiceData.to.clientCompany) {
    doc.text(invoiceData.to.clientCompany, billToX, sectionStartY + 39);
  }
  
  // From section (centered right)
  const fromX = centerX + 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', fromX, sectionStartY);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.from.businessName, fromX, sectionStartY + 15);
  doc.text(invoiceData.from.phoneNumber, fromX, sectionStartY + 27);
  doc.text(invoiceData.from.businessAddress, fromX, sectionStartY + 39);
  

  
  // Items table - Full width
  const tableStartY = sectionStartY + 85;
  
  // Table with blue header - simplified to Description and Price only
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Price']],
    body: [
      [invoiceData.project.description || 'Service Description', `$ ${invoiceData.project.amount?.toFixed(2) || '0.00'}`]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 6,
      lineColor: [200, 200, 200],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [41, 84, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [80, 80, 80]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: margin, right: margin }
  });
  
  // Sub Total section (blue background) - Centered
  const subTotalY = (doc as any).lastAutoTable.finalY + 10;
  const subTotalWidth = 80;
  const subTotalX = centerX - (subTotalWidth / 2);
  
  doc.setFillColor(41, 84, 144);
  doc.rect(subTotalX, subTotalY, subTotalWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total', subTotalX + 10, subTotalY + 14);
  doc.text(`$ ${invoiceData.project.amount?.toFixed(2) || '0.00'}`, subTotalX + subTotalWidth - 25, subTotalY + 14);
  
  // Note section with payment procedures
  const noteY = subTotalY + 50;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Note:', margin, noteY);
  
  // Payment procedures text
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const paymentProcedures = [
    'Payment Procedures:',
    '1. Payment is due within 30 days of invoice date',
    '2. Please include invoice number in payment reference',
    '3. Late payments may incur additional charges'
  ];
  
  paymentProcedures.forEach((line, index) => {
    if (index === 0) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, margin, noteY + 20 + (index * 12));
  });
  
  // Payment Information section
  const paymentY = noteY + 80;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Information:', margin, paymentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Bank:', margin, paymentY + 20);
  doc.text(invoiceData.payment.bankName || 'Name Bank', margin + 40, paymentY + 20);
  doc.text('No Bank:', margin, paymentY + 35);
  doc.text(invoiceData.payment.accountNumber || '123-456-7890', margin + 40, paymentY + 35);
  doc.text('Email:', margin, paymentY + 50);
  doc.text(invoiceData.from.businessEmail || 'reallygreatsite.com', margin + 40, paymentY + 50);
  
  // Removed Thank You section
  
  // Add second page for detailed payment information
  doc.addPage();
  
  // Second page header with blue background
  doc.setFillColor(41, 84, 144);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Payment Details title (centered)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', pageWidth / 2, 30, { align: 'center' });
  
  // Detailed payment information section
  const detailsStartY = 80;
  
  // Payment Information Header (centered)
  doc.setTextColor(41, 84, 144);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Payment Information', pageWidth / 2, detailsStartY, { align: 'center' });
  
  // Payment details table
  const paymentDetails = [
    ['Account Holder Name', invoiceData.payment.accountHolderName || invoiceData.from.businessName],
    ['Bank Name', invoiceData.payment.bankName || 'Not specified'],
    ['Account Number', invoiceData.payment.accountNumber || 'Not specified'],
    ['IFSC Code', invoiceData.payment.ifscCode || 'Not specified'],
    ['UPI ID', invoiceData.payment.upiId || 'Not specified'],
    ['Business Email', invoiceData.from.businessEmail || 'Not specified'],
    ['Business Phone', invoiceData.from.phoneNumber || 'Not specified'],
    ['Business Address', invoiceData.from.businessAddress || 'Not specified']
  ];
  
  // Full width payment table
  autoTable(doc, {
    startY: detailsStartY + 20,
    head: [['Payment Field', 'Details']],
    body: paymentDetails,
    headStyles: {
      fillColor: [41, 84, 144],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [80, 80, 80]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Payment Terms Section (centered)
  const termsY = (doc as any).lastAutoTable.finalY + 20;
  doc.setTextColor(41, 84, 144);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms & Conditions', pageWidth / 2, termsY, { align: 'center' });
  
  // Centered and compact terms text
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const termsText = [
    '• Payment is due within 30 days from the invoice date',
    '• Please include the invoice number in your payment reference',
    '• Late payments may incur additional charges of 2% per month',
    '• All payments should be made in the currency specified in this invoice',
    '• For any payment queries, please contact us using the details above',
    '• Bank transfer is the preferred method of payment',
    '• Please ensure all bank charges are covered by the payer'
  ];
  
  const termsStartX = pageWidth / 2 - 80;
  termsText.forEach((term, index) => {
    doc.text(term, termsStartX, termsY + 15 + (index * 12));
  });
  
  // Removed thank you message from footer
  
  // Save the PDF
  doc.save(`invoice-${invoiceData.invoiceNumber || 'blue-design'}.pdf`);
};

export const downloadNewInvoicePDF = async (invoiceData: InvoiceData, fileName?: string): Promise<void> => {
  try {
    const pdfBytes = await generateNewInvoicePDF(invoiceData);
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
    console.error('Error downloading new template PDF:', error);
    throw error;
  }
};

export const getNewInvoicePDFBlob = async (invoiceData: InvoiceData): Promise<Blob> => {
  const pdfBytes = await generateNewInvoicePDF(invoiceData);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const getNewInvoicePDFDataURL = async (invoiceData: InvoiceData): Promise<string> => {
  const blob = await getNewInvoicePDFBlob(invoiceData);
  return URL.createObjectURL(blob);
};

// Blue template preview function
export const getBlueInvoicePDFDataURL = async (invoiceData: InvoiceData): Promise<string> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Blue curved header background
  doc.setFillColor(41, 84, 144); // Blue color
  
  // Create curved header shape
  doc.setFillColor(41, 84, 144);
  
  // Main blue rectangle
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Create curved bottom using bezier curves
  doc.setFillColor(41, 84, 144);
  const curveHeight = 30;
  const controlPoint1X = pageWidth * 0.3;
  const controlPoint2X = pageWidth * 0.7;
  
  // Draw curved bottom of header
  doc.setDrawColor(41, 84, 144);
  doc.setFillColor(41, 84, 144);
  
  // Since jsPDF doesn't support SVG paths directly, we'll simulate with multiple rectangles
  for (let x = 0; x < pageWidth; x += 2) {
    const progress = x / pageWidth;
    const curveY = 80 + Math.sin(progress * Math.PI) * (curveHeight / 2);
    doc.rect(x, 80, 2, curveY - 80, 'F');
  }
  
  // INVOICE title (white text on blue background)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin, 40);
  
  // Invoice number (white text, top right)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`NO: ${invoiceData.invoiceNumber}`, pageWidth - margin - 60, 30);
  
  // Date (under invoice number)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${invoiceData.invoiceDate}`, pageWidth - margin - 60, 45);
  
  // Bill To and From sections - Centered layout
  const sectionStartY = 130;
  const centerX = pageWidth / 2;
  const sectionWidth = 70;
  
  // Bill To section (centered left)
  const billToX = centerX - sectionWidth - 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', billToX, sectionStartY);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.to.clientName, billToX, sectionStartY + 15);
  doc.text(invoiceData.to.clientEmail, billToX, sectionStartY + 27);
  if (invoiceData.to.clientCompany) {
    doc.text(invoiceData.to.clientCompany, billToX, sectionStartY + 39);
  }
  
  // From section (centered right)
  const fromX = centerX + 10;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', fromX, sectionStartY);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.from.businessName, fromX, sectionStartY + 15);
  doc.text(invoiceData.from.phoneNumber, fromX, sectionStartY + 27);
  doc.text(invoiceData.from.businessAddress, fromX, sectionStartY + 39);
  

  
  // Items table - Full width
  const tableStartY = sectionStartY + 85;
  
  // Table with blue header - simplified to Description and Price only
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Price']],
    body: [
      [invoiceData.project.description || 'Service Description', `$ ${invoiceData.project.amount?.toFixed(2) || '0.00'}`]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 6
    },
    headStyles: {
      fillColor: [41, 84, 144],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [80, 80, 80]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: margin, right: margin }
  });
  
  // Sub Total section with blue background - Centered
  const subTotalY = (doc as any).lastAutoTable.finalY + 10;
  const subTotalWidth = 80;
  const subTotalX = centerX - (subTotalWidth / 2);
  doc.setFillColor(41, 84, 144);
  doc.rect(subTotalX, subTotalY, subTotalWidth, 18, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total', subTotalX + 10, subTotalY + 12);
  doc.text(`$ ${invoiceData.project.amount?.toFixed(2) || '0.00'}`, subTotalX + subTotalWidth - 10, subTotalY + 12, { align: 'right' });
  
  // Removed Thank You section
  
  // Add second page for detailed payment information
  doc.addPage();
  
  // Second page header with blue background
  doc.setFillColor(41, 84, 144);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Payment Details title (centered)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', pageWidth / 2, 30, { align: 'center' });
  
  // Detailed payment information section
  const detailsStartY = 80;
  
  // Payment Information Header (centered)
  doc.setTextColor(41, 84, 144);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Payment Information', pageWidth / 2, detailsStartY, { align: 'center' });
  
  // Payment details table
  const paymentDetails = [
    ['Account Holder Name', invoiceData.payment.accountHolderName || invoiceData.from.businessName],
    ['Bank Name', invoiceData.payment.bankName || 'Not specified'],
    ['Account Number', invoiceData.payment.accountNumber || 'Not specified'],
    ['IFSC Code', invoiceData.payment.ifscCode || 'Not specified'],
    ['UPI ID', invoiceData.payment.upiId || 'Not specified'],
    ['Business Email', invoiceData.from.businessEmail || 'Not specified'],
    ['Business Phone', invoiceData.from.phoneNumber || 'Not specified'],
    ['Business Address', invoiceData.from.businessAddress || 'Not specified']
  ];
  
  // Full width payment table
  autoTable(doc, {
    startY: detailsStartY + 20,
    head: [['Payment Field', 'Details']],
    body: paymentDetails,
    headStyles: {
      fillColor: [41, 84, 144],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [80, 80, 80]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Payment Terms Section (centered)
  const termsY = (doc as any).lastAutoTable.finalY + 20;
  doc.setTextColor(41, 84, 144);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms & Conditions', pageWidth / 2, termsY, { align: 'center' });
  
  // Centered and compact terms text
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const termsText = [
    '• Payment is due within 30 days from the invoice date',
    '• Please include the invoice number in your payment reference',
    '• Late payments may incur additional charges of 2% per month',
    '• All payments should be made in the currency specified in this invoice',
    '• For any payment queries, please contact us using the details above',
    '• Bank transfer is the preferred method of payment',
    '• Please ensure all bank charges are covered by the payer'
  ];
  
  const downloadTermsStartX = pageWidth / 2 - 80;
  termsText.forEach((term, index) => {
    doc.text(term, downloadTermsStartX, termsY + 15 + (index * 12));
  });
  
  // Removed thank you message from footer
  
  // Return data URL for preview
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};