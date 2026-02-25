'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, MapPin, Phone, Mail, Globe, Pencil,
  Save, X, Loader2, CreditCard, CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';
import { useCompanySettings } from '@/features/company/useCompanySettings';
import type { CompanySettings } from '@/features/company/useCompanySettings';

const INK2   = '#161B26';
const GREEN  = '#00C896';
const AMBER  = '#FFB400';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';
const CARD   = 'rgba(255,255,255,0.04)';

const CFDIS = [
  'G01 — Adquisición de mercancías',
  'G03 — Gastos en general',
  'D01 — Honorarios médicos y gastos hospitalarios',
  'S01 — Sin efectos fiscales',
];

const SUCURSALES = [
  { ciudad: 'Saltillo',    estado: 'Coahuila',   tipo: 'CEDI',          tel: '844 162 8536' },
  { ciudad: 'Monterrey',   estado: 'Nuevo León', tipo: 'Hub Principal', tel: '—' },
  { ciudad: 'CDMX',        estado: 'CDMX',       tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Guadalajara', estado: 'Jalisco',     tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Puebla',      estado: 'Puebla',      tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Querétaro',   estado: 'Querétaro',   tipo: 'Punto ToneBOX', tel: '—' },
];

const TIPO_STYLE: Record<string, { color: string; bg: string }> = {
  'CEDI':          { color: GREEN,     bg: 'rgba(0,200,150,0.12)' },
  'Hub Principal': { color: '#1A6BFF', bg: 'rgba(26,107,255,0.12)' },
  'Punto ToneBOX': { color: MUTED,     bg: 'rgba(255,255,255,0.06)' },
};

// ── Primitives ────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>{children}</p>;
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Label>{label}</Label>
      <p className="text-sm font-semibold" style={{ color: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)' }}>
        {value || 'No configurado'}
      </p>
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${mono ? 'font-mono' : 'font-semibold'}`}
        style={{ background: CARD, border: `1px solid ${BORDER}`, color: 'white' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,200,150,0.5)')}
        onBlur={e  => (e.currentTarget.style.borderColor = BORDER)}
      />
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none"
        style={{ background: '#1a2035', border: `1px solid ${BORDER}`, color: value ? 'white' : MUTED }}
      >
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorkspacesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings, loading, saving, saveMsg, save } = useCompanySettings();

  const isAdmin = user?.role === 'admin';
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<CompanySettings | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const startEdit = () => { setDraft({ ...settings }); setEditing(true); };
  const cancelEdit = () => { setDraft(null); setEditing(false); };

  const handleSave = async () => {
    if (!draft) return;
    const ok = await save(draft);
    if (ok) setEditing(false);
  };

  const patch = (key: keyof CompanySettings, val: string) =>
    setDraft(prev => prev ? { ...prev, [key]: val || null } : prev);

  if (authLoading || loading) return null;

  const d = editing && draft ? draft : settings;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: GREEN }}>
              // ToneBOX — Configuración
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>Mi Empresa</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Datos de pago, fiscales y red de cobertura ToneBOX</p>
          </div>

          {isAdmin && (
            editing ? (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:bg-white/5"
                  style={{ color: MUTED, border: `1px solid ${BORDER}` }}>
                  <X className="w-3.5 h-3.5" />Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  style={{ background: GREEN, color: '#0B0E14' }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando…' : 'Guardar Cambios'}
                </button>
              </div>
            ) : (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ background: 'rgba(0,200,150,0.12)', color: GREEN, border: '1px solid rgba(0,200,150,0.25)' }}>
                <Pencil className="w-3.5 h-3.5" />Editar Datos
              </button>
            )
          )}
        </div>

        {/* Save result toast */}
        {saveMsg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${saveMsg.ok ? 'border border-green-500/20' : 'border border-red-500/20'}`}
            style={{ background: saveMsg.ok ? 'rgba(0,200,150,0.08)' : 'rgba(239,68,68,0.08)', color: saveMsg.ok ? GREEN : '#f87171' }}>
            {saveMsg.ok && <CheckCircle2 className="w-4 h-4" />}
            {saveMsg.text}
          </div>
        )}

        {/* ── Card: Datos de Pago ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <CreditCard className="w-4 h-4" style={{ color: GREEN }} />
            <h2 className="font-black text-sm" style={{ color: 'white' }}>Datos de Pago SPEI</h2>
            <span className="text-[10px] ml-auto font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,200,150,0.1)', color: GREEN }}>
              Sincronizado con checkout
            </span>
          </div>
          <div className="px-6 pb-2">
            {editing ? (
              <>
                <InputRow label="Banco"          value={d.bankName}          onChange={v => patch('bankName', v)}          placeholder="BBVA Bancomer" />
                <InputRow label="Beneficiario"   value={d.beneficiario}      onChange={v => patch('beneficiario', v)}      placeholder="ToneBox México S.A. de C.V." />
                <InputRow label="CLABE"          value={d.clabeNumber}       onChange={v => patch('clabeNumber', v)}       placeholder="018 dígitos" mono />
                <InputRow label="Correo para comprobantes" value={d.comprobantesEmail} onChange={v => patch('comprobantesEmail', v)} placeholder="pagos@tonebox.mx" />
              </>
            ) : (
              <>
                <FieldRow label="Banco"          value={d.bankName} />
                <FieldRow label="Beneficiario"   value={d.beneficiario} />
                <FieldRow label="CLABE"          value={d.clabeNumber} />
                <FieldRow label="Correo para comprobantes" value={d.comprobantesEmail} />
              </>
            )}
          </div>
        </div>

        {/* ── Card: Datos Fiscales ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Building2 className="w-4 h-4" style={{ color: AMBER }} />
            <h2 className="font-black text-sm" style={{ color: 'white' }}>Datos Fiscales</h2>
          </div>
          <div className="px-6 pb-2">
            {editing ? (
              <>
                <InputRow label="RFC"          value={d.rfc ?? ''}         onChange={v => patch('rfc', v)}         placeholder="TMX-XXXXXX-XXX" mono />
                <InputRow label="Razón Social" value={d.razonSocial ?? ''} onChange={v => patch('razonSocial', v)} placeholder="ToneBox México S.A. de C.V." />
                <SelectRow label="Uso CFDI" value={d.usoCFDI ?? ''} onChange={v => patch('usoCFDI', v)} options={CFDIS} />
              </>
            ) : (
              <>
                <FieldRow label="RFC"          value={d.rfc} />
                <FieldRow label="Razón Social" value={d.razonSocial} />
                <FieldRow label="Uso CFDI"     value={d.usoCFDI} />
              </>
            )}
          </div>
        </div>

        {/* ── Card: Contacto ── */}
        <div className="rounded-2xl p-6" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <p className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Contacto
          </p>
          {[
            { icon: <Building2 className="w-4 h-4" />, label: 'ToneBox México S.A. de C.V.' },
            { icon: <MapPin className="w-4 h-4" />,    label: 'Saltillo, Coahuila — México' },
            { icon: <Phone className="w-4 h-4" />,     label: '+52 844 162 8536' },
            { icon: <Mail className="w-4 h-4" />,      label: 'hola@tonebox.mx' },
            { icon: <Globe className="w-4 h-4" />,     label: 'tonebox.mx' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span style={{ color: MUTED }}>{row.icon}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{row.label}</span>
            </div>
          ))}
        </div>

        {/* ── Red de Sucursales ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h3 className="font-black text-sm" style={{ color: 'white' }}>Red de Puntos de Entrega</h3>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>44+ puntos de retiro gratuito en México</p>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {SUCURSALES.map(s => {
              const st = TIPO_STYLE[s.tipo] ?? TIPO_STYLE['Punto ToneBOX'];
              return (
                <div key={`${s.ciudad}-${s.estado}`} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'white' }}>{s.ciudad}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{s.estado}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-black"
                      style={{ color: st.color, background: st.bg }}>{s.tipo}</span>
                    {s.tel !== '—' && <span className="font-mono text-xs" style={{ color: MUTED }}>{s.tel}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <a href="/#logistica" className="text-xs font-medium transition-colors" style={{ color: GREEN }}>
              Ver mapa completo de cobertura →
            </a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
