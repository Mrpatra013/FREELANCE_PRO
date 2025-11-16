import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { hashSync } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// GET /api/invoices - Get all invoices for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get projectId, pagination from query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam || '25', 10) || 25, 1), 100);
    const skip = (page - 1) * limit;

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
          select: {
            id: true,
            name: true,
            rate: true,
            client: {
              select: { id: true, name: true, email: true, company: true },
            },
          },
        },
      },
      take: limit,
      skip,
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
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      const name = (data.user.user_metadata as any)?.name || data.user.email.split('@')[0];
      const placeholder = hashSync(`supabase_${data.user.id}_placeholder`, 10);
      user = await prisma.user.create({
        data: {
          email: data.user.email,
          name,
          password: placeholder,
        },
        select: { id: true, email: true, name: true },
      });
    }

    const body = await request.json();
    const { projectId, amount, description, dueDate, status, freelancerInfo } = body;

    if (!projectId || !dueDate) {
      return NextResponse.json(
        { error: 'Project and due date are required' },
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

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date' },
        { status: 400 }
      );
    }

    const finalStatus = status === 'PAID' ? 'PAID' : 'UNPAID';

    const invoiceData: any = {
      invoiceNumber,
      userId: user.id,
      projectId,
      clientId: project.clientId,
      amount: parsedAmount,
      description,
      dueDate: due,
      status: finalStatus,
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
    if (finalStatus === 'PAID') {
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