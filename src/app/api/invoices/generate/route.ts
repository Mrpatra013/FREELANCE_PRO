import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST /api/invoices/generate - Generate invoice data for PDF creation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
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
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
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
        businessEmail: user.businessEmail || user.email
      },
      to: {
        clientName: project.client.name,
        clientEmail: project.client.email,
        clientCompany: project.client.company || ''
      },
      project: {
        name: project.name,
        description: project.description || '',
        rate: Number(project.rate),
        amount: Number(project.rate)
      },
      payment: {
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        accountHolderName: user.accountHolderName || user.name,
        ifscCode: user.ifscCode || '',
        upiId: user.upiId || ''
      }
    };

    return NextResponse.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}