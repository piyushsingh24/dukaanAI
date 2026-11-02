'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Input } from '@/components/ui/input';
import { Drawer } from '@/components/ui/drawer';
import { Search, Phone, ShoppingBag, IndianRupee, Globe, MapPin, StickyNote } from 'lucide-react';
import { Customer } from '@/types';
import api from '@/services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    api.get('/customers')
      .then(({ data }) => setCustomers(data.data?.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <Shell>
      <PageHeader title="Customers" description="Manage your customer relationships" />

      <div className="relative mb-4 w-[320px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No customers found</h3>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : 'Customers will appear once they place orders.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Orders</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Outstanding</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Language</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="p-4 text-sm font-medium">{customer.fullName}</td>
                  <td className="p-4 text-sm">{customer.phone}</td>
                  <td className="p-4 text-sm">{customer.totalOrders}</td>
                  <td className="p-4 text-sm">
                    <span className={customer.outstandingAmount > 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                      ₹{customer.outstandingAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-sm capitalize">{customer.preferredLanguage}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Details">
        {selectedCustomer && (
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-semibold">{selectedCustomer.fullName}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Globe className="h-3.5 w-3.5" />
                <span className="capitalize">{selectedCustomer.preferredLanguage}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </div>
                <p className="font-medium">{selectedCustomer.phone}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ShoppingBag className="h-3.5 w-3.5" /> Total Orders
                </div>
                <p className="font-medium">{selectedCustomer.totalOrders}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <IndianRupee className="h-3.5 w-3.5" /> Outstanding
                </div>
                <p className={`font-medium ${selectedCustomer.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ₹{selectedCustomer.outstandingAmount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </div>
                <p className="font-medium">{selectedCustomer.notes || 'No notes'}</p>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </div>
                <p className="text-sm">{selectedCustomer.address}</p>
              </div>
            )}

            {selectedCustomer.email && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{selectedCustomer.email}</p>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Customer Since</p>
              <p className="text-sm">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Drawer>
    </Shell>
  );
}
