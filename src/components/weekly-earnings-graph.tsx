'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface WeeklyEarningsData {
  weeklyData: {
    weekStart: string;
    weekEnd: string;
    label: string;
    earnings: number;
  }[];
  yearToDateTotal: number;
}

interface WeeklyEarningsGraphProps {
  className?: string;
}

export function WeeklyEarningsGraph({ className }: WeeklyEarningsGraphProps) {
  const [data, setData] = useState<WeeklyEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    const fetchWeeklyEarnings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/earnings/weekly');

        if (!response.ok) {
          throw new Error('Failed to fetch weekly earnings');
        }

        const earningsData = await response.json();
        setData(earningsData);
      } catch (err) {
        console.error('Error fetching weekly earnings:', err);
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyEarnings();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 font-semibold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-xs text-muted-foreground">{error || 'No data'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType('line')}
            className={`p-1 rounded ${
              chartType === 'line' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
            }`}
            title="Line Chart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-1 rounded ${
              chartType === 'bar' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted'
            }`}
            title="Bar Chart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          {formatCurrency(data.weeklyData.reduce((acc, curr) => acc + curr.earnings, 0))}
          <span className="text-xs font-normal text-muted-foreground ml-2">Last 8 weeks</span>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.replace('Week ', '')}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.replace('Week ', '')}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="earnings" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
