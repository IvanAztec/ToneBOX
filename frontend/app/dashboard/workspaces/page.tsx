'use client';

import { Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const INK2   = '#161B26';
const GREEN  = '#00C896';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';

const SUCURSALES = [
  { ciudad: 'Saltillo',       estado: 'Coahuila',  tipo: 'CEDI',          tel: '844 162 8536' },
  { ciudad: 'Monterrey',      estado: 'Nuevo León', tipo: 'Hub Principal', tel: '—' },
  { ciudad: 'CDMX',           estado: 'CDMX',      tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Guadalajara',    estado: 'Jalisco',    tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Puebla',         estado: 'Puebla',     tipo: 'Punto ToneBOX', tel: '—' },
  { ciudad: 'Querétaro',      estado: 'Querétaro',  tipo: 'Punto ToneBOX', tel: '—' },
];

const TIPO_STYLE: Record<string, { color: string; bg: string }> = {
  'CEDI':          { color: GREEN,     bg: 'rgba(0,200,150,0.12)' },
  'Hub Principal': { color: '#1A6BFF', bg: 'rgba(26,107,255,0.12)' },
  'Punto ToneBOX': { color: MUTED,     bg: 'rgba(255,255,255,0.06)' },
};

export default function WorkspacesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <div className="font-mono text-[10px] tracking-[3px] uppercase mb-1" style={{ color: GREEN }}>
            // ToneBOX — Gestión de Tóners
          </div>
          <h1 className="font-syne text-2xl font-extrabold tracking-tight" style={{ color: 'white' }}>
            Mi Empresa
          </h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Puntos de cobertura y datos de contacto ToneBOX
          </p>
        </div>

        {/* Datos de empresa */}
        <div
          className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
          style={{ background: INK2, border: `1px solid ${BORDER}` }}
        >
          <div>
            <p className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Datos de contacto
            </p>
            {[
              { icon: <Building2 className="w-4 h-4" />, label: 'ToneBox México S.A. de C.V.' },
              { icon: <MapPin className="w-4 h-4" />,    label: 'Saltillo, Coahuila — México' },
              { icon: <Phone className="w-4 h-4" />,     label: '+52 844 162 8536' },
              { icon: <Mail className="w-4 h-4" />,      label: 'hola@tonebox.mx' },
              { icon: <Globe className="w-4 h-4" />,     label: 'tonebox.mx' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 mb-3">
                <span style={{ color: MUTED }}>{row.icon}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{row.label}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Datos fiscales
            </p>
            {[
              { l: 'Banco',  v: 'BBVA Bancomer' },
              { l: 'CLABE',  v: '012180004567890123' },
              { l: 'RFC',    v: 'TMX-XXXXXX-XXX' },
              { l: 'Régimen', v: 'Persona Moral' },
            ].map(row => (
              <div key={row.l} className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: MUTED }}>{row.l}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Red de sucursales */}
        <div className="rounded-2xl overflow-hidden" style={{ background: INK2, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h3 className="font-syne font-bold" style={{ color: 'white' }}>
              Red de Puntos de Entrega ToneBOX
            </h3>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              44+ puntos de retiro gratuito en México
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {SUCURSALES.map(s => {
              const style = TIPO_STYLE[s.tipo] ?? TIPO_STYLE['Punto ToneBOX'];
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
                    <span
                      className="hidden sm:inline px-2.5 py-1 rounded-full text-[10px] font-black"
                      style={{ color: style.color, background: style.bg }}
                    >
                      {s.tipo}
                    </span>
                    {s.tel !== '—' && (
                      <span className="font-mono text-xs" style={{ color: MUTED }}>{s.tel}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <a
              href="/#logistica"
              className="text-xs font-medium transition-colors"
              style={{ color: GREEN }}
            >
              Ver mapa completo de cobertura →
            </a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
