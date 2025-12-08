import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

// POST /api/invoices/generate - Generate invoice data for PDF creation
export async function POST(request: NextRequest) {
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
      include: {
        client: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: {
        project: {
          userId: user.id,
        },
      },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Current date and due date (30 days from now)
    const currentDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(currentDate.getDate() + 30);

    // Format dates
    const formatDate = (date: Date) => {
      return format(date, 'dd-MM-yyyy');
    };

    // Prepare invoice data structure
    const invoiceData = {
      invoiceNumber,
      invoiceDate: formatDate(currentDate),
      dueDate: formatDate(dueDate),
      terms: 'Payment due within 30 days',
      from: {
        businessName: user.companyName || user.name,
        phoneNumber: user.phoneNumber || '',
        businessAddress: user.businessAddress || '',
        businessEmail: user.businessEmail || user.email,
      },
      to: {
        clientName: project.client.name,
        clientEmail: project.client.email,
        clientPhone: project.client.phone || '',
        clientAddress: project.client.address || '',
      },
      project: {
        name: project.name,
        description: project.description || '',
        rate: Number(project.rate),
        amount: Number(project.rate),
      },
      payment: {
        bankName: '',
        accountNumber: '',
        accountHolderName: user.name,
        ifscCode: '',
        upiId: '',
      },
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}