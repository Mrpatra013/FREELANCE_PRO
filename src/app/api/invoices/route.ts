import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/invoices - Get all invoices for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get projectId from query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Build where clause based on whether projectId is provided
    const whereClause = projectId 
      ? {
          projectId: projectId,
          userId: user.id,
        }
      : {
          project: {
            userId: user.id,
          },
        };

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { projectId, amount, description, dueDate, status, freelancerInfo } = body;

    // Validate required fields
    if (!projectId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Project, amount, and due date are required' },
        { status: 400 }
      );
    }

    // Verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
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

    // Get client ID from the project
    const projectWithClient = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });

    // Prepare invoice data
    const invoiceData: any = {
      invoiceNumber,
      userId: user.id,
      projectId,
      clientId: projectWithClient!.clientId,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      description,
      dueDate: new Date(dueDate),
      status: status || 'UNPAID',
    };
    
    console.log('Creating invoice with status:', status);

    // Add freelancer information if provided
    if (freelancerInfo) {
      invoiceData.freelancerCompanyName = freelancerInfo.companyName;
      invoiceData.freelancerBusinessEmail = freelancerInfo.businessEmail;
      if (freelancerInfo.logoUrl) {
        invoiceData.freelancerLogoUrl = freelancerInfo.logoUrl;
      }
    }
    
    // Generate invoice data for PDF generation
    // This will be used by the frontend to generate the PDF
    // using the new structure

    // If status is PAID, set paidAt to current timestamp
    if (status === 'PAID') {
      invoiceData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}