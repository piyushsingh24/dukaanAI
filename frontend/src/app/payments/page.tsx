'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Send } from 'lucide-react';
import { Payment } from '@/types';
import api from '@/services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/payments'),
      api.get('/payments/pending'),
    ])
      .then(([res1, res2]) => {
        setPayments(res1.data.data?.items ?? []);
        setPendingCount(res2.data.data?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <PageHeader title="Payments" description="Track payments and outstanding balances">
        {pendingCount > 0 && (
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" /> Send Reminders
          </Button>
        )}
      </PageHeader>

      {pendingCount > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {pendingCount} pending payment(s) require follow-up
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No payment records yet</h3>
          <p className="text-sm text-muted-foreground">Payments will be tracked automatically.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Method</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm font-medium">{payment.customer?.fullName}</td>
                  <td className="p-4 text-sm font-medium">₹{payment.amount.toLocaleString()}</td>
                  <td className="p-4 text-sm capitalize">{payment.paymentMethod.toLowerCase()}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        payment.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100'
                          : payment.paymentStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                      }`}
                    >
                      {payment.paymentStatus.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
