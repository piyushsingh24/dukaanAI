'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ShoppingCart, IndianRupee, Wallet, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData } from '@/types';
import api from '@/services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Shell>
        <PageSkeleton />
      </Shell>
    );
  }

  const kpis = [
    { title: "Today's Orders", value: data?.ordersToday ?? 0, trend: 12, icon: ShoppingCart },
    { title: 'Revenue', value: `₹${(data?.revenue ?? 0).toLocaleString()}`, trend: 8, icon: IndianRupee },
    { title: 'Pending Payments', value: `₹${(data?.pendingPayments ?? 0).toLocaleString()}`, trend: -5, icon: Wallet },
    { title: 'Low Stock Items', value: data?.lowStockItems ?? 0, trend: 0, icon: Package },
  ];

  const revenueData = data?.revenueTrend ?? [];
  const ordersByStatus = data?.orderStatusDistribution ?? [];

  return (
    <Shell>
      <PageHeader title="Dashboard" description="What is happening today?" />

      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <motion.div key={kpi.title} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData.length > 0 ? revenueData : mockRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus.length > 0 ? ordersByStatus : mockOrderStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.recentActivity ?? mockActivity).slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.aiSuggestions ?? mockSuggestions).slice(0, 4).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <p className="text-sm font-medium">{suggestion.title}</p>
                  </div>
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

const mockRevenue = [
  { date: 'Mon', amount: 4200 },
  { date: 'Tue', amount: 3800 },
  { date: 'Wed', amount: 5100 },
  { date: 'Thu', amount: 4600 },
  { date: 'Fri', amount: 5900 },
  { date: 'Sat', amount: 6300 },
  { date: 'Sun', amount: 4800 },
];

const mockOrderStatus = [
  { status: 'Draft', count: 3 },
  { status: 'Confirmed', count: 8 },
  { status: 'Processing', count: 5 },
  { status: 'Delivered', count: 15 },
  { status: 'Cancelled', count: 2 },
];

const mockActivity = [
  { id: '1', action: 'order_created', entity: 'Order', description: 'New order from Rahul Sharma', createdAt: new Date().toISOString() },
  { id: '2', action: 'payment', entity: 'Payment', description: 'Payment received from Neha Gupta - ₹1,200', createdAt: new Date().toISOString() },
  { id: '3', action: 'inventory', entity: 'Inventory', description: 'Sugar stock below minimum level', createdAt: new Date().toISOString() },
];

const mockSuggestions = [
  { id: '1', insightType: 'INVENTORY_ALERT', title: 'Restock Atta', description: 'Atta stock is running low. Consider ordering 50kg.', confidence: 0.95, generatedAt: new Date().toISOString() },
  { id: '2', insightType: 'RECOMMENDATION', title: 'Payment Follow-up', description: '3 customers have pending payments totaling ₹5,300', confidence: 0.92, generatedAt: new Date().toISOString() },
];
