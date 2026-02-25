'use client';

import { useState, useEffect } from 'react';
import {
  X, ShoppingCart, Minus, Plus, Trash2, MessageCircle,
  MapPin, FileText, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, Copy, Building2,
} from 'lucide-react';
import { FiscalUpload } from '@/features/billing/FiscalUpload';
import type { FiscalData } from '@/features/billing/types';
import { COMPANY_DEFAULTS } from '@/features/company/useCompanySettings';
import type { CompanySettings } from '@/features/company/useCompanySettings';

const INK    = '#0B0E14';
const INK2   = '#161B26';
const GREEN  = '#00C896';
const MUTED  = '#7A8494';
const BORDER = 'rgba(255,255,255,0.08)';
const CARD   = 'rgba(255,255,255,0.04)';
const AMBER  = '#FFB400';
const WA     = '#25D366';

export interface Product {
  id: string; sku: string; name: string; brand: string | null;
  publicPrice: number | null; speiPrice: number | null;
  image: string | null; availabilityStatus: string;
}
export interface CartItem { product: Product; qty: number; }

interface UserProfile {
  id: string; name?: string; whatsapp?: string;
  shippingStreet?: string; shippingColonia?: string;
  shippingCity?: string; shippingState?: string; shippingZip?: string;
  requiresInvoice?: boolean; rfc?: string; razonSocial?: string;
  regimenFiscal?: string; usoCFDI?: string;
}

interface Form {
  name: string; phone: string;
  street: string; colonia: string; city: string; state: string; zip: string;
  requiresInvoice: boolean;
  rfc: string; razonSocial: string; regimenFiscal: string; usoCFDI: string;
  csfUrl: string;
}

const REGS = [
  '601 — General de Ley Personas Morales',
  '612 — Personas Físicas con Actividades Empresariales',
  '621 — Incorporación Fiscal',
  '626 — Régimen Simplificado de Confianza (RESICO)',
  '625 — Plataformas Tecnológicas',
];
const CFDIS = [
  'G01 — Adquisición de mercancías',
  'G03 — Gastos en general',
  'I01 — Construcciones',
  'D01 — Honorarios médicos y gastos hospitalarios',
  'S01 — Sin efectos fiscales',
];

const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold" style={{ color: MUTED }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'white' }}
        onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(0,200,150,0.4)'}
        onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = BORDER} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold" style={{ color: MUTED }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#1a2035', border: `1px solid ${BORDER}`, color: value ? 'white' : MUTED }}>
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Step 0: Carrito ────────────────────────────────────────────────────────────
function CartStep({ cart, onUpdate, onRemoveItem, onClear, onNext, onClose }: {
  cart: CartItem[]; onUpdate: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void; onClear: () => void;
  onNext: () => void; onClose: () => void;
}) {
  const pubTotal  = cart.reduce((s, i) => s + (i.product.publicPrice ?? 0) * i.qty, 0);
  const speiTotal = cart.reduce((s, i) => s + (i.product.speiPrice ?? 0) * i.qty, 0);

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" style={{ color: GREEN }} />
          <span className="font-black text-base">Tu Cotización</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,200,150,0.12)', color: GREEN }}>
            {cart.reduce((s, i) => s + i.qty, 0)} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && <button onClick={onClear} className="text-[11px] font-semibold hover:text-white" style={{ color: MUTED }}>Limpiar</button>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: MUTED }}><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <ShoppingCart className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Tu carrito está vacío</p>
          </div>
        ) : cart.map(item => (
          <div key={item.product.id} className="flex gap-3 p-3 rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {item.product.image
                ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain p-1" />
                : <span className="text-[9px] font-black font-mono" style={{ color: GREEN }}>TB</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold line-clamp-2 leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-mono font-bold" style={{ color: GREEN }}>
                  ${fmt((item.product.speiPrice ?? item.product.publicPrice ?? 0) * item.qty)} SPEI
                </p>
                {item.product.publicPrice && item.product.speiPrice && (
                  <p className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    ${fmt(item.product.publicPrice * item.qty)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                  <button onClick={() => onUpdate(item.product.id, item.qty - 1)} className="px-2 py-1 hover:bg-white/5" style={{ color: MUTED }}><Minus className="w-3 h-3" /></button>
                  <span className="px-2 text-xs font-black" style={{ color: 'white' }}>{item.qty}</span>
                  <button onClick={() => onUpdate(item.product.id, item.qty + 1)} className="px-2 py-1 hover:bg-white/5" style={{ color: MUTED }}><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => onRemoveItem(item.product.id)} className="p-1 hover:text-red-400 transition-colors" style={{ color: MUTED }}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="px-5 py-4 space-y-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px]" style={{ color: MUTED }}>Precio público</p>
              <p className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.2)' }}>${fmt(pubTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: GREEN }}>Total SPEI (4% desc.)</p>
              <p className="text-2xl font-black" style={{ color: 'white' }}>${fmt(speiTotal)}</p>
            </div>
          </div>
          <button onClick={onNext} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm hover:opacity-90 transition-all" style={{ background: GREEN, color: INK }}>
            Continuar con el Pedido <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

// ── Step 1: Envío + Facturación ────────────────────────────────────────────────
function DataStep({ form, onChange, onCsfExtracted, user, saveToProfile, onSaveToggle, onBack, onNext, loading }: {
  form: Form; onChange: (f: Partial<Form>) => void;
  onCsfExtracted: (data: Partial<FiscalData>, url: string | null) => void;
  user: UserProfile | null; saveToProfile: boolean; onSaveToggle: () => void;
  onBack: () => void; onNext: () => void; loading: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: MUTED }}><ChevronLeft className="w-4 h-4" /></button>
          <MapPin className="w-4 h-4" style={{ color: GREEN }} />
          <span className="font-black text-base">Datos de Entrega</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: CARD, color: MUTED }}>2 / 3</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(0,200,150,0.07)', border: '1px solid rgba(0,200,150,0.15)' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: GREEN }} />
            <p className="text-xs" style={{ color: GREEN }}>Sesión activa — datos pre-cargados de tu perfil</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Contacto</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre completo" value={form.name} onChange={v => onChange({ name: v })} placeholder="Tu nombre" />
            <Field label="WhatsApp" value={form.phone} onChange={v => onChange({ phone: v })} placeholder="844 162 8536" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Dirección de Entrega</p>
          <Field label="Calle y número" value={form.street} onChange={v => onChange({ street: v })} placeholder="Av. Morelos 123 Int. 4" />
          <Field label="Colonia" value={form.colonia} onChange={v => onChange({ colonia: v })} placeholder="Col. Centro" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" value={form.city} onChange={v => onChange({ city: v })} placeholder="Monterrey" />
            <Field label="Estado" value={form.state} onChange={v => onChange({ state: v })} placeholder="Nuevo León" />
          </div>
          <Field label="Código Postal" value={form.zip} onChange={v => onChange({ zip: v })} placeholder="64000" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-3 rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: MUTED }} />
              <span className="text-sm font-bold">¿Requiere Factura?</span>
            </div>
            <button onClick={() => onChange({ requiresInvoice: !form.requiresInvoice })}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{ background: form.requiresInvoice ? GREEN : 'rgba(255,255,255,0.12)' }}>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                style={{ transform: form.requiresInvoice ? 'translateX(22px)' : 'translateX(4px)' }} />
            </button>
          </div>

          {form.requiresInvoice && (
            <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,180,0,0.04)', border: '1px solid rgba(255,180,0,0.15)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: AMBER }}>Datos Fiscales</p>
              <FiscalUpload onExtracted={onCsfExtracted} />
              <Field label="RFC" value={form.rfc} onChange={v => onChange({ rfc: v })} placeholder="XAXX010101000" />
              <Field label="Razón Social" value={form.razonSocial} onChange={v => onChange({ razonSocial: v })} placeholder="Mi Empresa S.A. de C.V." />
              <SelectField label="Régimen Fiscal" value={form.regimenFiscal} onChange={v => onChange({ regimenFiscal: v })} options={REGS} />
              <SelectField label="Uso de CFDI" value={form.usoCFDI} onChange={v => onChange({ usoCFDI: v })} options={CFDIS} />
            </div>
          )}
        </div>

        {user && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: saveToProfile ? GREEN : 'transparent', borderColor: saveToProfile ? GREEN : 'rgba(255,255,255,0.2)' }}>
              {saveToProfile && <span className="text-[8px] font-black" style={{ color: INK }}>✓</span>}
            </div>
            <input type="checkbox" className="sr-only" checked={saveToProfile} onChange={onSaveToggle} />
            <span className="text-xs" style={{ color: MUTED }}>Guardar datos en mi perfil para futuras compras</span>
          </label>
        )}
      </div>

      <div className="px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onNext} disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: GREEN, color: INK }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando pedido...</> : <>Ir a Pagar <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </>
  );
}

// ── Step 2: SPEI + Confirmar ───────────────────────────────────────────────────
function SpeiStep({ cart, form, folio, company, onBack, onClose, onClear }: {
  cart: CartItem[]; form: Form; folio: string;
  company: CompanySettings;
  onBack: () => void; onClose: () => void; onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const CLABE     = company.clabeNumber;
  const speiTotal = cart.reduce((s, i) => s + (i.product.speiPrice ?? 0) * i.qty, 0);
  const addrLine  = [form.street, form.colonia, `${form.city} ${form.state}`, form.zip].filter(Boolean).join(', ');

  const copyClabe = () => { navigator.clipboard.writeText(CLABE).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const waMsg = encodeURIComponent(
    `Hola Iván, acabo de realizar el pago de mi Pedido #${folio}.\n\n` +
    `📦 Detalle:\n` +
    cart.map((i, idx) => `${idx + 1}. ${i.qty}x ${i.product.name} — $${fmt((i.product.speiPrice ?? 0) * i.qty)}`).join('\n') +
    `\n\n💰 Total SPEI transferido: $${fmt(speiTotal)} MXN` +
    (form.requiresInvoice
      ? `\n\n🧾 Facturación: Solicitada\n   RFC: ${form.rfc}\n   Razón Social: ${form.razonSocial}\n   Régimen: ${form.regimenFiscal}\n   Uso CFDI: ${form.usoCFDI}` +
        (form.csfUrl ? `\n   📎 CSF: ${form.csfUrl}` : '')
      : `\n\n🧾 Facturación: No solicitada`) +
    (addrLine ? `\n\n🚚 Dirección de entrega:\n   ${addrLine}` : '') +
    `\n\n📎 Adjunto comprobante a continuación.` +
    (company.comprobantesEmail ? `\n📧 También puedes enviarlo a: ${company.comprobantesEmail}` : '') +
    `\n\n_Enviado desde tonebox.mx/catalogo_`
  );

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: MUTED }}><ChevronLeft className="w-4 h-4" /></button>
          <Building2 className="w-4 h-4" style={{ color: GREEN }} />
          <span className="font-black text-base">Pago por SPEI</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: CARD, color: MUTED }}>3 / 3</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Folio confirmado */}
        <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.22)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: GREEN }}>✅ Pedido Registrado</p>
          <p className="text-2xl font-black" style={{ color: 'white' }}>{folio}</p>
          <p className="text-[11px] mt-1" style={{ color: MUTED }}>Usa este número como referencia en el concepto de tu transferencia</p>
        </div>

        {/* Datos SPEI */}
        <div className="p-4 rounded-xl space-y-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Datos Bancarios SPEI</p>
          {[['Banco', company.bankName], ['Beneficiario', company.beneficiario], ['Concepto', `${folio} — ${form.name || 'Cliente'}`]].map(([l, v]) => (
            <div key={l} className="flex justify-between items-start gap-2">
              <span className="text-[11px] flex-shrink-0" style={{ color: MUTED }}>{l}</span>
              <span className="text-xs font-bold text-right" style={{ color: 'rgba(255,255,255,0.8)' }}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div>
              <p className="text-[11px]" style={{ color: MUTED }}>CLABE Interbancaria</p>
              <p className="text-sm font-mono font-black tracking-wider" style={{ color: 'white' }}>{CLABE}</p>
            </div>
            <button onClick={copyClabe} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: copied ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? GREEN : MUTED }}>
              <Copy className="w-3 h-3" />{copied ? 'Copiada ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Monto total */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.18)' }}>
          <span className="text-sm font-bold" style={{ color: GREEN }}>💰 Monto a transferir</span>
          <div className="text-right">
            <span className="text-2xl font-black" style={{ color: 'white' }}>${fmt(speiTotal)}</span>
            <span className="text-sm ml-1" style={{ color: MUTED }}>MXN</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] px-1" style={{ color: MUTED }}>
          {addrLine && <p>🚚 {addrLine}</p>}
          <p>{form.requiresInvoice ? `🧾 Factura — RFC: ${form.rfc}` : '🧾 Sin factura'}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <a href={`https://wa.me/528441628536?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
          onClick={() => { onClear(); setTimeout(onClose, 300); }}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
          style={{ background: WA, color: '#fff' }}>
          <MessageCircle className="w-4 h-4" />
          Confirmar Pedido y Enviar Comprobante
        </a>
        <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Se abre WhatsApp — adjunta tu comprobante de transferencia en el chat
        </p>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function CheckoutDrawer({ cart, onClose, onUpdate, onRemoveItem, onClear }: {
  cart: CartItem[]; onClose: () => void;
  onUpdate: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void; onClear: () => void;
}) {
  const [step, setStep]          = useState(0);
  const [user, setUser]          = useState<UserProfile | null>(null);
  const [company, setCompany]    = useState(COMPANY_DEFAULTS);
  const [saveToProfile, setSave] = useState(true);
  const [creating, setCreating]  = useState(false);
  const [folio, setFolio]        = useState('');
  const [form, setForm]          = useState<Form>({
    name: '', phone: '', street: '', colonia: '', city: '', state: '', zip: '',
    requiresInvoice: false, rfc: '', razonSocial: '', regimenFiscal: '', usoCFDI: '', csfUrl: '',
  });

  const patch = (partial: Partial<Form>) => setForm(prev => ({ ...prev, ...partial }));

  const handleCsfExtracted = (data: Partial<FiscalData>, url: string | null) => {
    patch({
      rfc:          data.rfc           || form.rfc,
      razonSocial:  data.razonSocial   || form.razonSocial,
      regimenFiscal: data.regimenFiscal || form.regimenFiscal,
      csfUrl:       url ?? form.csfUrl,
    });
  };

  useEffect(() => {
    fetch('/api/company-settings')
      .then(r => r.json())
      .then(d => { if (d.success) setCompany(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const u: UserProfile = d.data;
        setUser(u);
        setForm(prev => ({
          ...prev,
          name:           u.name            || prev.name,
          phone:          u.whatsapp        || prev.phone,
          street:         u.shippingStreet  || prev.street,
          colonia:        u.shippingColonia || prev.colonia,
          city:           u.shippingCity    || prev.city,
          state:          u.shippingState   || prev.state,
          zip:            u.shippingZip     || prev.zip,
          requiresInvoice: u.requiresInvoice ?? false,
          rfc:            u.rfc             || prev.rfc,
          razonSocial:    u.razonSocial     || prev.razonSocial,
          regimenFiscal:  u.regimenFiscal   || prev.regimenFiscal,
          usoCFDI:        u.usoCFDI         || prev.usoCFDI,
        }));
      }).catch(() => {});
  }, []);

  const goToSpei = async () => {
    setCreating(true);
    try {
      if (saveToProfile && user) {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            shippingStreet: form.street, shippingColonia: form.colonia,
            shippingCity: form.city, shippingState: form.state, shippingZip: form.zip,
            requiresInvoice: form.requiresInvoice, rfc: form.rfc,
            razonSocial: form.razonSocial, regimenFiscal: form.regimenFiscal, usoCFDI: form.usoCFDI,
          }),
        }).catch(() => {});
      }

      const res = await fetch('/api/catalog/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            sku: i.product.sku, name: i.product.name, qty: i.qty,
            publicPrice: i.product.publicPrice, speiPrice: i.product.speiPrice,
            lineTotal: (i.product.speiPrice ?? 0) * i.qty,
          })),
          subtotal:   cart.reduce((s, i) => s + (i.product.publicPrice ?? 0) * i.qty, 0),
          speiTotal:  cart.reduce((s, i) => s + (i.product.speiPrice ?? 0) * i.qty, 0),
          shipping:   { street: form.street, colonia: form.colonia, city: form.city, state: form.state, zip: form.zip },
          billing:    { requiresInvoice: form.requiresInvoice, rfc: form.rfc, razonSocial: form.razonSocial, regimenFiscal: form.regimenFiscal, usoCFDI: form.usoCFDI, csfUrl: form.csfUrl || null },
          clientInfo: { name: form.name, phone: form.phone, userId: user?.id },
        }),
      });
      const data = await res.json();
      setFolio(data.folio || `TC-${Date.now().toString(36).slice(-5).toUpperCase()}`);
      setStep(2);
    } catch {
      setFolio(`TC-${Date.now().toString(36).slice(-5).toUpperCase()}`);
      setStep(2);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] flex flex-col"
        style={{ width: 'min(420px,100vw)', background: INK2, borderLeft: `1px solid ${BORDER}` }}>
        {step === 0 && <CartStep cart={cart} onUpdate={onUpdate} onRemoveItem={onRemoveItem} onClear={onClear} onNext={() => setStep(1)} onClose={onClose} />}
        {step === 1 && <DataStep form={form} onChange={patch} onCsfExtracted={handleCsfExtracted} user={user} saveToProfile={saveToProfile} onSaveToggle={() => setSave(p => !p)} onBack={() => setStep(0)} onNext={goToSpei} loading={creating} />}
        {step === 2 && <SpeiStep cart={cart} form={form} folio={folio} company={company} onBack={() => setStep(1)} onClose={onClose} onClear={onClear} />}
      </div>
    </>
  );
}
