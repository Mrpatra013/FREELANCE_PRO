'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectEarningsData {
  projectId: string;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  paymentRate: number;
  invoices: {
    id: string;
    amount: number;
    status: 'PAID' | 'UNPAID';
    paidAt?: string;
    createdAt: string;
    dueDate?: string;
  }[];
  statusBreakdown: {
    PAID: number;
    UNPAID: number;
  };
  recentPayments: {
    id: string;
    amount: number;
    paidAt: string;
  }[];
}

interface ProjectEarningsProps {
  projectId: string;
}

export function ProjectEarnings({ projectId }: ProjectEarningsProps) {
  const [earnings, setEarnings] = useState<ProjectEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/earnings/project/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project earnings');
        }
        
        const data = await response.json();
        setEarnings(data);
      } catch (err) {
        console.error('Error fetching project earnings:', err);
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchEarnings();
    }
  }, [projectId]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />;
      case 'SENT':
        return <Clock className="h-4 w-4" />;
      case 'DRAFT':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !earnings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {error || 'No earnings data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Project Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(earnings.totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Invoiced</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(earnings.totalInvoiced)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(earnings.outstanding)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Invoice Status Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Invoice Status</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-[100px] place-items-center w-fit mx-auto">
            {Object.entries(earnings.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  {status}
                </div>
                <p className="text-sm font-semibold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        {earnings.recentPayments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recent Payments</h3>
            <div className="space-y-2">
              {earnings.recentPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(payment.paidAt), 'MMM d, yyyy')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">All Invoices</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {earnings.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </Badge>
                  <span className="font-medium">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {invoice.status === 'PAID' && invoice.paidAt ? (
                    <span>Paid {format(new Date(invoice.paidAt), 'MMM d, yyyy')}</span>
                  ) : invoice.dueDate ? (
                    <span>Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                  ) : (
                    <span>Created {format(new Date(invoice.createdAt), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}