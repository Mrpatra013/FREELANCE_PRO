import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/earnings/monthly - Get monthly earnings breakdown for charts
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get last 12 months of data
    const now = new Date();
    const monthlyData = [];
    
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
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
      
      const earnings = monthlyEarningsResult._sum.amount ? Number(monthlyEarningsResult._sum.amount) : 0;
      
      monthlyData.push({
        month: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`,
        earnings,
        monthName: `${targetDate.toLocaleString('en-US', { month: 'long' })} ${targetDate.getFullYear()}`,
      });
    }

    // Also get year-to-date total
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearToDateResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: startOfYear,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const yearToDateEarnings = yearToDateResult._sum.amount ? Number(yearToDateResult._sum.amount) : 0;

    // Calculate previous year total for growth rate
    const previousYearStart = new Date(startOfYear.getFullYear() - 1, 0, 1);
    const previousYearEnd = new Date(startOfYear.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    
    const previousYearResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: previousYearStart,
          lte: previousYearEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const previousYearTotal = previousYearResult._sum.amount ? Number(previousYearResult._sum.amount) : 0;
    
    // Calculate growth rate
    let growthRate = 0;
    if (previousYearTotal > 0) {
      growthRate = ((yearToDateEarnings - previousYearTotal) / previousYearTotal) * 100;
    } else if (yearToDateEarnings > 0) {
      growthRate = 100; // 100% growth if previous year was 0
    }

    return NextResponse.json({
      monthlyData,
      yearToDateTotal: yearToDateEarnings,
      previousYearTotal,
      growthRate,
      currency: 'USD',
    });
  } catch (error) {
    console.error('Error calculating monthly earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}