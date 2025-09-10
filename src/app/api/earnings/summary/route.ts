import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/earnings/summary - Get earnings summary for authenticated user
export async function GET() {
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

    // Calculate net earnings (all-time paid invoices)
    const netEarningsResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate current month earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyEarningsResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate today's earnings
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayEarningsResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate this week's earnings
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weeklyEarningsResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Convert Decimal to number and handle null values
    const netEarnings = netEarningsResult._sum.amount ? Number(netEarningsResult._sum.amount) : 0;
    const monthlyEarnings = monthlyEarningsResult._sum.amount ? Number(monthlyEarningsResult._sum.amount) : 0;
    const todayEarnings = todayEarningsResult._sum.amount ? Number(todayEarningsResult._sum.amount) : 0;
    const weeklyEarnings = weeklyEarningsResult._sum.amount ? Number(weeklyEarningsResult._sum.amount) : 0;

    return NextResponse.json({
      netEarnings,
      monthlyEarnings,
      todayEarnings,
      weeklyEarnings,
      currency: 'USD', // Default currency, can be made configurable later
    });
  } catch (error) {
    console.error('Error calculating earnings summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}