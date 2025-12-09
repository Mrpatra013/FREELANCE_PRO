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
    logoUrl?: string;
  };
  to: {
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    clientPhone?: string;
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
    total?: number;
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
    console.log('Starting screenshot-match PDF generation with data:', invoiceData);

    // Create a new jsPDF instance
    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Document Dimensions
    const pageWidth = doc.internal.pageSize.width; // 210mm for A4
    const pageHeight = doc.internal.pageSize.height; // 297mm for A4
    const sidebarWidth = pageWidth * 0.35; // ~73.5mm
    const contentStartX = sidebarWidth + 15; // Padding for right content
    const margin = 15;

    // --- LEFT SIDEBAR (BLACK BACKGROUND) ---
    doc.setFillColor(35, 35, 35); // Dark Grey/Black (Hex #232323 approx)
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // 1. Logo (Top Left of Sidebar) - Replaces QR Code
    let sidebarCursorY = 30;
    const logoSize = 40;

    // White box for logo background (matches screenshot QR box style)
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, sidebarCursorY, logoSize, logoSize, 'F');

    if (invoiceData.from.logoUrl) {
      console.log('Attempting to load logo from:', invoiceData.from.logoUrl);

      try {
        let imgUrl = invoiceData.from.logoUrl;

        // Normalize URL: If relative, make it absolute based on current origin
        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
          // Ensure it starts with / if it doesn't
          if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;
          imgUrl = window.location.origin + imgUrl;
        }

        console.log('Normalized Logo URL:', imgUrl);

        // Comprehensive Image Loader
        const loadImageData = async (url: string): Promise<string> => {
          // Strategy 1: Fetch (Best for CORS-enabled resources and Data URLs)
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (fetchErr) {
            console.warn('Fetch strategy failed, trying Image/Canvas strategy:', fetchErr);
          }

          // Strategy 2: Image + Canvas (Fallback for some local scenarios)
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('No canvas context');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
              } catch (canvasErr) {
                reject(canvasErr);
              }
            };

            img.onerror = () => reject(new Error('Image load failed'));
            img.src = url;
          });
        };

        const logoDataUrl = await loadImageData(imgUrl);

        // Add image to PDF
        // Using 'PNG' as default, but jsPDF auto-detects from Data URL usually
        doc.addImage(
          logoDataUrl,
          'PNG',
          margin + 2,
          sidebarCursorY + 2,
          logoSize - 4,
          logoSize - 4
        );
        console.log('Logo successfully added to PDF');
      } catch (e) {
        console.error('All logo loading strategies failed:', e);
        // Fallback text
        doc.setFontSize(8);
        doc.setTextColor(255, 0, 0); // Red text for visibility of error
        doc.text('LOGO ERR', margin + 12, sidebarCursorY + 20);
      }
    } else {
      console.log('No logo URL provided in invoice data');
      // Placeholder if no logo
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('LOGO', margin + 12, sidebarCursorY + 20);
    }

    sidebarCursorY += logoSize + 20;

    // 2. Dates Section
    doc.setTextColor(255, 255, 255); // White text

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, sidebarCursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoiceData.invoiceDate, margin, sidebarCursorY + 6);

    sidebarCursorY += 15;

    // Due Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', margin, sidebarCursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoiceData.dueDate, margin, sidebarCursorY + 6);

    sidebarCursorY += 20;

    // Divider Line
    doc.setDrawColor(100, 100, 100); // Light grey line
    doc.setLineWidth(0.5);
    doc.line(margin, sidebarCursorY, sidebarWidth - margin, sidebarCursorY);

    sidebarCursorY += 15;

    // 3. "Billed To" Section (Client Info)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', margin, sidebarCursorY);
    sidebarCursorY += 10;

    const printField = (label: string, value: string, y: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(label, margin, y);
      const labelWidth = doc.getTextWidth(label);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(value, margin + labelWidth + 2, y);
      return y + 6;
    };

    // Client Name
    sidebarCursorY = printField(
      'Name:',
      invoiceData.to.clientName || 'Client Name',
      sidebarCursorY
    );

    // Company
    sidebarCursorY = printField(
      'Company:',
      invoiceData.to.clientCompany || 'Client Company',
      sidebarCursorY
    );

    // Email
    sidebarCursorY = printField(
      'Email:',
      invoiceData.to.clientEmail || 'Client Email',
      sidebarCursorY,
      9
    );

    sidebarCursorY += 15;

    // 4. "From" Section (User Info)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Ensure white text
    doc.text('From:', margin, sidebarCursorY);
    sidebarCursorY += 10;

    // Business Name
    sidebarCursorY = printField(
      'Business:',
      invoiceData.from.businessName || 'Business Name',
      sidebarCursorY
    );

    // Phone
    sidebarCursorY = printField(
      'Phone:',
      invoiceData.from.phoneNumber || 'Business Phone',
      sidebarCursorY,
      9
    );

    sidebarCursorY += 15;

    // --- RIGHT CONTENT (WHITE BACKGROUND) ---
    let contentY = 20;

    // Adjust contentY if needed
    contentY += 10;

    // 2. INVOICE Title
    doc.setFontSize(42);
    doc.setTextColor(35, 35, 35); // Dark Grey
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', contentStartX, contentY);

    contentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Document Payment Information', contentStartX, contentY);

    contentY += 15;

    // 3. Info Box (Account No / Invoice No)
    const boxWidth = pageWidth - contentStartX - 10; // Reduced right margin to 10
    const boxHeight = 16; // Slimmer height

    doc.setFillColor(248, 248, 248); // Very light grey
    doc.rect(contentStartX, contentY, boxWidth, boxHeight, 'F');

    // Vertical separator in box
    doc.setDrawColor(220, 220, 220);
    doc.line(
      contentStartX + boxWidth / 2,
      contentY + 3,
      contentStartX + boxWidth / 2,
      contentY + boxHeight - 3
    );

    const boxMidY = contentY + 5;

    // Left side of box (Account No - Placeholder or from bank info)
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Account No:', contentStartX + 10, boxMidY);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.accountNumber || 'N/A', contentStartX + 10, boxMidY + 7);

    // Right side of box (Invoice No)
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Invoice No:', contentStartX + boxWidth / 2 + 10, boxMidY);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.invoiceNumber, contentStartX + boxWidth / 2 + 10, boxMidY + 7);

    contentY += boxHeight + 15;

    // 4. Payment Method Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment', contentStartX, contentY);
    doc.text('Method', contentStartX, contentY + 5);

    // Horizontal divider small
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(contentStartX, contentY + 9, contentStartX + 15, contentY + 9);

    // Payment Details
    const paymentX = contentStartX + 35;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    // Account Name
    doc.text('Account Name', paymentX, contentY);
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.accountHolderName || '', paymentX + 40, contentY);

    contentY += 5;

    // UPI ID
    doc.setTextColor(100, 100, 100);
    doc.text('UPI ID', paymentX, contentY);
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.payment.upiId || 'N/A', paymentX + 40, contentY);

    contentY += 20;

    const items: NonNullable<InvoiceData['items']> = invoiceData.items || [
      {
        description: invoiceData.project.name || 'Project',
        quantity: 1,
        rate: invoiceData.project.amount || 0,
        amount: invoiceData.project.amount || 0,
        total: invoiceData.project.amount || 0,
      },
    ];

    // Calculate total if 0
    let calculatedSubtotal = 0;
    items.forEach((item) => {
      calculatedSubtotal += item.total || item.amount || 0;
    });

    // Use provided subtotal or calculated one
    const displaySubtotal = invoiceData.subtotal || calculatedSubtotal;
    const displayTax = invoiceData.taxAmount || 0;
    const displayTotal = invoiceData.total || displaySubtotal + displayTax;

    const tableData = items.map((item) => [
      item.description || '',
      `$${(item.rate || 0).toFixed(2)}`,
      (item.quantity || 0).toString(), // Using "Unit" column for Quantity/Hours
      `$${(item.total || item.amount || 0).toFixed(2)}`,
    ]);

    // 5. Items Table
    // Move the table to the bottom section of the page
    // Adjusted to 160 to give more space from the bottom (was 180)
    const minTableY = 160;
    const tableY = Math.max(contentY + 10, minTableY);

    autoTable(doc, {
      startY: tableY,
      margin: { left: contentStartX, right: 10 }, // Align with right content area
      head: [['Item Description', 'Rate', 'Unit', 'Subtotal']],
      body: tableData,

      theme: 'grid', // Changed to grid for borders
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, // Compact and equal spacing
        textColor: [0, 0, 0],
        valign: 'middle', // Vertical center alignment
        lineWidth: 0.1, // Thin border
        lineColor: [220, 220, 220], // Light grey border
      },
      headStyles: {
        fillColor: [35, 35, 35], // Black Header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, // Match body padding for consistency
        lineWidth: 0.1,
        lineColor: [35, 35, 35], // Black border for header
      },
      columnStyles: {
        0: { cellWidth: 'auto', minCellWidth: 40 }, // Description - Ensure it doesn't get crushed
        1: { cellWidth: 25, halign: 'left' }, // Rate
        2: { cellWidth: 15, halign: 'left' }, // Unit
        3: { cellWidth: 30, halign: 'right' }, // Subtotal
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });

    // 6. Totals Section
    const lastTableY = (doc as any).lastAutoTable?.finalY;

    // Position totals below the table
    // We want them to stay together since we moved the table to the bottom
    let totalsY = lastTableY + 10;

    const totalsWidth = 80;
    const totalsX = pageWidth - margin - totalsWidth;

    // Subtotal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal', totalsX, totalsY);
    doc.text(':', totalsX + 25, totalsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${displaySubtotal.toFixed(2)}`, pageWidth - margin, totalsY, {
      align: 'right',
    });

    totalsY += 8;

    // Tax
    doc.setFont('helvetica', 'bold');
    doc.text(`Tax (${invoiceData.taxRate || 0}%)`, totalsX, totalsY);
    doc.text(':', totalsX + 25, totalsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${displayTax.toFixed(2)}`, pageWidth - margin, totalsY, {
      align: 'right',
    });

    totalsY += 12; // Increased spacing

    // Total Section with Black Background
    doc.setFillColor(35, 35, 35); // Black background
    // Draw rect: x, y, width, height
    // Adjust x to include some padding on the left
    const totalBoxX = totalsX - 5;
    // Width = totalsWidth + 5 (left padding) + 5 (right padding)
    doc.rect(totalBoxX, totalsY - 8, totalsWidth + 10, 12, 'F');

    // Total Text
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, totalsY);

    // Remove the colon for cleaner look in the box, or keep it?
    // Usually boxed totals just have Label ...... Amount.
    // Let's keep it consistent but white.
    // doc.text(':', totalsX + 25, totalsY); // Maybe skip colon for the box style

    doc.text(`$${displayTotal.toFixed(2)}`, pageWidth - margin, totalsY, {
      align: 'right',
    });

    // Reset text color for footer
    doc.setTextColor(0, 0, 0);

    // 7. Footer
    const footerY = pageHeight - 30;

    // Remove Lorem Ipsum (Terms)
    // Left: Contact Info (Email and Address) - Moved from right to left

    const contactX = contentStartX; // Align with content start

    // Email
    doc.setFillColor(35, 35, 35);
    doc.rect(contactX, footerY - 2, 6, 6, 'F'); // Email icon box
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text('@', contactX + 1.5, footerY + 2);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail', contactX + 10, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceData.from.businessEmail || 'Business Email', contactX + 10, footerY + 5);

    // Address (spaced out from email, maybe below or to the right?
    // Screenshot had them stacked vertically on the right.
    // If we move to left, vertical stack is fine.

    const addressY = footerY + 12;

    doc.setFillColor(35, 35, 35);
    doc.rect(contactX, addressY - 2, 6, 6, 'F'); // Location icon box
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text('L', contactX + 2, addressY + 2);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Address', contactX + 10, addressY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const addressStr = invoiceData.from.businessAddress || 'Business Address';
    const shortAddress = addressStr.split('\n')[0]; // Keep it short
    doc.text(shortAddress, contactX + 10, addressY + 5);

    return doc.output('arraybuffer') as ArrayBuffer;
  } catch (error) {
    console.error('Error generating screenshot-match PDF:', error);
    throw error;
  }
};

// ... export stubs ...
export const downloadBlueInvoicePDF = async (invoiceData: InvoiceData) => {
  const fileSaver = await import('file-saver');
  const saveAs = fileSaver.default || fileSaver.saveAs || fileSaver;
  const buffer = await generateNewInvoicePDF(invoiceData);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  saveAs(blob, `invoice-${invoiceData.invoiceNumber}.pdf`);
};

export const getBlueInvoicePDFDataURL = async (invoiceData: InvoiceData) => {
  const buffer = await generateNewInvoicePDF(invoiceData);
  const blob = new Blob([buffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};
