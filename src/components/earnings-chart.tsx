'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MonthlyEarningsData {
  monthlyData: {
    month: string;
    earnings: number;
  }[];
  yearToDateTotal: number;
  previousYearTotal: number;
  growthRate: number;
}

interface EarningsChartProps {
  className?: string;
}

export function EarningsChart({ className }: EarningsChartProps) {
  const [data, setData] = useState<MonthlyEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyEarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/earnings/monthly');
        
        if (!response.ok) {
          throw new Error('Failed to fetch monthly earnings');
        }
        
        const earningsData = await response.json();
        setData(earningsData);
      } catch (err) {
        console.error('Error fetching monthly earnings:', err);
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyEarnings();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    const month = date.getMonth();
    const year = date.getFullYear().toString().slice(-2);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month]} ${year}`;
  };

  const getMaxEarnings = () => {
    if (!data || data.monthlyData.length === 0) return 0;
    return Math.max(...data.monthlyData.map(item => item.earnings));
  };

  const getTrendIcon = () => {
    if (!data) return <Minus className="h-4 w-4" />;
    
    if (data.growthRate > 5) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (data.growthRate < -5) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!data) return 'text-gray-600';
    
    if (data.growthRate > 5) {
      return 'text-green-600';
    } else if (data.growthRate < -5) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Monthly Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Monthly Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {error || 'No earnings data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxEarnings = getMaxEarnings();
  const recentMonths = data.monthlyData.slice(-6); // Show last 6 months

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Earnings Trend</span>
          <div className="flex items-center gap-2 text-sm">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {data.growthRate > 0 ? '+' : ''}{(data.growthRate || 0).toFixed(1)}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Year-to-date summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Year to Date</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.yearToDateTotal)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">vs. Previous Year</p>
            <p className={`text-lg font-semibold ${getTrendColor()}`}>
              {formatCurrency(data.previousYearTotal)}
              <span className="text-sm ml-2">
                ({data.growthRate > 0 ? '+' : ''}{(data.growthRate || 0).toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Last 6 Months</h4>
          <div className="space-y-3">
            {recentMonths.map((month) => {
              const percentage = maxEarnings > 0 ? (month.earnings / maxEarnings) * 100 : 0;
              
              return (
                <div key={month.month} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{formatMonth(month.month)}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(month.earnings)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Monthly Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {data.monthlyData.slice(-12).map((month) => (
              <div key={month.month} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>{formatMonth(month.month)}</span>
                <span className="font-medium">
                  {formatCurrency(month.earnings)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}