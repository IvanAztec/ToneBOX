'use client';

const STEPS = [
  {
    num: '// 01',
    icon: '🖨️',
    title: 'Elige tu combo',
    desc: 'Selecciona el combo según tu impresora o deja que nuestro asistente te recomiende el más rentable para tu volumen.',
  },
  {
    num: '// 02',
    icon: '💳',
    title: 'Paga seguro',
    desc: 'Stripe o PayPal. Pago 100% cifrado. Facturas CFDI disponibles de inmediato subiendo tu Constancia de Situación Fiscal.',
  },
  {
    num: '// 03',
    icon: '⚡',
    title: 'Guía automática',
    desc: 'El sistema genera la guía de envío y notifica a nuestro proveedor. Sin intermediarios, sin demoras. Todo automatizado.',
  },
  {
    num: '// 04',
    icon: '✅',
    title: '¡Listo en tu oficina!',
    desc: 'Recibes en tu puerta o recoges gratis en la sucursal CT más cercana. Seguimiento por WhatsApp todo el tiempo.',
  },
];

export default function HowItWorksSection() {
  return (
    <section
      className="py-24 section-border-top relative overflow-hidden"
      style={{ background: '#161B26' }}
    >
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
          // ¿Cómo funciona?
        </div>
        <h2 className="font-syne mb-14" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}>
          Del pedido a tu oficina<br />en 4 pasos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="rounded-2xl p-7 relative transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.25)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              <div className="font-mono mb-4" style={{ fontSize: 11, letterSpacing: 2, color: '#00C896' }}>
                {step.num}
              </div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{step.icon}</div>
              <div className="font-syne font-bold mb-2" style={{ fontSize: 17 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: '#7A8494', lineHeight: 1.6 }}>{step.desc}</div>
              {i < STEPS.length - 1 && (
                <div
                  className="absolute hidden lg:block"
                  style={{ top: 28, right: -10, zIndex: 1, fontSize: 18, color: 'rgba(0,200,150,0.3)' }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
