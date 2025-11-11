import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

// Type assertion for autoTable
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF
  lastAutoTable?: {
    finalY: number
  }
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  amount?: number
  status?: string
  from: {
    businessName: string
    phoneNumber: string
    businessAddress: string
    businessEmail: string
  }
  to: {
    clientName: string
    clientEmail: string
    clientCompany?: string
  }
  project: {
    name: string
    description?: string
    rate?: number
    amount: number
  }
  payment: {
    bankName: string
    accountNumber: string
    accountHolderName?: string
    ifscCode: string
    upiId: string
  }
  items?: Array<{
    description: string
    hours: number
    rate: number
    total: number
  }>
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  paymentTerms?: string
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<Uint8Array> => {
  try {
    console.log('Starting PDF generation with data:', invoiceData);
    const doc = new jsPDF() as jsPDFWithAutoTable
    
    // Ensure autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.error('autoTable plugin not loaded properly');
      throw new Error('autoTable plugin not available');
    }
  
  // Set up the document
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  
  // Add header background
  doc.setFillColor(245, 245, 245) // Light gray background
  doc.rect(0, 0, pageWidth, 60, 'F')
  
  // Invoice title
  doc.setFontSize(28)
  doc.setTextColor(50, 50, 50)
  doc.text('INVOICE', 105, 30, { align: 'center' })
  
  // Add subtle line under header
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(0, 60, pageWidth, 60)
  
  // Invoice details (top right)
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 140, 70)
  doc.text(`Date: ${invoiceData.invoiceDate}`, 140, 80)
  
  let yPos = 80
  
  // Add section backgrounds
  doc.setFillColor(250, 250, 250) // Very light gray for sections
  doc.roundedRect(margin, yPos - 10, (pageWidth - (margin * 2)) / 2 - 10, 90, 3, 3, 'F')
  doc.roundedRect(pageWidth / 2 + 5, yPos - 10, (pageWidth - (margin * 2)) / 2 - 5, 90, 3, 3, 'F')
  
  // From section
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('FROM:', 20, 60)
  
  doc.setFont('helvetica', 'normal')
  yPos = 70
  
  // Business Name
  doc.setFontSize(12)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text(invoiceData.from.businessName, 20, yPos)
  yPos += 10
  
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  
  // Phone Number
  doc.text(`Phone: ${invoiceData.from.phoneNumber}`, 20, yPos)
  yPos += 10
  
  // Business Address
  const addressLines = invoiceData.from.businessAddress.split('\n')
  addressLines.forEach((line: string) => {
    doc.text(line, 20, yPos)
    yPos += 10
  })
  
  // Business Email
  doc.text(`Email: ${invoiceData.from.businessEmail}`, 20, yPos)
  yPos += 20
  
  // Bill To section
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('TO:', 20, 120)
  
  doc.setFont('helvetica', 'normal')
  let clientY = 130
  
  // Client Name/Company
  doc.setFontSize(12)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text(invoiceData.to.clientName, 20, clientY)
  clientY += 10
  
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  
  // Client Email
  doc.text(`Email: ${invoiceData.to.clientEmail}`, 20, clientY)
  clientY += 15;

  
  // Project Details section
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJECT DETAILS:', 20, 160)
  
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  
  // Project Name
  doc.setFontSize(11)
  doc.setTextColor(70, 70, 70)
  doc.text(`Project: ${invoiceData.project.name}`, 20, 170)
  
  // Project Rate and Amount
  doc.text(`Rate: $${invoiceData.project.rate?.toFixed(2) || '0.00'} | Total: $${invoiceData.project.amount.toFixed(2)}`, 20, 180)
  
  // Project Description (if available)
  if (invoiceData.project.description) {
    doc.text(`Description: ${invoiceData.project.description}`, 20, 190)
  }
  
  // Table for items
  const tableY = 200
  
  // Table headers
  const tableHeaders = ['Description', 'Hours', 'Rate/Hour', 'Total']
  const tableData = []
  
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach(item => {
      tableData.push([
        item.description,
        item.hours.toString(),
        `$${item.rate.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ])
    })
  } else {
    // Default item based on project
    const amount = invoiceData.amount || invoiceData.project?.amount || 0;
    tableData.push([
      invoiceData.project.description || invoiceData.project.name,
      '1',
      `$${amount.toFixed(2)}`,
      `$${amount.toFixed(2)}`
    ]);
  }
  
  // Draw table
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: tableY + 15,
    theme: 'striped',
    headStyles: {
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 12
    },
    bodyStyles: {
      fontSize: 11,
      cellPadding: 8
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })
  
  // Get final Y position after table
  const finalY = doc.lastAutoTable?.finalY || 200
  const adjustedFinalY = finalY + 20
  
  // Add a light gray box for the totals section
  doc.setFillColor(245, 245, 245)
  doc.rect(pageWidth - margin - 150, adjustedFinalY, 150, 80, 'F')
  
  // Subtotal, Tax, Total section
  const totalsX = pageWidth - margin - 20
  let totalsY = adjustedFinalY + 20
  
  // Subtotal
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', pageWidth - margin - 140, totalsY)
  const subtotalAmount = invoiceData.subtotal || invoiceData.amount || 0;
  doc.text(`$${subtotalAmount.toFixed(2)}`, totalsX, totalsY, { align: 'right' })
  
  // Tax
  totalsY += 15
  const taxRate = invoiceData.taxRate || 0
  doc.text(`Tax (${taxRate}%)`, pageWidth - margin - 140, totalsY)
  doc.text(`$${(invoiceData.taxAmount || 0).toFixed(2)}`, totalsX, totalsY, { align: 'right' })
  
  // Divider line
  totalsY += 10
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(pageWidth - margin - 140, totalsY, totalsX, totalsY)
  
  // Total Due
  totalsY += 15
  doc.setFontSize(14)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL DUE:', pageWidth - margin - 140, totalsY)
  const totalAmount = invoiceData.amount || subtotalAmount;
  doc.text(`$${totalAmount.toFixed(2)}`, totalsX, totalsY, { align: 'right' })
  
  // Payment Terms section removed to eliminate 'Net 30' text
  
  // Terms and Conditions section
  const termsY = totalsY + 40
  
  // Add light gray background for terms section
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, termsY - 10, pageWidth / 2 - margin - 10, 60, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMS AND CONDITIONS', margin + 10, termsY + 10)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Total payment must be completed within 30 days.', margin + 10, termsY + 30)
  doc.text('Thank you for your business!', margin + 10, termsY + 45)
  
  // Payment Information section
  const paymentInfoY = termsY + 80
  
  // Add light gray background for payment section
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, paymentInfoY - 10, pageWidth - (margin * 2), 120, 'F')
  
  doc.setFontSize(14)
  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INFORMATION:', 20, 210)
  
  let paymentY = 220
  
  // Banking Details
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  
  // Bank details
  doc.text(`Bank: ${invoiceData.payment.bankName}`, 20, paymentY)
  paymentY += 10
  
  doc.text(`Account: ${invoiceData.payment.accountNumber}`, 20, paymentY)
  paymentY += 10
  
  doc.text(`IFSC: ${invoiceData.payment.ifscCode}`, 20, paymentY)
  paymentY += 10
  
  doc.text(`UPI: ${invoiceData.payment.upiId}`, 20, paymentY)
  
  // Footer with GeneralBlue branding
  const footerY = pageHeight - 30
  
  // Add footer line
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10)
  
  // Left side - branding
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('powered by', margin, footerY)
  
  doc.setFontSize(14)
  doc.setTextColor(59, 130, 246)
  doc.text('GeneralBlue', margin + 25, footerY)
  
  // Right side - invoice number and date
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Invoice #${invoiceData.invoiceNumber} | ${invoiceData.invoiceDate}`, pageWidth - margin, footerY, { align: 'right' })
  
  const pdfArrayBuffer = doc.output('arraybuffer');
  console.log('PDF generation completed successfully');
  return new Uint8Array(pdfArrayBuffer) as Uint8Array;
} catch (error) {
  console.error('PDF generation error:', error);
  throw error;
}
}

export const downloadInvoicePDF = async (invoiceData: InvoiceData, filename?: string) => {
  try {
    const pdfBytes = await generateInvoicePDF(invoiceData)
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `invoice-${invoiceData.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading invoice PDF:', error)
    throw error
  }
}

export const getInvoicePDFBlob = async (invoiceData: InvoiceData): Promise<Blob> => {
  const pdfBytes = await generateInvoicePDF(invoiceData)
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
}

export const getInvoicePDFDataURL = async (invoiceData: InvoiceData): Promise<string> => {
  const pdfBytes = await generateInvoicePDF(invoiceData)
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}