const CITIES = [
  { code: 'MTY', cedi: true },  { code: 'SAL', cedi: false },
  { code: 'CHI', cedi: false },  { code: 'TIJ', cedi: false },
  { code: 'HMO', cedi: false },  { code: 'CUL', cedi: false },
  { code: 'DGO', cedi: false },  { code: 'TRC', cedi: false },
  { code: 'ZAC', cedi: false },  { code: 'AGS', cedi: false },
  { code: 'GDL', cedi: false },  { code: 'QRO', cedi: false },
  { code: 'SLP', cedi: false },  { code: 'LEO', cedi: false },
  { code: 'CEL', cedi: false },  { code: 'MOR', cedi: false },
  { code: 'TOL', cedi: false },  { code: 'CDMX', cedi: true },
  { code: 'PUE', cedi: false },  { code: 'VER', cedi: false },
  { code: 'OAX', cedi: false },  { code: 'MER', cedi: false },
  { code: 'CAN', cedi: false },  { code: 'TIJ', cedi: false },
];

const POINTS = [
  {
    icon: '📍',
    color: 'rgba(0,200,150,0.12)',
    title: 'Recoge Gratis en Sucursal CT',
    desc: '44 sucursales en todo México. Recoge tu impresora sin pagar envío. Si no hay stock local, te la trasladan entre sucursales máximo en 24h.',
  },
  {
    icon: '🚀',
    color: 'rgba(255,92,40,0.12)',
    title: 'Envío Express con Pakke',
    desc: 'Sistema inteligente que compara FedEx, Estafeta, Redpack y Paquete Express en tiempo real. Siempre el más rápido y barato para tu código postal.',
  },
  {
    icon: '📦',
    color: 'rgba(0,200,150,0.12)',
    title: 'Guía Automática — Sin Trámites',
    desc: 'Al confirmar tu pago, la guía se genera sola. Solo espera. Sin llamadas, sin "mándame foto del comprobante", sin complicaciones.',
  },
  {
    icon: '🔔',
    color: 'rgba(26,107,255,0.12)',
    title: 'Rastreo en Tiempo Real',
    desc: 'Te avisamos por WhatsApp cada vez que tu paquete avanza: confirmado, en tránsito, llegando hoy. Sin entrar a ningún portal.',
  },
];

export default function LogisticsSection() {
  return (
    <section id="logistica" className="py-24 max-w-[1160px] mx-auto px-8">
      <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
        // Logística Inteligente
      </div>
      <h2 className="font-syne mb-4" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}>
        Tu pedido llega.<br />Siempre.
      </h2>
      <p className="mb-14" style={{ fontSize: 16, color: '#7A8494', lineHeight: 1.7, maxWidth: 520 }}>
        La red de entrega más amplia del mercado de consumibles. Recoge gratis o recibe en tu puerta.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Mexico map grid */}
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 340 }}
        >
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-5" style={{ color: '#7A8494' }}>
            // Red de Cobertura — México
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
            {CITIES.map((c, i) => (
              <div
                key={`${c.code}-${i}`}
                className="text-center rounded-lg px-1.5 py-2 text-[10px] transition-all cursor-default"
                style={c.cedi ? {
                  background: 'rgba(0,200,150,0.25)',
                  border: '1px solid #00C896',
                  color: '#00C896',
                  fontWeight: 700,
                } : {
                  background: 'rgba(0,200,150,0.12)',
                  border: '1px solid rgba(0,200,150,0.25)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {c.code}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#7A8494' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C896' }} />
              CEDIs (distribución)
            </div>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#7A8494' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.3)' }} />
              Sucursales CT
            </div>
          </div>
        </div>

        {/* Logistics points */}
        <ul className="space-y-0">
          {POINTS.map(p => (
            <li key={p.title} className="flex gap-4 items-start py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{ width: 44, height: 44, background: p.color, fontSize: 20 }}
              >
                {p.icon}
              </div>
              <div>
                <div className="font-syne font-bold mb-1" style={{ fontSize: 15 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: '#7A8494', lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
