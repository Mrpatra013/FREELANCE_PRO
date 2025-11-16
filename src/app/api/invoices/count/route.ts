import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/invoices/count - Get the count of invoices for the authenticated user
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

    // Count invoices for this user
    const invoiceCount = await prisma.invoice.count({
      where: {
        project: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ count: invoiceCount });
  } catch (error) {
    console.error('Error counting invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}