'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Zap, RefreshCw, MessageCircle, ArrowLeft,
  Building2, Printer, Package, Loader2, CheckCircle2, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CriticalUser {
  subscriptionId: string;
  daysRemaining: number;
  exhaustionDate: string;
  isUrgent: boolean;
  user: {
    id: string; name: string; email?: string;
    whatsapp?: string | null; empresa?: string | null; cargo?: string | null;
  };
  product: { name: string; sku: string; publicPrice?: number | null; speiPrice?: number | null; };
  printerModel?: string | null;
  yield: number;
  consumptionRate: number;
  waUrl: string;
}

interface Template { name: string; subtitle: string; emoji: string; template: string; }
type Templates = { A: Template; B: Template; C: Template };

// ── Helpers ───────────────────────────────────────────────────────────────────
function interpolate(tpl: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v || ''), tpl);
}

function buildVars(a: CriticalUser) {
  const daysAgo = a.daysRemaining <= 0 ? String(Math.abs(a.daysRemaining)) : '0';
  return {
    nombre:        a.user.name ?? 'Cliente',
    empresa:       a.user.empresa ?? 'tu empresa',
    modelo:        a.product.sku,
    impresora:     a.printerModel ?? 'tu impresora',
    daysRemaining: String(a.daysRemaining > 0 ? a.daysRemaining : 0),
    daysAgo,
  };
}

const DEFAULT_TEMPLATES: Templates = {
  A: { name: 'Urgencia', subtitle: 'Tóner agotado', emoji: '🚨', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} se agotó. Responde *Rescate* 🚀' },
  B: { name: 'Prevención', subtitle: '{daysRemaining} días restantes', emoji: '⚠️', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} tiene {daysRemaining} días. Responde *Adelante* 💪' },
  C: { name: 'Promo Pack2×', subtitle: '10% en 2do tóner', emoji: '🎯', template: 'Hola {nombre}, 2 tóners {modelo} en {empresa} con 10% descuento. Responde *Pack2* 🛒' },
};

// ── Componente selector de template inline ────────────────────────────────────
function WaSelector({ alert, templates }: { alert: CriticalUser; templates: Templates }) {
  const [open, setOpen]     = useState(false);
  const [firing, setFiring] = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const fire = (key: 'A' | 'B' | 'C') => {
    const tpl     = templates[key];
    const vars    = buildVars(alert);
    const message = interpolate(tpl.template, vars);
    const target  = (alert.user.whatsapp ?? '').replace(/\D/g, '') || '528441628536';
    setOpen(false);
    setFiring(true);
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, '_blank');
    setTimeout(() => setFiring(false), 1500);
  };

  return (
    <div ref={ref} className="relative">
      {/* Botón principal — ahora PROMINENTE */}
      <button
        onClick={() => setOpen(p => !p)}
        disabled={firing}
        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs font-black px-3 py-2.5 rounded-xl transition-all disabled:opacity-70 shadow-sm shadow-green-200 whitespace-nowrap"
      >
        {firing
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <MessageCircle className="w-3.5 h-3.5" />}
        WhatsApp
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown de 3 opciones */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64">
          <div className="px-3 py-2 border-b border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Elige tu estrategia</p>
          </div>
          {(['A', 'B', 'C'] as const).map(key => {
            const t = templates[key];
            return (
              <button
                key={key}
                onClick={() => fire(key)}
                className="w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <span className="text-xl leading-none mt-0.5 flex-shrink-0">{t.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900">{key} — {t.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CriticalAlertsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [alerts, setAlerts]       = useState<CriticalUser[]>([]);
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, tplRes] = await Promise.all([
        fetch('/api/admin/critical-alerts'),
        fetch('/api/admin/message-templates'),
      ]);
      const alertsData = await alertsRes.json();
      const tplData    = await tplRes.json();
      setAlerts(alertsData.alerts ?? []);
      if (tplData.success) setTemplates(tplData.templates);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchAlerts();
  }, [authLoading, fetchAlerts]);

  const urgent  = alerts.filter(a => a.isUrgent);
  const warning = alerts.filter(a => !a.isUrgent);

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Zona Crítica de Agotamiento
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Clientes con ≤ 10 días — elige la estrategia y dispara con un clic
              </p>
            </div>
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</> : <><RefreshCw className="w-4 h-4" /> Actualizar</>}
          </button>
        </div>

        {/* Summary chips */}
        {!loading && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-bold px-4 py-2 rounded-xl">
              <Zap className="w-4 h-4" />{urgent.length} urgentes (≤ 3 días)
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold px-4 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4" />{warning.length} en alerta (4–10 días)
            </div>
          </div>
        )}

        {/* Tabla — Acción es la columna más importante */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {/* Acción primero y más prominente */}
                  <th className="text-left px-4 py-3 font-black text-gray-900 w-36">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                      Acción
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Urgencia</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente · Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tóner · Impresora</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Agotamiento</th>
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
                      <p className="text-xs text-gray-300 mt-1">Todos los clientes tienen tóner suficiente por más de 10 días.</p>
                    </td>
                  </tr>
                ) : (
                  alerts.map(alert => (
                    <tr
                      key={alert.subscriptionId}
                      className={`hover:bg-gray-50 transition-colors ${alert.isUrgent ? 'bg-red-50/40' : ''}`}
                    >
                      {/* Acción — primera columna y prominente */}
                      <td className="px-3 py-3">
                        <WaSelector alert={alert} templates={templates} />
                      </td>

                      <td className="px-4 py-3">
                        <DaysBadge days={alert.daysRemaining} isUrgent={alert.isUrgent} />
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-tight">{alert.user.name}</p>
                        {alert.user.cargo && <p className="text-xs text-gray-400">{alert.user.cargo}</p>}
                        {alert.user.empresa && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                            <Building2 className="w-3 h-3" />{alert.user.empresa}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          <Package className="w-3 h-3" />{alert.product.sku}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{alert.yield.toLocaleString()} p · {alert.consumptionRate}/día</p>
                        {alert.printerModel && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Printer className="w-3 h-3" />{alert.printerModel}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(alert.exhaustionDate)}
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
              haz clic en <strong>WhatsApp</strong> para elegir la estrategia de cierre
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
