import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

// GET /api/invoices/[id]/template-data - Get formatted data for invoice viewer/PDF generation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        logoUrl: true,
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
      return format(new Date(date), 'dd-MM-yyyy');
    };

    // Parse description for detailed items (backward compatibility with plain text)
    let items = [];
    let subtotal = Number(invoice.amount);
    let taxRate = 0;
    let taxAmount = 0;
    let notes = '';

    try {
      if (invoice.description && invoice.description.startsWith('{')) {
        const parsedData = JSON.parse(invoice.description);
        if (parsedData.items && Array.isArray(parsedData.items)) {
          items = parsedData.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.price, // Map price to rate
            total: item.total,
          }));
          subtotal = parsedData.subtotal || subtotal;
          taxRate = parsedData.taxRate || 0;
          taxAmount = parsedData.taxAmount || 0;
          notes = parsedData.notes || '';
        }
      }
    } catch (e) {
      // Failed to parse, treat as plain text
      console.log('Description is not JSON or invalid:', e);
    }

    // Fallback if no items found in description
    if (items.length === 0) {
      items = [
        {
          description: invoice.description || invoice.project.name || 'Project work',
          quantity: 1, // Changed from hours to quantity for consistency
          rate: Number(invoice.amount),
          total: Number(invoice.amount),
        },
      ];
    }

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
        businessEmail: invoice.freelancerBusinessEmail || user.businessEmail || user.email,
        logoUrl: invoice.freelancerLogoUrl || user.logoUrl || null,
      },
      to: {
        clientName: invoice.project.client.name,
        clientEmail: invoice.project.client.email,
        clientPhone: invoice.project.client.phone || '',
        clientAddress: invoice.project.client.address || '',
      },
      project: {
        name: invoice.project.name,
        description: invoice.project.description || '',
        rate: Number(invoice.project.rate) || 0,
        amount: Number(invoice.amount) || 0,
      },
      payment: {
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        accountHolderName: user.accountHolderName || user.name,
        ifscCode: user.ifscCode || '',
        upiId: user.upiId || '',
      },
      items: items,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      notes: notes,
      paymentTerms: notes, // Use notes as payment terms/notes
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice template data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
