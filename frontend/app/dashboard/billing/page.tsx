'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, CreditCard, Landmark, ChevronDown } from 'lucide-react';
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

const INK2   = '#161B26';
const GREEN  = '#00C896';
const ORANGE = '#FF5C28';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:    { label: 'Pendiente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: <Clock className="w-3.5 h-3.5" /> },
  PAID:       { label: 'Pagado',     color: GREEN,     bg: 'rgba(0,200,150,0.1)',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED:  { label: 'Cancelado',  color: ORANGE,    bg: 'rgba(255,92,40,0.1)',   icon: <XCircle className="w-3.5 h-3.5" /> },
};

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  card:  { label: 'Tarjeta',  icon: <CreditCard className="w-3.5 h-3.5" /> },
  spei:  { label: 'SPEI',     icon: <Landmark className="w-3.5 h-3.5" /> },
  stripe:{ label: 'Tarjeta',  icon: <CreditCard className="w-3.5 h-3.5" /> },
};

function fmt(amount: number) {
  return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 0 }) + ' MXN';
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING'];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function BillingPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? d.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const paid    = orders.filter(o => o.status === 'PAID');
  const pending = orders.filter(o => o.status === 'PENDING');
  const total   = paid.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: GREEN }}>
            // ToneBOX — Gestión de Tóners
          </div>
          <h1 className="font-syne text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>
            Mis Pedidos
          </h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Historial de órdenes y comprobantes de pago
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total pagado',       val: fmt(total),         color: GREEN,   icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Pedidos completados', val: String(paid.length),   color: GREEN,   icon: <ShoppingBag className="w-5 h-5" /> },
            { label: 'En proceso',          val: String(pending.length), color: '#F59E0B', icon: <Clock className="w-5 h-5" /> },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: INK2, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `rgba(${s.color === GREEN ? '0,200,150' : '245,158,11'},0.12)`, color: s.color }}
              >
                {s.icon}
              </div>
              <div>
                <p className="font-syne font-extrabold" style={{ fontSize: 20, color: 'white', lineHeight: 1 }}>{s.val}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista de pedidos */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h3 className="font-syne font-bold" style={{ color: 'white' }}>Historial de pedidos</h3>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: MUTED }}>Cargando pedidos…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="font-semibold" style={{ color: MUTED }}>Aún no tienes pedidos</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Tus órdenes aparecerán aquí una vez que realices tu primer pedido
              </p>
              <a
                href="/#combos"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl font-syne font-bold text-sm transition-all hover:-translate-y-px"
                style={{ background: GREEN, color: '#0B0E14' }}
              >
                Ver combos disponibles →
              </a>
            </div>
          ) : (
            <div>
              {orders.map(order => {
                const isOpen = expanded === order.id;
                const methodCfg = METHOD_CONFIG[order.paymentMethod?.toLowerCase()] ?? METHOD_CONFIG['card'];
                return (
                  <div key={order.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="w-full px-6 py-4 flex items-center justify-between transition-colors text-left"
                      style={{ background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Folio */}
                        <div
                          className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ background: 'rgba(0,200,150,0.1)', color: GREEN }}
                        >
                          {order.folio || order.id.slice(0, 8)}
                        </div>
                        {/* Nombre */}
                        <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {order.productName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        {/* Método */}
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                          {methodCfg.icon}
                          {methodCfg.label}
                        </span>
                        {/* Monto */}
                        <span className="font-syne font-bold text-sm" style={{ color: 'white' }}>
                          {fmt(order.amount)}
                        </span>
                        <StatusBadge status={order.status} />
                        <ChevronDown
                          className="w-4 h-4 transition-transform"
                          style={{ color: MUTED, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </div>
                    </button>

                    {/* Detalle expandible */}
                    {isOpen && (
                      <div className="px-6 pb-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                          {[
                            { l: 'Folio',          v: order.folio || '—' },
                            { l: 'Método de pago', v: methodCfg.label },
                            { l: 'Fecha',          v: new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) },
                            { l: 'Total',          v: fmt(order.amount) },
                          ].map(row => (
                            <div key={row.l}>
                              <p className="text-[10px] font-mono tracking-[2px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{row.l}</p>
                              <p className="text-sm font-semibold" style={{ color: 'white' }}>{row.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
