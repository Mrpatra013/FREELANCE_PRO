import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/[id]/template-data - Get formatted data for invoice viewer/PDF generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        businessEmail: true,
        phoneNumber: true,
        businessAddress: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        ifscCode: true,
        upiId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the invoice and ensure it belongs to the user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Format dates
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    };

    // Prepare invoice data structure for template/PDF
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatDate(invoice.createdAt),
      dueDate: formatDate(invoice.dueDate),
      status: invoice.status,
      amount: Number(invoice.amount),
      from: {
        businessName: invoice.freelancerCompanyName || user.companyName || user.name,
        phoneNumber: user.phoneNumber || '',
        businessAddress: user.businessAddress || '',
        businessEmail: invoice.freelancerBusinessEmail || user.businessEmail || user.email
      },
      to: {
        clientName: invoice.project.client.name,
        clientEmail: invoice.project.client.email,
        clientCompany: invoice.project.client.company || ''
      },
      project: {
        name: invoice.project.name,
        description: invoice.description || invoice.project.description || '',
        rate: Number(invoice.project.rate) || 0,
        amount: Number(invoice.amount) || 0
      },
      payment: {
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        accountHolderName: user.accountHolderName || user.name,
        ifscCode: user.ifscCode || '',
        upiId: user.upiId || ''
      },
      items: [{
        description: invoice.description || invoice.project.name || 'Project work',
        hours: 1,
        rate: Number(invoice.amount),
        total: Number(invoice.amount)
      }],
      subtotal: Number(invoice.amount),
      taxRate: 0,
      taxAmount: 0,
      paymentTerms: ''
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice template data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}