import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthlyEarningsGraph } from '@/components/monthly-earnings-graph';
import { EarningsDisplay } from '@/components/earnings-display';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Get dashboard statistics
  const [clientsCount, invoicesCount, projectsCount] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.invoice.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { userId: user.id } }),
  ]);

  // Calculate earnings data
  const netEarningsResult = await prisma.invoice.aggregate({
    where: {
      userId: user.id,
      status: 'PAID',
    },
    _sum: {
      amount: true,
    },
  });

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

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
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

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const dailyEarningsResult = await prisma.invoice.aggregate({
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

  const netEarnings = netEarningsResult._sum.amount ? Number(netEarningsResult._sum.amount) : 0;
  const monthlyEarnings = monthlyEarningsResult._sum.amount ? Number(monthlyEarningsResult._sum.amount) : 0;
  const weeklyEarnings = weeklyEarningsResult._sum.amount ? Number(weeklyEarningsResult._sum.amount) : 0;
  const dailyEarnings = dailyEarningsResult._sum.amount ? Number(dailyEarningsResult._sum.amount) : 0;



  // Get unpaid invoices
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      userId: user.id,
      status: 'UNPAID',
    },
    include: { project: { include: { client: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {/* Removed New Project button as requested */}
      </div>

      {/* Earnings Overview Cards */}
      <EarningsDisplay
        netEarnings={netEarnings}
        monthlyEarnings={monthlyEarnings}
        weeklyEarnings={weeklyEarnings}
        dailyEarnings={dailyEarnings}
      />

      {/* Earnings Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyEarningsGraph />
        
        {/* Business Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
            <CardDescription>
              Key business metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Clients</p>
                <p className="text-2xl font-bold">{clientsCount}</p>
                <p className="text-xs text-muted-foreground">Active relationships</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Projects</p>
                <p className="text-2xl font-bold">{projectsCount}</p>
                <p className="text-xs text-muted-foreground">Total created</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Invoices</p>
                <p className="text-2xl font-bold">{invoicesCount}</p>
                <p className="text-xs text-muted-foreground">Generated</p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>
            Invoices awaiting payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {unpaidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding payments. Great job!</p>
            ) : (
              unpaidInvoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-md border px-3 py-3 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Invoice #{invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.project.client.name} • {invoice.project.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {unpaidInvoices.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total outstanding: {unpaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  Manage invoices
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}