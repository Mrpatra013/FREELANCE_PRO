'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface MonthlyEarningsData {
  monthlyData: {
    month: string;
    earnings: number;
  }[];
  yearToDateTotal: number;
  previousYearTotal: number;
  growthRate: number;
}

interface MonthlyEarningsGraphProps {
  className?: string;
}

export function MonthlyEarningsGraph({ className }: MonthlyEarningsGraphProps) {
  const [data, setData] = useState<MonthlyEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

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

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{formatMonth(label)}</p>
          <p className="text-blue-600">
            <span className="font-medium">Earnings: </span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Monthly Earnings Graph</CardTitle>
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
          <CardTitle>Monthly Earnings Graph</CardTitle>
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

  // Prepare chart data with formatted month names
  const chartData = data.monthlyData.slice(-12).map(item => ({
    month: formatMonth(item.month),
    earnings: item.earnings,
    fullMonth: item.month
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Earnings Graph</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon()}
              <span className={getTrendColor()}>
                {data.growthRate > 0 ? '+' : ''}{(data.growthRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 text-xs rounded ${
                  chartType === 'line' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 text-xs rounded ${
                  chartType === 'bar' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bar
              </button>
            </div>
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

        {/* Interactive Chart */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Last 12 Months</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="earnings" 
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Highest Month</p>
            <p className="font-semibold">
              {formatCurrency(Math.max(...data.monthlyData.map(m => m.earnings)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-semibold">
              {formatCurrency(data.monthlyData.reduce((sum, m) => sum + m.earnings, 0) / data.monthlyData.length)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="font-semibold">
              {formatCurrency(data.monthlyData[data.monthlyData.length - 1]?.earnings || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Growth</p>
            <p className={`font-semibold ${getTrendColor()}`}>
              {data.growthRate > 0 ? '+' : ''}{(data.growthRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}