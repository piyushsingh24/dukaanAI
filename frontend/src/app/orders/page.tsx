'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, User, IndianRupee, Calendar, ClipboardList, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Order } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import api from '@/services/api';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const paymentStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { on } = useSocket();

  const fetchOrders = useCallback(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.data?.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const unsub = on('order:created', () => { fetchOrders(); });
    return () => unsub?.();
  }, [on, fetchOrders]);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/approve`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Shell>
      <PageHeader title="Orders" description="Manage and track customer orders">
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New Order
        </Button>
      </PageHeader>

      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No orders yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Orders will appear here once customers start ordering via WhatsApp.
          </p>
          <Button>Create First Order</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Items</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="p-4 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                  <td className="p-4 text-sm">{order.customer?.fullName}</td>
                  <td className="p-4 text-sm">{order.items?.length ?? 0} items</td>
                  <td className="p-4 text-sm font-medium">₹{order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                      {order.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {order.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleApprove(order.id); }}
                        disabled={approvingId === order.id}
                      >
                        {approvingId === order.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="text-lg font-mono font-medium">#{selectedOrder.id.slice(0, 8)}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[selectedOrder.status] || 'bg-secondary text-secondary-foreground'}`}>
                {selectedOrder.status.toLowerCase()}
              </span>
            </div>

            {selectedOrder.status === 'DRAFT' && (
              <Button className="w-full" onClick={() => handleApprove(selectedOrder.id)} disabled={approvingId === selectedOrder.id}>
                {approvingId === selectedOrder.id ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Approve Order</>
                )}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="h-3.5 w-3.5" /> Customer
                </div>
                <p className="font-medium">{selectedOrder.customer?.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer?.phone}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <IndianRupee className="h-3.5 w-3.5" /> Payment
                </div>
                <p className="font-medium">₹{selectedOrder.total.toLocaleString()}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${paymentStyles[selectedOrder.paymentStatus] || 'bg-secondary text-secondary-foreground'}`}>
                  {selectedOrder.paymentStatus.replace('_', ' ').toLowerCase()}
                </span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </div>
                <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Package className="h-3.5 w-3.5" /> Items
                </div>
                <p className="font-medium">{selectedOrder.items?.length ?? 0} items</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <ClipboardList className="h-4 w-4" /> Order Items
              </div>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{item.product?.productName || 'Product'}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-medium">₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-500">-₹{selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              {selectedOrder.tax > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{selectedOrder.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>₹{selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Source: {selectedOrder.source} | Order ID: {selectedOrder.id}
            </p>
          </div>
        )}
      </Drawer>
    </Shell>
  );
}
