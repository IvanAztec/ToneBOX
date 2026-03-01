'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  ReceiptText, Search, X, Download, Eye, CheckCircle2,
  Clock, AlertCircle, RefreshCw, Building2, ShieldCheck,
} from 'lucide-react';

const INK = '#0B0E14';
const INK2 = '#161B26';
const GREEN = '#00C896';
const MUTED = '#7A8494';
const BORDER = 'rgba(255,255,255,0.08)';
const CARD = 'rgba(255,255,255,0.04)';
const AMBER = '#FFB400';

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PaymentLog {
  id: string;
  claveRastreo: string | null;
  cepBancoEmisor: string | null;
  cepRfcOrdenante: string | null;
  cepHoraCert: string | null;
  cepEstado: string | null;
  validatedBy: string | null;
  validatedAt: string | null;
  status: string;
  amount: number;
  method: string;
}

interface OrderRow {
  id: string;
  folio: string;
  clientName: string | null;
  clientPhone: string | null;
  speiTotal: number;
  subtotal: number;
  status: string;
  createdAt: string;
  paymentLog: PaymentLog | null;
}

interface Stats { status: string; _count: { id: number }; _sum: { speiTotal: number | null }; }

interface ReceiptData {
  folio: string;
  fecha: string;
  cliente: string;
  telefono: string;
  total: number;
  metodo: string;
  estado: string;
  cep: {
    bancoEmisor: string;
    rfcOrdenante: string;
    horaCertificacion: string;
    estado: string;
    claveRastreo: string;
    validadoEn: string;
    validadoPor: string;
  } | null;
  facturacion: { rfc: string; razonSocial: string; regimenFiscal: string; usoCFDI: string; } | null;
  emisor: { nombre: string; web: string; telefono: string; correo: string; };
  generadoEn: string;
}

// ── Badge de estado ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    PAID: { label: 'Pagado', bg: 'rgba(0,200,150,0.12)', color: GREEN, icon: <CheckCircle2 className="w-3 h-3" /> },
    PENDING: { label: 'Pendiente', bg: 'rgba(255,180,0,0.12)', color: AMBER, icon: <Clock className="w-3 h-3" /> },
    CANCELLED: { label: 'Cancelado', bg: 'rgba(255,92,40,0.12)', color: '#FF5C28', icon: <AlertCircle className="w-3 h-3" /> },
    COMPLETED: { label: 'Validado', bg: 'rgba(0,200,150,0.12)', color: GREEN, icon: <ShieldCheck className="w-3 h-3" /> },
    FAILED: { label: 'Fallido', bg: 'rgba(255,92,40,0.12)', color: '#FF5C28', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const c = configs[status] ?? { label: status, bg: CARD, color: MUTED, icon: null };
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
      style={{ background: c.bg, color: c.color }}>
      {c.icon}{c.label}
    </span>
  );
}

// ── Modal: Ver Comprobante CEP ────────────────────────────────────────────────
function CepModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [rastreo, setRastreo] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`/api/admin/ingresos/${order.id}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setReceipt(d.receipt); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [order.id]);

  const handleValidate = async () => {
    if (!rastreo || rastreo.length < 10) return alert('Ingresa una clave de rastreo válida');
    setValidating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/payments/spei/validate-cep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          catalogOrderId: order.id,
          claveRastreo: rastreo,
          fechaOperacion: new Date(order.createdAt).toISOString().split('T')[0],
          monto: order.speiTotal
        })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        alert('✅ Pago validado con éxito. La orden se marcó como PAGADA.');
        onClose();
        window.location.reload();
      } else {
        alert(`❌ Error: ${data.message || 'No se pudo validar el pago.'}`);
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    } finally {
      setValidating(false);
    }
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${receipt.folio}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#111827', border: `1px solid ${BORDER}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: GREEN }} />
            <span className="font-black text-sm text-white">Auditoría de Pago ToneBOX</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Recuperando datos...</span>
            </div>
          ) : !receipt ? (
            <p className="text-sm text-center py-8 text-gray-500">No se pudo cargar el recibo.</p>
          ) : (
            <>
              {/* Info base */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Folio', receipt.folio],
                  ['Fecha', fmtDate(receipt.fecha)],
                  ['Cliente', receipt.cliente],
                  ['Monto', `$${fmt(receipt.total)} MXN`],
                ].map(([l, v]) => (
                  <div key={l} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold mb-0.5 text-gray-500 uppercase">{l}</p>
                    <p className="text-xs font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>

              {/* Validación CEP Banxico */}
              {receipt.cep ? (
                <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-400">
                      Liquidada en Banxico CEP
                    </p>
                  </div>
                  {[
                    ['Banco', receipt.cep.bancoEmisor],
                    ['RFC Ordenante', receipt.cep.rfcOrdenante],
                    ['Rastreo', receipt.cep.claveRastreo],
                    ['Estado', receipt.cep.estado],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-white font-mono font-bold">{v ?? '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 space-y-4">
                  <div>
                    <p className="text-xs font-black text-yellow-500 uppercase tracking-wider mb-1">⚠️ Validación Pendiente</p>
                    <p className="text-[11px] text-gray-400">Ingresa la Clave de Rastreo para validar automáticante contra Banxico.</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      value={rastreo}
                      onChange={e => setRastreo(e.target.value)}
                      placeholder="Ingrese Clave de Rastreo (30 chars)"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-500/50"
                    />
                    <button
                      onClick={handleValidate}
                      disabled={validating || !rastreo}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {validating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      VALIDAR EN BANXICO CEP
                    </button>
                  </div>
                </div>
              )}

              {/* Facturación y CSF */}
              {receipt.facturacion && (
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">
                    🧾 Datos SAT 4.0
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">RFC / Razón Social</span>
                      <span className="text-white text-right font-bold">{receipt.facturacion.rfc} <br /> <span className="text-[9px] opacity-60">{receipt.facturacion.razonSocial}</span></span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Régimen</span>
                      <span className="text-white text-right font-bold">{receipt.facturacion.regimenFiscal}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {receipt && (
          <div className="p-4 bg-white/5 flex gap-3">
            <button onClick={downloadReceipt}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10">
              <Download className="w-3.5 h-3.5" />
              Recibo JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function IngresosPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRow, setSelectedRow] = useState<OrderRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (status) params.set('status', status);

      const res = await fetch(`/api/admin/ingresos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRows(data.data);
        setStats(data.stats ?? []);
      }
    } catch { /* silencio */ }
    finally { setLoading(false); }
  }, [from, to, status]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.folio?.toLowerCase().includes(q) ||
      r.clientName?.toLowerCase().includes(q) ||
      r.clientPhone?.includes(q) ||
      r.paymentLog?.claveRastreo?.toLowerCase().includes(q)
    );
  });

  // Totales rápidos
  const totalPaid = stats.find(s => s.status === 'PAID')?._sum.speiTotal ?? 0;
  const countPaid = stats.find(s => s.status === 'PAID')?._count.id ?? 0;
  const countPending = stats.find(s => s.status === 'PENDING')?._count.id ?? 0;
  const totalAll = stats.reduce((s, r) => s + (r._sum.speiTotal ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,200,150,0.12)' }}>
              <ReceiptText className="w-4 h-4" style={{ color: GREEN }} />
            </div>
            <div>
              <h1 className="font-black text-lg" style={{ color: 'white' }}>Registro de Ingresos</h1>
              <p className="text-xs" style={{ color: MUTED }}>Auditoría de pagos · CEP Banxico · Trazabilidad completa</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: CARD, border: `1px solid ${BORDER}`, color: MUTED }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Ingresos', value: `$${fmt(totalAll)}`, sub: 'todas las órdenes', color: GREEN },
            { label: 'Pagos Confirmados', value: `$${fmt(totalPaid)}`, sub: `${countPaid} órdenes`, color: GREEN },
            { label: 'Pendientes', value: countPending.toString(), sub: 'por validar', color: AMBER },
            { label: 'Total Órdenes', value: rows.length.toString(), sub: 'en filtro actual', color: MUTED },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>{s.label}</p>
              <p className="font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 p-4 rounded-2xl" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar folio, cliente, clave rastreo..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm bg-white text-slate-900 placeholder:text-gray-400 outline-none"
              style={{ border: `1.5px solid ${BORDER}` }} />
          </div>

          {/* Fecha desde */}
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none bg-white text-slate-900"
            style={{ border: `1.5px solid ${BORDER}` }} />
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none bg-white text-slate-900"
            style={{ border: `1.5px solid ${BORDER}` }} />

          {/* Status */}
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#1a2035', border: `1px solid ${BORDER}`, color: status ? 'white' : MUTED }}>
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          {(from || to || status) && (
            <button onClick={() => { setFrom(''); setTo(''); setStatus(''); }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,92,40,0.1)', color: '#FF5C28', border: '1px solid rgba(255,92,40,0.2)' }}>
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ background: INK2 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Folio', 'Cliente', 'Fecha', 'Monto', 'Estado Orden', 'CEP / Validación', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex items-center justify-center gap-2" style={{ color: MUTED }}>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <ReceiptText className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin resultados</p>
                    </td>
                  </tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>

                    {/* Folio */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-xs" style={{ color: GREEN }}>{row.folio}</span>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{row.clientName ?? '—'}</p>
                      {row.clientPhone && <p className="text-[10px]" style={{ color: MUTED }}>{row.clientPhone}</p>}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3">
                      <p className="text-[11px]" style={{ color: MUTED }}>{fmtDate(row.createdAt)}</p>
                    </td>

                    {/* Monto */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-sm" style={{ color: 'white' }}>
                        ${fmt(row.speiTotal)}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>

                    {/* CEP */}
                    <td className="px-4 py-3">
                      {row.paymentLog ? (
                        <div className="space-y-1">
                          <StatusBadge status={row.paymentLog.status} />
                          {row.paymentLog.cepBancoEmisor && (
                            <p className="text-[10px]" style={{ color: MUTED }}>
                              🏦 {row.paymentLog.cepBancoEmisor}
                            </p>
                          )}
                          {row.paymentLog.claveRastreo && (
                            <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {row.paymentLog.claveRastreo}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Sin log</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedRow(row)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          style={{ background: 'rgba(0,200,150,0.1)', color: GREEN, border: '1px solid rgba(0,200,150,0.2)' }}>
                          <Eye className="w-3 h-3" /> Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer: conteo */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.01)' }}>
              <p className="text-[11px]" style={{ color: MUTED }}>
                {filtered.length} {filtered.length === 1 ? 'orden' : 'órdenes'} mostradas
              </p>
              <div className="flex items-center gap-1" style={{ color: MUTED }}>
                <Building2 className="w-3 h-3" />
                <span className="text-[10px]">ToneBOX México S.A. de C.V.</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal CEP */}
      {selectedRow && (
        <CepModal order={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </DashboardLayout>
  );
}
