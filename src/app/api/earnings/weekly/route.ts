import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

// GET /api/earnings/weekly - Get weekly earnings breakdown for charts
export async function GET() {
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

    // Get last 8 weeks of data
    const now = new Date();
    const weeklyData = [];
    
    // We want current week + previous 7 weeks
    for (let i = 7; i >= 0; i--) {
      const targetDate = subWeeks(now, i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday start
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
      
      const weeklyEarningsResult = await prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: 'PAID',
          paidAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });
      
      const earnings = weeklyEarningsResult._sum.amount ? Number(weeklyEarningsResult._sum.amount) : 0;
      
      weeklyData.push({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        label: `Week ${format(weekStart, 'dd MMM')}`,
        earnings,
      });
    }

    // Also get year-to-date total
    const startOfYearDate = new Date(now.getFullYear(), 0, 1);
    const yearToDateResult = await prisma.invoice.aggregate({
      where: {
        userId: user.id,
        status: 'PAID',
        paidAt: {
          gte: startOfYearDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const yearToDateEarnings = yearToDateResult._sum.amount ? Number(yearToDateResult._sum.amount) : 0;

    return NextResponse.json({
      weeklyData,
      yearToDateTotal: yearToDateEarnings,
    });
  } catch (error) {
    console.error('Error fetching weekly earnings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
