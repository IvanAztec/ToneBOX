'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone, ArrowLeft, RefreshCw, Loader2, MessageCircle,
  Zap, AlertTriangle, Clock, ChevronDown, ChevronUp, Building2, Package,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClientAlert {
  subscriptionId: string;
  daysRemaining: number;
  exhaustionDate: string;
  isUrgent: boolean;
  user: { id: string; name: string; email?: string; whatsapp?: string | null; empresa?: string | null };
  product: { name: string; sku: string };
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

function buildVars(a: ClientAlert, today: Date) {
  const daysAgo = a.daysRemaining <= 0 ? String(Math.abs(a.daysRemaining)) : '0';
  return {
    nombre:       a.user.name ?? 'Cliente',
    empresa:      a.user.empresa ?? 'tu empresa',
    modelo:       a.product.sku,
    impresora:    a.printerModel ?? 'tu impresora',
    daysRemaining: String(a.daysRemaining > 0 ? a.daysRemaining : 0),
    daysAgo,
  };
}

function recommendedKey(days: number): 'A' | 'B' | 'C' {
  if (days <= 0)  return 'A'; // Agotado → Urgencia
  if (days <= 10) return 'B'; // Crítico → Prevención
  return 'C';                 // Seguimiento → Promoción
}

function segmentLabel(days: number) {
  if (days <= 0)  return { label: 'AGOTADO',    color: 'bg-red-100 text-red-700 border-red-300',    dot: 'bg-red-500' };
  if (days <= 3)  return { label: `${days}d URGENTE`, color: 'bg-red-50 text-red-600 border-red-200',  dot: 'bg-red-400' };
  if (days <= 10) return { label: `${days}d CRÍTICO`, color: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
  return { label: `${days}d`, color: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' };
}

// ── Card de cliente con selector de template ──────────────────────────────────
function CampaignCard({ alert, templates }: { alert: ClientAlert; templates: Templates }) {
  const today = new Date();
  const recommended = recommendedKey(alert.daysRemaining);
  const [selected, setSelected] = useState<'A' | 'B' | 'C'>(recommended);
  const [expanded, setExpanded] = useState(false);
  const [firing, setFiring] = useState(false);

  const segment = segmentLabel(alert.daysRemaining);
  const vars    = buildVars(alert, today);
  const tpl     = templates[selected];
  const message = interpolate(tpl.template, vars);
  const waTarget = (alert.user.whatsapp ?? '').replace(/\D/g, '') || '528441628536';
  const waUrl   = `https://wa.me/${waTarget}?text=${encodeURIComponent(message)}`;

  const handleFire = () => {
    setFiring(true);
    window.open(waUrl, '_blank');
    setTimeout(() => setFiring(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${segment.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${segment.dot}`} />
            {segment.label}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{alert.user.name}</p>
            {alert.user.empresa && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />{alert.user.empresa}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            <Package className="w-3 h-3" />{alert.product.sku}
          </span>
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Template selector + preview */}
      <div className="px-5 pb-4 space-y-3">
        {/* Selector A/B/C */}
        <div className="flex gap-2">
          {(['A', 'B', 'C'] as const).map(key => {
            const t = templates[key];
            const isRec = key === recommended;
            const isSel = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex-1 text-left px-3 py-2 rounded-xl border-2 transition-all ${
                  isSel
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{t.emoji}</span>
                  <span className={`text-xs font-black ${isSel ? 'text-blue-700' : 'text-gray-600'}`}>
                    {key}
                  </span>
                  {isRec && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1 rounded ml-auto">REC</span>
                  )}
                </div>
                <p className={`text-[10px] font-semibold mt-0.5 leading-tight ${isSel ? 'text-blue-600' : 'text-gray-400'}`}>
                  {t.name}
                </p>
              </button>
            );
          })}
        </div>

        {/* Preview del mensaje (expandible) */}
        {expanded && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-500 mb-1.5">Vista previa del mensaje:</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>
          </div>
        )}

        {/* Botón disparar */}
        <button
          onClick={handleFire}
          disabled={firing}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-70 text-sm"
        >
          {firing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          {firing ? 'Abriendo WhatsApp...' : `Disparar ${tpl.emoji} ${tpl.name}`}
        </button>
      </div>
    </div>
  );
}

// ── Sección con título colapsable ─────────────────────────────────────────────
function Segment({
  title, icon, count, colorClass, clients, templates,
}: {
  title: string; icon: React.ReactNode; count: number;
  colorClass: string; clients: ClientAlert[]; templates: Templates;
}) {
  const [open, setOpen] = useState(true);
  if (count === 0) return null;
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h2 className="font-black text-gray-900 text-base">{title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>{count}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map(a => (
            <CampaignCard key={a.subscriptionId} alert={a} templates={templates} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Default templates (fallback si el fetch falla) ────────────────────────────
const DEFAULT_TEMPLATES: Templates = {
  A: { name: 'Urgencia', subtitle: '', emoji: '🚨', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} se agotó hace {daysAgo} días. ¿Lo coordinamos hoy? Responde *Rescate*. 🚀' },
  B: { name: 'Prevención', subtitle: '', emoji: '⚠️', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} tiene {daysRemaining} días restantes. ¿Lo pedimos antes de que se acabe? Responde *Adelante*. 💪' },
  C: { name: 'Promoción', subtitle: '', emoji: '🎯', template: 'Hola {nombre}, llevando 2 tóners {modelo} en {empresa} te damos 10% de descuento. ¿Aprovechamos? Responde *Pack2*. 🛒' },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CampanasPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [alerts, setAlerts]       = useState<ClientAlert[]>([]);
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, tplRes] = await Promise.all([
        fetch('/api/admin/critical-alerts?all=true'),
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
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  if (authLoading) return null;

  const agotados    = alerts.filter(a => a.daysRemaining <= 0);
  const criticos    = alerts.filter(a => a.daysRemaining > 0 && a.daysRemaining <= 10);
  const seguimiento = alerts.filter(a => a.daysRemaining > 10);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-blue-500" />
                Campañas de Cierre
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Elige la estrategia correcta y dispara el mensaje con un clic
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div><p className="text-xs text-red-500 font-semibold">Agotados</p><p className="text-xl font-black text-red-700">{agotados.length}</p></div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div><p className="text-xs text-amber-600 font-semibold">Críticos</p><p className="text-xl font-black text-amber-700">{criticos.length}</p></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div><p className="text-xs text-blue-600 font-semibold">Seguimiento</p><p className="text-xl font-black text-blue-700">{seguimiento.length}</p></div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin clientes activos registrados</p>
            <p className="text-sm mt-1">Registra suscripciones de clientes para generar campañas</p>
          </div>
        ) : (
          <div className="space-y-8">
            <Segment title="🚨 Agotados — Rescate Inmediato" icon={<Zap className="w-5 h-5 text-red-500" />} count={agotados.length} colorClass="bg-red-50 border-red-200 text-red-700" clients={agotados} templates={templates} />
            <Segment title="⚠️ Críticos — Prevención" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} count={criticos.length} colorClass="bg-amber-50 border-amber-200 text-amber-700" clients={criticos} templates={templates} />
            <Segment title="📋 Seguimiento — Promoción" icon={<Clock className="w-5 h-5 text-blue-500" />} count={seguimiento.length} colorClass="bg-blue-50 border-blue-200 text-blue-600" clients={seguimiento} templates={templates} />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
