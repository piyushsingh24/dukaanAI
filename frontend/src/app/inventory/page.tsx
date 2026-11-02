'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import { Inventory } from '@/types';
import api from '@/services/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory')
      .then(({ data }) => setInventory(data.data?.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock = inventory.filter((item) => item.currentStock <= item.minimumStock);

  return (
    <Shell>
      <PageHeader title="Inventory" description="Track stock levels and products">
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </PageHeader>

      {lowStock.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {lowStock.length} product(s) are running low on stock
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {lowStock.map((i) => i.product?.productName).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No products yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your first product to start tracking inventory.</p>
          <Button>Add Product</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">SKU</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Min Stock</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const isLow = item.currentStock <= item.minimumStock;
                return (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm font-medium">{item.product?.productName}</td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{item.product?.sku ?? 'N/A'}</td>
                    <td className="p-4 text-sm">₹{item.product?.sellingPrice?.toLocaleString()}</td>
                    <td className="p-4 text-sm">
                      <span className={isLow ? 'text-red-600 font-medium' : ''}>
                        {item.currentStock} {item.product?.unit}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.minimumStock}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isLow
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
