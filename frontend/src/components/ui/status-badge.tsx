import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const statusStyles: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  DRAFT: 'secondary',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  PENDING: 'warning',
  PAID: 'success',
  PARTIALLY_PAID: 'info',
  OVERDUE: 'destructive',
  ACTIVE: 'success',
  INACTIVE: 'secondary',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusStyles[status] || 'default'} className={cn('capitalize', className)}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </Badge>
  );
}
