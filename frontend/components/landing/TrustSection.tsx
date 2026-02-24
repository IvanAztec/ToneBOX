'use client';

const WA_NUMBER = '528441628536';

const TESTIMONIALS = [
  {
    quote: '"Llevaba años comprando en OfficeMax. Con ToneBox ahorro casi $3,000 al mes solo en toners. El combo corporativo es exactamente lo que necesitaba."',
    initials: 'MR',
    name: 'Marcos R.',
    role: 'Despacho contable, Saltillo',
  },
  {
    quote: '"Lo que más me gustó fue recoger la impresora en el Punto de Entrega ToneBOX en Monterrey. Sin esperar envío, sin pagar flete. Ahí mismo la probé antes de llevarla."',
    initials: 'LC',
    name: 'Laura C.',
    role: 'Consultora independiente, MTY',
  },
  {
    quote: '"Tenemos 8 impresoras en la oficina. Empezamos con ToneBox hace 2 meses y ya calculamos un ahorro de $28,000 anuales en consumibles. Increíble."',
    initials: 'JV',
    name: 'Jorge V.',
    role: 'Director administrativo, PYME Querétaro',
  },
];

const SUB_FEATURES = [
  'Entrega automática',
  '10% de descuento permanente',
  'Cancela cuando quieras',
  'Sin compromisos de volumen',
  'Factura CFDI incluida',
];

function openWA(src: string) {
  const msgs: Record<string, string> = {
    landing:     '¡Hola ToneBox! Me interesa saber más sobre sus combos para PYME.',
    suscripcion: '¡Hola ToneBox! Quiero saber más sobre la suscripción inteligente de toner.',
  };
  const msg = encodeURIComponent(msgs[src] ?? msgs['landing']);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

export default function TrustSection() {
  return (
    <>
      {/* Testimonials */}
      <section className="py-24 max-w-[1160px] mx-auto px-8">
        <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
          // Lo que dicen nuestros clientes
        </div>
        <h2 className="font-syne mb-14" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}>
          PYMES que ya<br />imprimen más barato
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <div
              key={t.initials}
              className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.2)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <div style={{ color: '#00C896', fontSize: 16, marginBottom: 12 }}>★★★★★</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                {t.quote}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full font-syne font-extrabold"
                  style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#00C896,#1A6BFF)', color: '#0B0E14', fontSize: 16 }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-syne font-bold" style={{ fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#7A8494' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="py-24" style={{ background: '#161B26' }}>
        <div className="max-w-[1160px] mx-auto px-8">
          <div
            className="rounded-3xl p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,rgba(0,200,150,0.08),rgba(26,107,255,0.06))',
              border: '1px solid rgba(0,200,150,0.2)',
            }}
          >
            <div
              className="absolute pointer-events-none"
              style={{ top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,200,150,0.08),transparent 70%)' }}
            />
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-4 inline-flex" style={{ color: '#00C896' }}>
              // Nunca más sin toner
            </div>
            <h2 className="font-syne font-extrabold mb-4 relative" style={{ fontSize: 'clamp(28px,4vw,48px)' }}>
              Suscripción <span style={{ color: '#00C896' }}>inteligente</span>
            </h2>
            <p className="relative mx-auto mb-10" style={{ fontSize: 17, color: '#7A8494', maxWidth: 520, lineHeight: 1.7 }}>
              Dinos tu impresora y cuánto imprimes. Nosotros calculamos cuándo se va a acabar tu toner y te lo mandamos antes de que lo notes. Con 10% de descuento adicional.
            </p>
            <div className="flex justify-center gap-8 flex-wrap mb-10 relative">
              {SUB_FEATURES.map(f => (
                <span key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ color: '#00C896', fontWeight: 700 }}>✓</span> {f}
                </span>
              ))}
            </div>
            <button
              onClick={() => openWA('suscripcion')}
              className="inline-flex items-center gap-2 font-syne font-bold rounded-xl transition-all hover:-translate-y-0.5 relative"
              style={{ background: '#00C896', color: '#0B0E14', padding: '18px 40px', border: 'none', fontSize: 17, cursor: 'pointer' }}
            >
              🔄 Activar Suscripción Inteligente
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-32 text-center relative overflow-hidden"
        style={{ background: '#0B0E14' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(0,200,150,0.08),transparent 70%)' }}
        />
        <div className="max-w-[1160px] mx-auto px-8 relative">
          <h2 className="font-syne font-extrabold mb-5" style={{ fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.05 }}>
            Tu oficina,<br /><span style={{ color: '#00C896' }}>siempre lista.</span>
          </h2>
          <p style={{ fontSize: 18, color: '#7A8494', marginBottom: 40 }}>
            Únete a las PYMES que ya imprimen más barato.<br />Tu primer pedido con envío express sin costo adicional.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => openWA('landing')}
              className="inline-flex items-center gap-2 font-syne font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: '#FF5C28', color: 'white', padding: '18px 36px', border: 'none', fontSize: 17, cursor: 'pointer' }}
            >
              💬 Hablar con un asesor
            </button>
            <a
              href="#combos"
              className="inline-flex items-center gap-2 font-syne font-bold rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '18px 28px', border: '1px solid rgba(255,255,255,0.15)', fontSize: 15 }}
            >
              Ver todos los combos →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
