'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Download, RefreshCw, ExternalLink, FileText,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

const INK2   = '#161B26';
const GREEN  = '#00C896';
const AMBER  = '#FFB400';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';
const CARD   = 'rgba(255,255,255,0.04)';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type BusinessType = 'INSTITUCION' | 'PYME' | 'DESPACHO' | 'CORPORATIVO' | 'REVENDEDOR' | 'POR_CLASIFICAR';

interface Client {
  id: string;
  name: string | null;
  email: string;
  empresa: string | null;
  cargo: string | null;
  ciudad: string | null;
  estado: string | null;
  whatsapp: string | null;
  businessType: BusinessType;
  requiresInvoice: boolean;
  rfc: string | null;
  razonSocial: string | null;
  customerNumber: number;
  createdAt: string;
  ltv: number;
  orderCount: number;
  lastPurchase: string | null;
  csfUrl: string | null;
}

type SortKey = 'ltv' | 'lastPurchase' | 'createdAt' | 'orderCount';
type SortDir = 'asc' | 'desc';

// ── Badges de Giro ─────────────────────────────────────────────────────────────
const GIRO_CONFIG: Record<BusinessType, { label: string; color: string; bg: string }> = {
  INSTITUCION:    { label: 'Institución',  color: '#1A6BFF', bg: 'rgba(26,107,255,0.12)' },
  PYME:           { label: 'PyME',         color: GREEN,     bg: 'rgba(0,200,150,0.12)' },
  DESPACHO:       { label: 'Despacho',     color: AMBER,     bg: 'rgba(255,180,0,0.12)' },
  CORPORATIVO:    { label: 'Corporativo',  color: '#C084FC', bg: 'rgba(192,132,252,0.12)' },
  REVENDEDOR:     { label: 'Revendedor',   color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
  POR_CLASIFICAR: { label: 'Sin clasificar', color: MUTED,   bg: 'rgba(255,255,255,0.06)' },
};

const GIRO_OPTIONS: BusinessType[] = ['INSTITUCION', 'PYME', 'DESPACHO', 'CORPORATIVO', 'REVENDEDOR', 'POR_CLASIFICAR'];

function GiroBadge({ type }: { type: BusinessType }) {
  const cfg = GIRO_CONFIG[type] ?? GIRO_CONFIG.POR_CLASIFICAR;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CRMPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterGiro, setFilter] = useState<BusinessType | ''>('');
  const [sortKey, setSortKey]   = useState<SortKey>('ltv');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [patchingId, setPatch]  = useState<string | null>(null);
  const [exporting, setExport]  = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url   = filterGiro ? `/api/admin/clients?giro=${filterGiro}` : '/api/admin/clients';
      const res   = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data  = await res.json();
      if (data.success) setClients(data.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  }, [filterGiro]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleGiroChange = useCallback(async (clientId: string, newType: BusinessType) => {
    setPatch(clientId);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/clients/${clientId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ businessType: newType }),
      });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, businessType: newType } : c));
    } catch { /* noop */ } finally {
      setPatch(null);
    }
  }, []);

  const handleExport = useCallback(async () => {
    setExport(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res   = await fetch('/api/admin/clients/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = `clientes-tonebox-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ } finally {
      setExport(false);
    }
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return key; }
      setSortDir('desc');
      return key;
    });
  }, []);

  const sorted = [...clients].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === 'lastPurchase') {
      av = a.lastPurchase ? new Date(a.lastPurchase).getTime() : 0;
      bv = b.lastPurchase ? new Date(b.lastPurchase).getTime() : 0;
    } else if (sortKey === 'createdAt') {
      av = new Date(a.createdAt).getTime();
      bv = new Date(b.createdAt).getTime();
    } else {
      av = (a as unknown as Record<string, number>)[sortKey] ?? 0;
      bv = (b as unknown as Record<string, number>)[sortKey] ?? 0;
    }
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const totalLtv    = clients.reduce((s, c) => s + c.ltv, 0);
  const conCompras  = clients.filter(c => c.orderCount > 0).length;
  const sinClasif   = clients.filter(c => c.businessType === 'POR_CLASIFICAR').length;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  }

  if (authLoading || (!isAdmin && !authLoading)) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: GREEN }}>
              // ToneBOX — CRM Intelligence
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>CRM Clientes</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Inteligencia de clientes · LTV · Giro · CSF
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchClients}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50"
              style={{ border: `1px solid ${BORDER}`, color: MUTED, background: CARD }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              style={{ background: GREEN, color: '#0B0E14' }}
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exportando…' : 'Exportar Excel'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Clientes',       val: clients.length.toString(),  color: GREEN },
            { label: 'LTV Total',      val: fmtCurrency(totalLtv),      color: AMBER },
            { label: 'Con Compras',    val: conCompras.toString(),       color: '#1A6BFF' },
            { label: 'Sin Clasificar', val: sinClasif.toString(),        color: MUTED },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>{s.label}</p>
              <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: MUTED }}>Filtrar por Giro:</p>
          <button
            onClick={() => setFilter('')}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: filterGiro === '' ? 'rgba(0,200,150,0.15)' : CARD, color: filterGiro === '' ? GREEN : MUTED, border: `1px solid ${filterGiro === '' ? 'rgba(0,200,150,0.3)' : BORDER}` }}
          >
            Todos
          </button>
          {GIRO_OPTIONS.map(g => {
            const cfg = GIRO_CONFIG[g];
            const active = filterGiro === g;
            return (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg transition-all"
                style={{ background: active ? cfg.bg : CARD, color: active ? cfg.color : MUTED, border: `1px solid ${active ? cfg.color + '55' : BORDER}` }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Tabla */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    { label: '#',            key: null },
                    { label: 'Empresa',      key: null },
                    { label: 'Giro',         key: null },
                    { label: 'LTV',          key: 'ltv' as SortKey },
                    { label: 'Pedidos',      key: 'orderCount' as SortKey },
                    { label: 'Última Compra',key: 'lastPurchase' as SortKey },
                    { label: 'CSF',          key: null },
                    { label: 'Contacto',     key: null },
                  ].map(col => (
                    <th
                      key={col.label}
                      className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                      style={{ color: MUTED, whiteSpace: 'nowrap', cursor: col.key ? 'pointer' : 'default' }}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      {col.label}
                      {col.key && <SortIcon k={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: MUTED }} />
                      <p className="text-xs" style={{ color: MUTED }}>Cargando clientes…</p>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                      <p className="font-semibold text-sm" style={{ color: MUTED }}>Sin clientes aún</p>
                    </td>
                  </tr>
                ) : (
                  sorted.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {/* # */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: MUTED }}>
                          {c.customerNumber}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-semibold truncate" style={{ color: 'white' }}>
                          {c.empresa || c.name || '—'}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: MUTED }}>
                          {c.email}
                        </p>
                      </td>

                      {/* Giro — selector inline */}
                      <td className="px-4 py-3">
                        <select
                          value={c.businessType}
                          disabled={patchingId === c.id}
                          onChange={e => handleGiroChange(c.id, e.target.value as BusinessType)}
                          className="rounded-lg text-[10px] font-black px-2 py-1 outline-none cursor-pointer transition-opacity disabled:opacity-50"
                          style={{
                            background: GIRO_CONFIG[c.businessType].bg,
                            color:      GIRO_CONFIG[c.businessType].color,
                            border:     'none',
                          }}
                        >
                          {GIRO_OPTIONS.map(g => (
                            <option key={g} value={g} style={{ background: '#1a2035', color: 'white' }}>
                              {GIRO_CONFIG[g].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* LTV */}
                      <td className="px-4 py-3">
                        <span
                          className="font-black text-sm"
                          style={{ color: c.ltv > 0 ? GREEN : MUTED }}
                        >
                          {c.ltv > 0 ? fmtCurrency(c.ltv) : '—'}
                        </span>
                      </td>

                      {/* Pedidos */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: c.orderCount > 0 ? 'rgba(255,255,255,0.8)' : MUTED }}>
                          {c.orderCount}
                        </span>
                      </td>

                      {/* Última compra */}
                      <td className="px-4 py-3">
                        <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
                          {fmtDate(c.lastPurchase)}
                        </span>
                      </td>

                      {/* CSF */}
                      <td className="px-4 py-3">
                        {c.csfUrl ? (
                          <a
                            href={c.csfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                            style={{ color: AMBER, background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.2)' }}
                          >
                            <FileText className="w-3 h-3" />
                            Ver PDF
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3">
                        {c.whatsapp ? (
                          <a
                            href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-80"
                            style={{ color: '#25D366', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}
                          >
                            WA
                          </a>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && sorted.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-[11px]" style={{ color: MUTED }}>
                {sorted.length} cliente{sorted.length !== 1 ? 's' : ''}
                {filterGiro ? ` · filtrado por ${GIRO_CONFIG[filterGiro]?.label}` : ''}
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
