import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({ title, value, trend, icon: Icon, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-3xl font-semibold">{value}</p>
          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-sm font-medium',
                trend >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
