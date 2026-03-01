'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Activity,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface Order {
  id: string;
  folio: string;
  productName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  clientName?: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  recentOrders: Order[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50' },
  PAID: { label: 'Pagado', color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-600 bg-red-50' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments/orders')
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          const orders: Order[] = data.items;
          const paid = orders.filter(o => o.status === 'PAID');
          setStats({
            totalRevenue: paid.reduce((sum, o) => sum + o.amount, 0),
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'PENDING').length,
            recentOrders: orders.slice(0, 5),
          });
        } else {
          setStats({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, recentOrders: [] });
        }
      })
      .catch(() => setStats({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, recentOrders: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-300 mt-1">Panel de control ToneBOX.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
            ) : (
              <h3 className="text-2xl font-bold text-white">
                ${stats?.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </h3>
            )}
            <p className="text-sm text-slate-500 mt-1">Ingresos confirmados</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
            ) : (
              <h3 className="text-2xl font-bold text-white">{stats?.totalOrders ?? 0}</h3>
            )}
            <p className="text-sm text-slate-500 mt-1">Órdenes totales</p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
            ) : (
              <h3 className="text-2xl font-bold text-white">{stats?.pendingOrders ?? 0}</h3>
            )}
            <p className="text-sm text-slate-500 mt-1">Órdenes pendientes</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Órdenes Recientes</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          ) : stats?.recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Sin órdenes aún</p>
              <p className="text-sm text-slate-400 mt-1">
                Las órdenes SPEI y Stripe aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {stats?.recentOrders.map(order => {
                const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-slate-600 bg-slate-50' };
                return (
                  <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">{order.folio}</p>
                      <p className="text-sm text-slate-500">{order.productName}</p>
                      {order.clientName && (
                        <p className="text-xs text-slate-400">{order.clientName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-bold text-slate-900">
                          ${order.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">{order.paymentMethod}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
