'use client';

import { useState } from 'react';

const WA_NUMBER = '528441628536';

interface CalcResult {
  annual: number;
  monthly: number;
  pct: number;
  pages: number;
  typeName: string;
}

const CALC_DATA: Record<string, { orig: number; compat: number; pct: number; name: string }> = {
  'laser-bw':    { orig: 1.80, compat: 0.55, pct: 55, name: 'Láser B/N' },
  'laser-color': { orig: 4.20, compat: 1.60, pct: 60, name: 'Láser Color' },
  'inkjet':      { orig: 2.50, compat: 0.90, pct: 52, name: 'Inkjet' },
  'multifunc':   { orig: 2.10, compat: 0.75, pct: 57, name: 'Multifuncional' },
};

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-MX') + ' MXN';
}

export default function CalculatorSection() {
  const [printerType, setPrinterType] = useState('');
  const [pages, setPages] = useState('');
  const [numPrinters, setNumPrinters] = useState('2');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    if (!printerType || !pages) {
      setError('Por favor completa todos los campos');
      return;
    }
    setError('');
    const d = CALC_DATA[printerType];
    const pagesPerMonth = parseInt(pages) * parseInt(numPrinters || '1');
    const monthly = (d.orig - d.compat) * pagesPerMonth;
    setResult({
      annual:   monthly * 12,
      monthly,
      pct:      d.pct,
      pages:    pagesPerMonth * 12,
      typeName: d.name,
    });
  }

  function openWA() {
    const msg = encodeURIComponent('¡Hola ToneBox! Acabo de calcular mi ahorro y quiero ver los combos recomendados.');
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  }

  return (
    <section
      id="calculadora"
      className="py-24 section-border-bottom relative overflow-hidden"
      style={{ background: '#161B26' }}
    >
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
              // Calculadora de Ahorro
            </div>
            <h2 className="font-syne mb-4" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}>
              ¿Cuánto<br />estás tirando<br />a la basura?
            </h2>
            <div className="font-syne" style={{ fontSize: 'clamp(64px,10vw,120px)', fontWeight: 800, lineHeight: 0.9, color: '#00C896', letterSpacing: -4, margin: '20px 0 16px' }}>
              60<sup style={{ fontSize: '0.4em', verticalAlign: 'super' }}>%</sup>
            </div>
            <p style={{ fontSize: 16, color: '#7A8494', lineHeight: 1.7, maxWidth: 380 }}>
              Así de simple: cada peso que gastas en toner original de OfficeMax o Amazon, ToneBox te lo regresa como ahorro. Calcula el tuyo en 10 segundos.
            </p>
          </div>

          {/* Right: form */}
          <div
            className="rounded-3xl p-10"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <InputLabel>¿Qué tipo de impresora tienes?</InputLabel>
            <select value={printerType} onChange={e => setPrinterType(e.target.value)} style={selectStyle}>
              <option value="">— Selecciona —</option>
              <option value="laser-bw">Láser blanco y negro (Brother, HP LaserJet)</option>
              <option value="laser-color">Láser color (HP, Canon, Xerox)</option>
              <option value="inkjet">Inyección de tinta (Epson, Canon, HP DeskJet)</option>
              <option value="multifunc">Multifuncional (imprime + escanea + copia)</option>
            </select>

            <InputLabel>¿Cuántas páginas imprimes al mes?</InputLabel>
            <select value={pages} onChange={e => setPages(e.target.value)} style={selectStyle}>
              <option value="">— Selecciona —</option>
              <option value="200">Poco — hasta 200 páginas</option>
              <option value="500">Moderado — 200 a 500 páginas</option>
              <option value="1000">Bastante — 500 a 1,000 páginas</option>
              <option value="2000">Mucho — más de 1,000 páginas</option>
            </select>

            <InputLabel>¿Cuántas impresoras tiene tu oficina?</InputLabel>
            <input
              type="number"
              min={1} max={99}
              value={numPrinters}
              onChange={e => setNumPrinters(e.target.value)}
              placeholder="Ej: 3"
              style={{ ...selectStyle, marginBottom: 4 }}
            />

            {error && <p style={{ color: '#FF5C28', fontSize: 13, marginBottom: 8 }}>{error}</p>}

            <button
              onClick={calculate}
              className="w-full font-syne font-bold rounded-xl transition-all hover:-translate-y-px mt-1"
              style={{ padding: 16, background: '#00C896', color: '#0B0E14', border: 'none', fontSize: 16, cursor: 'pointer' }}
            >
              📊 Calcular mi ahorro anual
            </button>

            {/* Result panel */}
            {result && (
              <div
                className="mt-6 rounded-2xl p-7"
                style={{ background: 'linear-gradient(135deg,rgba(0,200,150,0.1),rgba(26,107,255,0.08))', border: '1px solid rgba(0,200,150,0.25)' }}
              >
                <div className="font-syne font-extrabold mb-1" style={{ fontSize: 52, color: '#00C896', lineHeight: 1 }}>
                  {fmt(result.annual)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>de ahorro anual estimado</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { val: fmt(result.monthly), lbl: 'Ahorro mensual' },
                    { val: `${result.pct}%`,     lbl: 'Descuento real' },
                    { val: result.pages.toLocaleString('es-MX'), lbl: 'Págs/año' },
                  ].map(row => (
                    <div key={row.lbl}>
                      <div className="font-syne font-bold" style={{ fontSize: 20 }}>{row.val}</div>
                      <div style={{ fontSize: 11, color: '#7A8494', marginTop: 2 }}>{row.lbl}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={openWA}
                  className="w-full mt-5 font-syne font-bold rounded-xl transition-all hover:-translate-y-px"
                  style={{ padding: '14px', background: '#00C896', color: '#0B0E14', border: 'none', fontSize: 14, cursor: 'pointer' }}
                >
                  💬 Ver combos recomendados
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  marginBottom: 16,
  background: 'rgba(255,255,255,0.06)',
  border: '1.5px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: 'white',
  fontFamily: 'var(--font-dm-sans, sans-serif)',
  fontSize: 15,
  outline: 'none',
  appearance: 'none' as const,
};

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
      {children}
    </label>
  );
}
