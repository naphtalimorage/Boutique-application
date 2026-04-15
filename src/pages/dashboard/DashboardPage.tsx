import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/services/api';
import type { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-4xl font-bold mb-6 font-display tracking-wide">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6 font-display tracking-wide">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Products need restocking</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sales yet</p>
            ) : (
              <div className="space-y-4">
                {stats?.recentSales.slice(0, 5).map((sale) => {
                  // Get product name from sale items or legacy product field
                  const itemNames = sale.saleItems
                    ? sale.saleItems.map((si) => `${si.product?.name || 'Product'} x${si.quantity}`).join(', ')
                    : `${sale.product?.name || 'Unknown Product'} x${sale.quantity || 0}`;
                  const totalAmount = sale.totalAmount || sale.totalPrice || 0;

                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{itemNames}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sale.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">All products well stocked</p>
            ) : (
              <div className="space-y-4">
                {stats?.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="space-y-2">
                    {/* Product header */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category?.name || product.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={product.stock === 0 ? 'destructive' : 'outline'}>
                          {product.stock} left
                        </Badge>
                      </div>
                    </div>

                    {/* Variation details */}
                    {product.lowStockVariations?.length && product.lowStockVariations.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {product.lowStockVariations.map((variation, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm px-3 py-1.5 bg-destructive/5 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {variation.size}
                              </span>
                              {variation.colors?.length && variation.colors.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {variation.colors.map((color, cIdx) => (
                                    <span key={cIdx} className="text-xs text-muted-foreground">
                                      {color.name}: <span className="text-destructive font-semibold">{color.stock}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge variant={variation.stock === 0 ? 'destructive' : 'outline'} className="text-xs">
                              {variation.stock} left
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
