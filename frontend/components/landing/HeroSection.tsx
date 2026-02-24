'use client';

import ToneBoxLogo from '@/components/shared/ToneBoxLogo';

const STATS = [
  { val: '60%',   lbl: 'Ahorro promedio' },
  { val: '44+',   lbl: 'Ciudades con entrega' },
  { val: '$0.14', lbl: 'Costo/página mínimo' },
  { val: '24h',   lbl: 'Entrega express' },
];

interface Props {
  onCombosCta: () => void;
  onCalcCta:   () => void;
}

export default function HeroSection({ onCombosCta, onCalcCta }: Props) {
  return (
    <section
      style={{ minHeight: '100vh', padding: '140px 0 80px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -200, right: -150, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,107,255,0.10) 0%, transparent 65%)' }} />
        <div className="hero-grid-bg" style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1160px] mx-auto px-8">
        {/* Eyebrow tags */}
        <div className="anim-1 mb-6 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-mono"
            style={{ background: 'rgba(0,200,150,0.12)', color: '#00C896', border: '1px solid rgba(0,200,150,0.25)' }}>
            ⚡ Ahorra hasta 60%
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase font-mono"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
            +44 ciudades de México
          </span>
        </div>

        {/* Headline */}
        <h1
          className="anim-2 font-syne"
          style={{ fontSize: 'clamp(44px,7vw,88px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: -2, marginBottom: 24 }}
        >
          Imprime más.<br />
          <span style={{ color: '#00C896' }}>Gasta menos.</span><br />
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>Sin complicaciones.</span>
        </h1>

        {/* Sub */}
        <p className="anim-3" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          Consumibles e impresoras para oficinas, profesionistas y PYMES. Combos inteligentes, entrega en tu ciudad y ahorro demostrable desde el primer pedido.
        </p>

        {/* CTAs */}
        <div className="anim-4 flex flex-wrap gap-3 mb-14">
          <button
            onClick={onCombosCta}
            className="inline-flex items-center gap-2 font-syne font-bold rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ background: '#00C896', color: '#0B0E14', padding: '16px 32px', fontSize: 16, border: 'none' }}
          >
            Ver Combos PYME →
          </button>
          <button
            onClick={onCalcCta}
            className="inline-flex items-center gap-2 font-syne font-bold rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '16px 28px', fontSize: 15, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            🧮 Calcular mi ahorro
          </button>
        </div>

        {/* Stats */}
        <div className="anim-4 flex flex-wrap gap-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {STATS.map(s => (
            <div key={s.val}>
              <div className="font-syne" style={{ fontSize: 32, fontWeight: 800, color: '#00C896', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating logo (desktop only) */}
      <div
        className="animate-float hidden lg:flex flex-col items-center gap-5"
        style={{ position: 'absolute', right: 60, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
      >
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <div style={{ width: 120, height: 120, border: '6px solid rgba(255,255,255,0.08)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }} />
          </div>
          <div className="animate-pulse-dot absolute rounded-full bg-[#00C896] border-4 border-[#0B0E14]"
            style={{ width: 36, height: 36, top: -14, right: -14 }} />
        </div>
        <div className="font-syne text-center" style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, color: 'rgba(255,255,255,0.06)' }}>
          Tone<span style={{ color: 'rgba(0,200,150,0.3)' }}>Box</span>
        </div>
      </div>
    </section>
  );
}
