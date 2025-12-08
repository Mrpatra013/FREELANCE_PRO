import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/[id] - Get a specific invoice
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const body = await request.json();
    const { projectId, amount, dueDate, status } = body;

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Validate required fields
    if (!projectId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Project ID, amount, and due date are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate status
    const validStatuses = ['PAID', 'UNPAID'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      projectId,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      dueDate: new Date(dueDate),
      status: status || existingInvoice.status || 'UNPAID',
    };

    console.log('Updating invoice with status:', status);

    // If status is being set to PAID, set paidAt to current timestamp
    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }
    // If status is being changed from PAID to something else, clear paidAt
    else if (existingInvoice.status === 'PAID' && status !== 'PAID') {
      updateData.paidAt = null;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('DELETE /api/invoices/[id] called with id:', id);
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      console.log('DELETE invoice: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      console.log('DELETE invoice: User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingInvoice) {
      console.log('DELETE invoice: Invoice not found or not owned by user');
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    console.log('DELETE invoice: Successfully deleted');
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    // Return detailed error message if possible
    const errorMessage = error.message || 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
