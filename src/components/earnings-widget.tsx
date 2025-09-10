'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

interface EarningsSummary {
  netEarnings: number;
  monthlyEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  currency: string;
}

export function EarningsWidget() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/earnings/summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }
      
      const data = await response.json();
      setEarnings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load earnings');
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatCurrencyDetailed = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span>Earnings unavailable</span>
      </div>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          {/* Net Earnings */}
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              {formatCurrency(earnings.netEarnings)}
            </span>
          </div>
          
          {/* Monthly Earnings */}
          <Badge variant="secondary" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {formatCurrency(earnings.monthlyEarnings)}
          </Badge>
          
          {/* Today's Earnings */}
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatCurrency(earnings.todayEarnings)}
          </Badge>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Earnings Overview</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Net Earnings</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrencyDetailed(earnings.netEarnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrencyDetailed(earnings.monthlyEarnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                    <p className="font-semibold text-purple-600">
                      {formatCurrencyDetailed(earnings.weeklyEarnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrencyDetailed(earnings.todayEarnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Based on paid invoices only
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}