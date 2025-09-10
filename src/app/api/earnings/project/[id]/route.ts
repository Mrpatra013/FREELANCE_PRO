import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/earnings/project/[id] - Get project-specific earnings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        client: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all invoices for this project
    const invoices = await prisma.invoice.findMany({
      where: {
        projectId: id,
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const totalPaid = invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const outstanding = totalInvoiced - totalPaid;

    // Calculate status breakdown
    const statusBreakdown = {
      PAID: invoices.filter(inv => inv.status === 'PAID').length,
      UNPAID: invoices.filter(inv => inv.status === 'UNPAID').length,
    };

    // Calculate payment completion percentage
    const paymentCompletionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    // Get recent payments (last 5 paid invoices)
    const recentPayments = invoices
      .filter(invoice => invoice.status === 'PAID' && invoice.paidAt)
      .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())
      .slice(0, 5)
      .map(invoice => ({
        id: invoice.id,
        amount: Number(invoice.amount),
        paidAt: invoice.paidAt,
        invoiceNumber: invoice.invoiceNumber,
      }));

    // Format invoices for response
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      description: invoice.description,
    }));

    return NextResponse.json({
      projectId: id,
      projectName: project.name,
      clientName: project.client.name,
      totalInvoiced,
      totalPaid,
      outstanding,
      paymentCompletionRate: Math.round(paymentCompletionRate * 100) / 100,
      statusBreakdown,
      recentPayments,
      invoices: formattedInvoices,
      currency: 'USD',
    });
  } catch (error) {
    console.error('Error calculating project earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}