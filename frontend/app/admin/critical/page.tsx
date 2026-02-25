'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Zap, RefreshCw, MessageCircle, ArrowLeft,
  Building2, Printer, Package, Loader2, CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

interface CriticalUser {
  subscriptionId: string;
  daysRemaining: number;
  exhaustionDate: string;
  isUrgent: boolean;
  user: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string | null;
    empresa?: string | null;
    cargo?: string | null;
  };
  product: {
    name: string;
    sku: string;
    publicPrice?: number | null;
    speiPrice?: number | null;
  };
  printerModel?: string | null;
  yield: number;
  consumptionRate: number;
  waUrl: string;
}

function DaysBadge({ days, isUrgent }: { days: number; isUrgent: boolean }) {
  if (isUrgent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border bg-red-50 border-red-300 text-red-700">
        <Zap className="w-3 h-3" />
        {days <= 0 ? 'AGOTADO' : `${days}d`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-300 text-amber-700">
      <AlertTriangle className="w-3 h-3" />
      {days}d
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

export default function CriticalAlertsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [alerts, setAlerts] = useState<CriticalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingWa, setOpeningWa] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/critical-alerts');
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount — el endpoint no requiere auth, el redirect de arriba protege la vista
  useEffect(() => {
    if (!authLoading) fetchAlerts();
  }, [authLoading, fetchAlerts]);

  const handleWA = (alert: CriticalUser) => {
    setOpeningWa(alert.subscriptionId);
    window.open(alert.waUrl, '_blank');
    setTimeout(() => setOpeningWa(null), 1500);
  };

  const urgent  = alerts.filter(a => a.isUrgent);
  const warning = alerts.filter(a => !a.isUrgent);

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Zona Crítica de Agotamiento
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Clientes con ≤ 10 días de tóner restante — actúa ahora
              </p>
            </div>
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</>
              : <><RefreshCw className="w-4 h-4" /> Actualizar</>}
          </button>
        </div>

        {/* Summary chips */}
        {!loading && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-2 rounded-xl">
              <Zap className="w-4 h-4" />
              {urgent.length} urgentes (≤ 3 días)
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold px-4 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              {warning.length} en alerta (4–10 días)
            </div>
          </div>
        )}

        {/* Table — 5 cols, Acción sticky right para siempre visible */}
        {/* overflow-hidden removido del outer para que sticky funcione correctamente */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Urgencia</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente · Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tóner · Impresora</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Agotamiento</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 sticky right-0 bg-gray-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)]">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">Sin alertas críticas</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Todos los clientes tienen tóner suficiente por más de 10 días.
                      </p>
                    </td>
                  </tr>
                ) : (
                  alerts.map(alert => (
                    <tr
                      key={alert.subscriptionId}
                      className={`hover:bg-gray-50 transition-colors ${alert.isUrgent ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <DaysBadge days={alert.daysRemaining} isUrgent={alert.isUrgent} />
                      </td>

                      {/* Cliente + Empresa fusionados */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-tight">{alert.user.name}</p>
                        {alert.user.cargo && (
                          <p className="text-xs text-gray-400">{alert.user.cargo}</p>
                        )}
                        {alert.user.empresa && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                            <Building2 className="w-3 h-3" />
                            {alert.user.empresa}
                          </span>
                        )}
                      </td>

                      {/* Tóner + Impresora fusionados */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          <Package className="w-3 h-3" />
                          {alert.product.sku}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {alert.yield.toLocaleString()} p · {alert.consumptionRate}/día
                        </p>
                        {alert.printerModel && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Printer className="w-3 h-3" />{alert.printerModel}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(alert.exhaustionDate)}
                      </td>

                      {/* Acción — sticky right */}
                      <td className="px-3 py-3 sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => handleWA(alert)}
                          disabled={openingWa === alert.subscriptionId}
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-70 whitespace-nowrap"
                        >
                          {openingWa === alert.subscriptionId
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <MessageCircle className="w-3.5 h-3.5" />}
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && alerts.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {alerts.length} cliente{alerts.length !== 1 ? 's' : ''} en zona crítica —
              el mensaje de WhatsApp incluye el copy personalizado listo para enviar
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
