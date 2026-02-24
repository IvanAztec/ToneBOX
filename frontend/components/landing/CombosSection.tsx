'use client';

const WA_NUMBER = '528441628536';

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
}

interface Props {
  bundles: Bundle[];
  onSelect: (b: Bundle) => void;
}

const BADGES = [
  { label: 'Starter',        style: { background: 'rgba(255,92,40,0.15)',  color: '#FF5C28', border: '1px solid rgba(255,92,40,0.3)' } },
  { label: '⭐ Más Rentable', style: { background: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)' } },
  { label: 'Profesional',    style: { background: 'rgba(26,107,255,0.15)', color: '#1A6BFF', border: '1px solid rgba(26,107,255,0.3)' } },
  { label: 'Enterprise',     style: { background: 'rgba(255,92,40,0.10)',  color: '#FF8C5E', border: '1px solid rgba(255,92,40,0.2)' } },
];

const ICONS = ['💚', '🔥', '💼', '🏆'];

function waCombo(name: string) {
  const msg = encodeURIComponent(`¡Hola ToneBox! Me interesa el combo: ${name}. ¿Me pueden dar más información?`);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

export default function CombosSection({ bundles, onSelect }: Props) {
  const shown = bundles.slice(0, 4);

  return (
    <section
      id="combos"
      className="py-24 section-border-top relative overflow-hidden"
      style={{ background: '#161B26' }}
    >
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3" style={{ color: '#00C896' }}>
          // Packs de Ahorro PYME
        </div>
        <h2 className="font-syne mb-4" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.1 }}>
          Combos diseñados<br />para tu negocio
        </h2>
        <p className="mb-14" style={{ fontSize: 16, color: '#7A8494', lineHeight: 1.7, maxWidth: 520 }}>
          La combinación perfecta de tóner + drum. Elige según tu volumen de impresión y empieza a ahorrar hoy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {shown.length === 0 ? (
            // Fallback static combos if no API data
            [
              { name: 'Startup Hero',  desc: 'Brother DCP-B7535DW + 2 Toners TNB022',    price: 4654, was: 5800, cpp: '$0.15' },
              { name: 'Corporativo',   desc: 'Brother MFC-L2540DW + 2 Toners XL TN660',  price: 6438, was: 8200, cpp: '$0.14' },
              { name: 'PYME Pro',      desc: 'Brother MFC-L2550DW + 2 Toners TN730',     price: 5854, was: 7400, cpp: '$0.30' },
              { name: 'Enterprise',    desc: 'HP LaserJet Pro + 2 Toners CF283A',         price: 7850, was: 9500, cpp: '$0.12' },
            ].map((c, i) => (
              <ComboCard
                key={i}
                index={i}
                name={c.name}
                desc={c.desc}
                price={c.price}
                wasSaved={c.was - c.price}
                cpp={c.cpp}
                onWa={() => waCombo(c.name)}
                onSelect={() => {}}
              />
            ))
          ) : (
            shown.map((b, i) => (
              <ComboCard
                key={b.id}
                index={i}
                name={b.name}
                desc={b.description ?? ''}
                price={b.price ?? 0}
                wasSaved={b.price ? Math.round(b.price * 0.149) : 0}
                cpp="$0.14"
                onWa={() => waCombo(b.name)}
                onSelect={() => onSelect(b)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

interface CardProps {
  index: number;
  name: string;
  desc: string;
  price: number;
  wasSaved: number;
  cpp: string;
  onWa: () => void;
  onSelect: () => void;
}

function ComboCard({ index, name, desc, price, wasSaved, cpp, onWa, onSelect }: CardProps) {
  const isFeatured = index === 1;
  const badge = BADGES[index] ?? BADGES[0];
  const icon = ICONS[index] ?? '🖨️';

  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-default"
      style={{
        background: isFeatured ? 'rgba(0,200,150,0.05)' : 'rgba(255,255,255,0.04)',
        border: isFeatured ? '1px solid rgba(0,200,150,0.3)' : '1px solid rgba(255,255,255,0.08)',
        borderTop: isFeatured ? '3px solid #00C896' : undefined,
      }}
    >
      {/* Badge */}
      <div
        className="absolute top-5 right-5 font-mono text-[9px] tracking-[2px] uppercase px-2.5 py-1 rounded-full font-bold"
        style={badge.style}
      >
        {badge.label}
      </div>

      {/* Icon + Name */}
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div className="font-syne font-extrabold mb-1" style={{ fontSize: 20, lineHeight: 1.2 }}>{name}</div>
      <div className="mb-5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{desc}</div>

      {/* Features list */}
      <ul className="mb-6 space-y-1">
        {['Combo Tóner + Drum del mismo proveedor', 'Ahorro garantizado 13%', 'Entrega express nacional', 'Factura CFDI incluida'].map(f => (
          <li key={f} className="flex items-center gap-2" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#00C896', fontWeight: 700 }}>✓</span> {f}
          </li>
        ))}
      </ul>

      {/* Price row */}
      <div className="flex items-end justify-between pt-5 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div className="font-syne font-extrabold" style={{ fontSize: 28, color: '#00C896', lineHeight: 1 }}>
            ${price.toLocaleString('es-MX')} <span style={{ fontSize: 14 }}>MXN</span>
          </div>
          {wasSaved > 0 && (
            <div style={{ fontSize: 13, color: '#7A8494', marginTop: 2 }}>Ahorras ${wasSaved.toLocaleString('es-MX')} MXN</div>
          )}
        </div>
        <div className="font-mono text-right" style={{ fontSize: 11, color: '#7A8494' }}>
          Costo/página<br />
          <span style={{ fontSize: 16, color: 'white', fontWeight: 700 }}>{cpp}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onWa}
        className="w-full py-3.5 rounded-xl font-syne font-bold transition-all hover:-translate-y-px"
        style={{
          background: '#00C896',
          color: '#0B0E14',
          border: 'none',
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: isFeatured ? '0 8px 24px rgba(0,200,150,0.3)' : undefined,
        }}
      >
        🛒 Quiero este combo
      </button>
    </div>
  );
}
