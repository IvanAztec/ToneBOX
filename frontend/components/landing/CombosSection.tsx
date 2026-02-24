'use client';

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  speiPrice?: number | null;
  freeShipping?: boolean;
  comboType?: string;
}

interface Props {
  bundles: Bundle[];
  onSelect: (b: Bundle) => void;
}

// Config per combo type: badge, icon, features list
const COMBO_TYPE_CONFIG: Record<string, {
  badge: { label: string; style: React.CSSProperties };
  icon: string;
  features: string[];
}> = {
  TRIPACK: {
    badge: {
      label: '⭐ TriPack',
      style: { background: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)' },
    },
    icon: '📦',
    features: ['2x Tóners Alta Capacidad', '1x Unidad de Imagen (Drum)', 'Envío Gratis Nacional', 'Factura CFDI incluida'],
  },
  BUSINESS_START: {
    badge: {
      label: '💼 Business',
      style: { background: 'rgba(26,107,255,0.15)', color: '#1A6BFF', border: '1px solid rgba(26,107,255,0.3)' },
    },
    icon: '🖥️',
    features: ['Incluye 2 Tóners Extra + 1 Drum adicional', '1x Impresora Multifuncional', 'Envío Gratis'],
  },
  DUO_PACK: {
    badge: {
      label: 'Duo Pack',
      style: { background: 'rgba(255,92,40,0.15)', color: '#FF5C28', border: '1px solid rgba(255,92,40,0.3)' },
    },
    icon: '💚',
    features: ['Tóner + Drum Premium ToneBOX', '1x Tóner Alta Capacidad', '1x Unidad de Imagen (Drum)', 'Ahorro garantizado', 'Factura CFDI incluida'],
  },
  ULTRAPACK: {
    badge: {
      label: '🏆 Ultra',
      style: { background: 'rgba(255,200,0,0.15)', color: '#FFC800', border: '1px solid rgba(255,200,0,0.3)' },
    },
    icon: '⚡',
    features: ['3x Tóners Alta Capacidad', '1x Unidad de Imagen (Drum)', 'Alto Volumen 8,100 pgs', 'Envío Gratis Nacional'],
  },
};

const DEFAULT_CONFIG = COMBO_TYPE_CONFIG.DUO_PACK;

// Static fallback (shown when API returns 0 bundles)
const STATIC_COMBOS = [
  {
    name: 'TriPack Ahorro Total',
    desc: '2× TN660 Alta Cap. + 1× DR630 Drum — Serie L2540',
    price: 2890,
    comboType: 'TRIPACK',
    freeShipping: true,
    featured: true,
    retailSaved: 860,
  },
  {
    name: 'TriPack Ahorro Total',
    desc: '2× TN760 Alta Cap. + 1× DR730 Drum — Serie L2350',
    price: 3190,
    comboType: 'TRIPACK',
    freeShipping: true,
    featured: false,
    retailSaved: 910,
  },
  {
    name: 'TriPack Ultra Brother — Serie L5000',
    desc: '3× TN850 Alta Cap. + 1× DR820 Drum — Alto Volumen',
    price: 3990,
    comboType: 'ULTRAPACK',
    freeShipping: true,
    featured: false,
    retailSaved: 1210,
  },
  {
    name: 'Pack Business Start',
    desc: 'La oficina lista en un solo click. Todo lo necesario para tus primeras 5,200 páginas.',
    price: 8490,
    comboType: 'BUSINESS_START',
    freeShipping: true,
    featured: false,
    retailSaved: 1710,
  },
];

export default function CombosSection({ bundles, onSelect }: Props) {
  const apiShown = bundles.slice(0, 6);
  const useStatic = apiShown.length === 0;
  const colsClass = useStatic
    ? 'lg:grid-cols-4'
    : apiShown.length <= 3
      ? 'lg:grid-cols-3'
      : 'lg:grid-cols-4';

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

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${colsClass} gap-5`}>
          {useStatic
            ? STATIC_COMBOS.map((c, i) => (
                <ComboCard
                  key={i}
                  isFeatured={c.featured}
                  comboType={c.comboType}
                  name={c.name}
                  desc={c.desc}
                  price={c.price}
                  speiPrice={parseFloat((c.price / 1.04).toFixed(0))}
                  freeShipping={c.freeShipping}
                  wasSaved={c.retailSaved}
                  onSelect={() => onSelect({ id: `static-${i}`, name: c.name, description: c.desc, price: c.price, comboType: c.comboType })}
                />
              ))
            : apiShown.map((b, i) => (
                <ComboCard
                  key={b.id}
                  isFeatured={i === 0}
                  comboType={b.comboType ?? 'DUO_PACK'}
                  name={b.name}
                  desc={b.description ?? ''}
                  price={b.price ?? 0}
                  speiPrice={b.speiPrice ?? null}
                  freeShipping={b.freeShipping ?? false}
                  wasSaved={b.price ? Math.round(b.price * 0.03) : 0}
                  onSelect={() => onSelect(b)}
                />
              ))
          }
        </div>
      </div>
    </section>
  );
}

interface CardProps {
  isFeatured: boolean;
  comboType: string;
  name: string;
  desc: string;
  price: number;
  speiPrice: number | null;
  freeShipping: boolean;
  wasSaved: number;
  onSelect: () => void;
}

function ComboCard({ isFeatured, comboType, name, desc, price, speiPrice, freeShipping, wasSaved, onSelect }: CardProps) {
  const config = COMBO_TYPE_CONFIG[comboType] ?? DEFAULT_CONFIG;

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
        style={config.badge.style}
      >
        {config.badge.label}
      </div>

      {/* Icon + Name */}
      <div style={{ fontSize: 40, marginBottom: 12 }}>{config.icon}</div>
      <div className="font-syne font-extrabold mb-1" style={{ fontSize: 20, lineHeight: 1.2 }}>{name}</div>
      <div className="mb-5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{desc}</div>

      {/* Features list */}
      <ul className="mb-6 space-y-1">
        {config.features.map(f => (
          <li
            key={f}
            className="flex items-center gap-2"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span style={{ color: '#00C896', fontWeight: 700 }}>✓</span> {f}
          </li>
        ))}
      </ul>

      {/* Price row */}
      <div className="pt-5 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="mb-1">
          <div className="font-syne font-extrabold" style={{ fontSize: 28, color: '#00C896', lineHeight: 1 }}>
            ${price.toLocaleString('es-MX')} <span style={{ fontSize: 14 }}>MXN</span>
          </div>
          {speiPrice != null && (
            <div className="flex items-center gap-1 mt-1">
              <span style={{ fontSize: 12, color: '#25D366', fontWeight: 700 }}>
                ${speiPrice.toLocaleString('es-MX')} vía SPEI
              </span>
              <span style={{ fontSize: 9, background: 'rgba(37,211,102,0.15)', color: '#25D366', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                -4%
              </span>
            </div>
          )}
          {wasSaved > 0 && (
            <div style={{ fontSize: 12, color: '#7A8494', marginTop: 2 }}>
              Ahorras ${wasSaved.toLocaleString('es-MX')} MXN vs tienda
            </div>
          )}
        </div>

        {freeShipping && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 mt-3"
            style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}
          >
            <span style={{ fontSize: 12 }}>🚚</span>
            <span style={{ fontSize: 11, color: '#00C896', fontWeight: 700 }}>Envío Gratis incluido</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onSelect}
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
        🛒 Seleccionar combo
      </button>
    </div>
  );
}
