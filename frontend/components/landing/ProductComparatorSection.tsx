'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Tag, Package, MessageCircle, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const WA_NUMBER      = '528441628536';
const SHOWCASE_LIMIT = 4;
const BUNDLE_LIMIT   = 4;

const BEST_SELLER_SKUS = [
  '85A','78A','05A','80A','55A','64A','CF280A','CF226A','CF258A',
  'CE285A','CE278A','CE505A','CF283A','CF294A',
  'TN-660','TN-630','TN-760','TN-227','TN-850',
  'TK-1175','TK-1162','TK-3182',
];

// Marcas disponibles en el picker de Duo Packs
const BUNDLE_BRANDS = ['hp','brother','samsung','canon','kyocera','xerox','lexmark'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  publicPrice: number | null;
  speiPrice:   number | null;
  productType: string;
  providerSku: string | null;
  compatibility: string[];
  yield?: number | null;
  image?: string | null;
  provider?: { name: string; code: string } | null;
  tier?: string;
}

interface ProductPair {
  compatible: Product | null;
  original:   Product | null;
  key:        string;
}

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  comboType: string;
  price: number | null;
  speiPrice: number | null;
  freeShipping: boolean;
  availabilityStatus: string;
}

interface Props {
  onSelectProduct: (name: string, price: number) => void;
}

// ── Brand config ──────────────────────────────────────────────────────────────

const BRAND_CONFIG: Record<string, { bg: string; label: string }> = {
  hp:      { bg: '#2563EB', label: 'HP' },
  brother: { bg: '#374151', label: 'Brother' },
  canon:   { bg: '#DC2626', label: 'Canon' },
  epson:   { bg: '#4338CA', label: 'Epson' },
  kyocera: { bg: '#D97706', label: 'Kyocera' },
  samsung: { bg: '#1E3A8A', label: 'Samsung' },
  xerox:   { bg: '#B91C1C', label: 'Xerox' },
  ricoh:   { bg: '#0D9488', label: 'Ricoh' },
  lexmark: { bg: '#15803D', label: 'Lexmark' },
};
const BRAND_ORDER = ['hp','brother','canon','epson','kyocera','samsung','xerox','ricoh','lexmark'];

const NOISE_CATEGORIES = new Set(['Ribbon','Label','Paper','Consumible','Ink']);

const COMBO_LABELS: Record<string, string> = {
  DUO_PACK:       'Duo Pack',
  TRIPACK:        'TriPack',
  BUSINESS_START: 'Business Start',
};

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Elimina tokens "000" y espacios múltiples en nombres de producto */
function cleanName(raw: string): string {
  return raw.replace(/\b0{3,}\b/g, '').replace(/\s+/g, ' ').trim();
}

// Icono SVG tambor OPC
function OPCDrumIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="6"  rx="8" ry="3" />
      <ellipse cx="12" cy="18" rx="8" ry="3" />
      <line x1="4"  y1="6" x2="4"  y2="18" />
      <line x1="20" y1="6" x2="20" y2="18" />
      <line x1="12" y1="3" x2="12" y2="6" strokeWidth="1.2" />
    </svg>
  );
}

const QUICK_ACCESS: { id: string; icon: React.ReactNode; label: string }[] = [
  { id: 'Toner',   icon: '🖨️',          label: 'Tóners'   },
  { id: 'Drum',    icon: <OPCDrumIcon />, label: 'Tambores'  },
  { id: 'bundles', icon: '💎',            label: 'Duo Packs' },
  { id: 'search',  icon: '🔍',            label: 'Buscador'  },
];

function isBestSeller(p: Product): boolean {
  const text = `${p.name} ${p.sku} ${p.providerSku ?? ''}`.toUpperCase();
  return BEST_SELLER_SKUS.some(s => text.includes(s));
}

function pairProducts(products: Product[]): ProductPair[] {
  const compatibles = products.filter(p => p.productType === 'COMPATIBLE');
  const originals   = products.filter(p => p.productType === 'ORIGINAL');
  const usedOrigIds = new Set<string>();
  const pairs: ProductPair[] = [];

  for (const comp of compatibles) {
    const match = originals.find(orig =>
      !usedOrigIds.has(orig.id) &&
      comp.compatibility?.some(c => c === orig.sku || c === orig.providerSku)
    );
    if (match) usedOrigIds.add(match.id);
    pairs.push({ compatible: comp, original: match ?? null, key: comp.id });
  }
  for (const orig of originals) {
    if (!usedOrigIds.has(orig.id)) pairs.push({ compatible: null, original: orig, key: orig.id });
  }
  return pairs;
}

// ── Shared trust badge ────────────────────────────────────────────────────────

function TrustBadge() {
  return (
    <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: 'rgba(0,200,150,0.5)' }}>
      <span>✓</span>
      <span>Garantía ToneBOX: Satisfacción Total</span>
    </div>
  );
}

// ── CardSkeleton ──────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3 animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="h-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-7 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ── BrandPickerForBundles ─────────────────────────────────────────────────────

function BrandPickerForBundles({ onSelect }: { onSelect: (brand: string) => void }) {
  return (
    <div className="py-4">
      <p className="text-sm font-semibold text-center mb-6" style={{ color: '#7A8494' }}>
        ¿Combo de ahorro para qué marca?
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-xs sm:max-w-sm mx-auto">
        {BUNDLE_BRANDS.map(b => {
          const cfg = BRAND_CONFIG[b];
          if (!cfg) return null;
          return (
            <button
              key={b}
              onClick={() => onSelect(b)}
              className="py-4 px-2 rounded-2xl font-black text-sm transition-all active:scale-95 hover:-translate-y-0.5"
              style={{
                background: `${cfg.bg}1A`,
                border:     `2px solid ${cfg.bg}55`,
                color:      'white',
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-center mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Cada combo incluye tóner Compatible + unidad de imagen
      </p>
    </div>
  );
}

// ── RescueAssistant — Zero Results ────────────────────────────────────────────

function RescueAssistant({ query, brand }: { query: string; brand: string | null }) {
  const brandLabel = brand ? (BRAND_CONFIG[brand]?.label ?? brand.toUpperCase()) : '_____';
  const waMsg = encodeURIComponent(
    `Hola, no encontré el modelo "${query.trim() || 'desconocido'}" en la web.\n` +
    `Mi impresora es marca: ${brandLabel}, usa: _____ y el modelo es: _____.\n` +
    `¿Me ayudan?`
  );
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  const guideItems = [
    { emoji: '🔍', text: <span>¿Qué <strong>marca</strong> de impresora es?</span> },
    { emoji: '💧', text: <span>¿Usa <strong>tóner o tinta</strong>?</span> },
    { emoji: '🏷️', text: <span>¿Tienes el <strong>modelo exacto</strong> (impresora o consumible)?</span> },
  ];

  return (
    <div className="py-10 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">🔎</div>
      <p className="font-bold text-base mb-2" style={{ color: 'white' }}>
        Ese modelo no está en nuestra base de datos
      </p>
      <p className="text-sm mb-8" style={{ color: '#7A8494' }}>
        Pero podemos asesorarte y ayudarte a encontrarlo...
      </p>
      <div className="space-y-2.5 mb-8 text-left">
        {guideItems.map(({ emoji, text }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-xl shrink-0">{emoji}</span>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</p>
          </div>
        ))}
      </div>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black transition-all hover:-translate-y-0.5"
        style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
      >
        <MessageCircle className="w-4 h-4" />
        Chatea con un experto
      </a>
    </div>
  );
}

// ── BundleCard ────────────────────────────────────────────────────────────────

function BundleCard({ bundle, onSelect }: { bundle: Bundle; onSelect: Props['onSelectProduct'] }) {
  const label    = COMBO_LABELS[bundle.comboType] ?? bundle.comboType;
  const dispName = cleanName(bundle.name);
  const waOrder  = encodeURIComponent(
    `Hola ToneBOX, me interesa el combo:\n*${dispName}*\nPrecio: $${bundle.price?.toFixed(0)} MXN\n¿Está disponible?`
  );
  const waCompat = encodeURIComponent(
    `Hola ToneBOX, ¿el combo "${dispName}" es compatible con mi impresora?`
  );

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}
          >
            💎 {label}
          </span>
          {bundle.freeShipping && (
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              🚚 Envío gratis
            </span>
          )}
        </div>

        {/* Nombre */}
        <p className="font-bold text-sm leading-snug" style={{ color: 'white' }}>{dispName}</p>
        {bundle.description && (
          <p className="text-xs" style={{ color: '#7A8494' }}>{bundle.description}</p>
        )}

        {/* Precios */}
        {bundle.price != null && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black" style={{ color: '#00C896' }}>
                ${bundle.price.toFixed(0)}
                <span className="text-xs font-bold ml-1" style={{ color: 'rgba(0,200,150,0.7)' }}>MXN</span>
              </span>
            </div>
            {bundle.speiPrice != null && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: '#25D366' }}>
                  ${bundle.speiPrice.toFixed(0)} MXN vía SPEI
                </span>
                <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
                  -4%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Trust badge */}
        <TrustBadge />

        {/* CTAs */}
        {bundle.price != null && (
          <div className="mt-auto pt-1 flex gap-2">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waOrder}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: '#00C896', color: '#0B0E14' }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Pedir por WhatsApp
            </a>
            <button
              onClick={() => onSelect(dispName, bundle.price!)}
              className="hidden sm:flex px-3 py-2.5 rounded-xl transition-all active:scale-95 items-center"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
              title="Apartar con tarjeta"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Visor de compatibilidad via WA */}
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${waCompat}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-center pt-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.28)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00C896')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
        >
          ¿Es compatible con mi impresora?
        </a>
      </div>
    </div>
  );
}

// ── ComparisonCard — Dark Theme ───────────────────────────────────────────────

function ComparisonCard({ pair, onSelect }: { pair: ProductPair; onSelect: Props['onSelectProduct'] }) {
  const [showCompat, setShowCompat] = useState(false);

  const { compatible, original } = pair;
  const main         = compatible ?? original!;
  const compPrice    = compatible?.publicPrice ?? null;
  const compSpei     = compatible?.speiPrice ?? null;
  const origPrice    = original?.publicPrice ?? null;
  const savings      = compPrice && origPrice && origPrice > compPrice
    ? Math.round(origPrice - compPrice) : null;
  const displayPrice = compPrice ?? origPrice;
  const dispName     = cleanName(main.name.length > 48 ? main.name.slice(0, 45) + '…' : main.name);
  const bestSeller   = isBestSeller(main);

  const waMsg  = encodeURIComponent(`Hola, quiero apartar:\n*${main.name}*\nPrecio: $${displayPrice?.toFixed(0)} MXN\n¿Está disponible?`);
  const waUrl  = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Imagen */}
      {main.image && (
        <div
          className="relative h-28 sm:h-32 flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main.image}
            alt={dispName}
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain p-3"
          />
          {bestSeller && (
            <span className="absolute top-2 left-2 text-white text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: '#FF5C28' }}>
              🔥 Top ventas
            </span>
          )}
          {savings !== null && savings > 50 && (
            <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: '#00C896', color: '#0B0E14' }}>
              💰 -{savings} MXN
            </span>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">
        {/* Badges sin imagen */}
        {!main.image && (
          <div className="flex items-start gap-2 flex-wrap">
            {bestSeller && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,40,0.15)', color: '#FF5C28' }}>
                🔥 Top ventas
              </span>
            )}
            {savings !== null && savings > 50 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>
                💰 Ahorras ${savings} MXN
              </span>
            )}
          </div>
        )}

        {/* Nombre */}
        <p className="font-bold text-sm leading-snug" style={{ color: 'white' }}>{dispName}</p>

        {/* Subtítulo */}
        <p className="hidden sm:block text-xs" style={{ color: '#7A8494' }}>
          {main.brand} · {main.category}
        </p>

        {/* Rendimiento */}
        {main.yield != null && (
          <p className="text-xs font-semibold" style={{ color: '#7A8494' }}>
            📄 Rendimiento: {main.yield.toLocaleString()} págs
          </p>
        )}

        {/* Precios */}
        <div className="space-y-0.5">
          {compPrice != null && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xl font-black" style={{ color: '#00C896' }}>
                ${compPrice.toFixed(0)}
                <span className="text-xs font-bold ml-1" style={{ color: 'rgba(0,200,150,0.7)' }}>MXN</span>
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>
                COMPATIBLE
              </span>
            </div>
          )}
          {compSpei != null && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold" style={{ color: '#25D366' }}>
                ${compSpei.toFixed(0)} MXN vía SPEI
              </span>
              <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
                -4%
              </span>
            </div>
          )}
          {origPrice != null && (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-semibold ${compPrice ? 'line-through' : 'text-base font-black'}`}
                style={{ color: compPrice ? '#7A8494' : 'white' }}
              >
                ${origPrice.toFixed(0)} MXN
              </span>
              {!compPrice && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(26,107,255,0.15)', color: '#1A6BFF' }}>
                  ORIGINAL
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mensaje ahorro */}
        {savings !== null && savings > 50 && (
          <p
            className="hidden sm:block text-xs font-bold rounded-xl px-3 py-2"
            style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}
          >
            💚 Ahorras ${savings} MXN vs el original de fábrica
          </p>
        )}

        {/* Trust badge */}
        <TrustBadge />

        {/* CTAs */}
        {displayPrice != null && (
          <div className="mt-auto pt-1 flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: '#00C896', color: '#0B0E14' }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Pedir por WhatsApp
            </a>
            <button
              onClick={() => onSelect(main.name, displayPrice)}
              className="hidden sm:flex px-3 py-2.5 rounded-xl transition-all active:scale-95 items-center"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
              title="Apartar con tarjeta"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Visor de compatibilidad expandible */}
        {main.compatibility.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '2px' }}>
            <button
              onClick={() => setShowCompat(p => !p)}
              className="flex items-center gap-1 text-xs font-semibold w-full transition-colors"
              style={{ color: showCompat ? '#00C896' : 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showCompat
                ? <ChevronUp   className="w-3 h-3 shrink-0" />
                : <ChevronDown className="w-3 h-3 shrink-0" />}
              {showCompat ? 'Ocultar modelos compatibles' : '¿Compatible con mi impresora?'}
            </button>
            {showCompat && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {main.compatibility.map((m, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductComparatorSection({ onSelectProduct }: Props) {
  const [brands, setBrands]                 = useState<string[]>([]);
  const [activeBrand, setActiveBrand]       = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [bundleBrand, setBundleBrand]       = useState<string | null>(null);
  const [query, setQuery]                   = useState('');
  const [products, setProducts]             = useState<Product[]>([]);
  const [bundles, setBundles]               = useState<Bundle[]>([]);
  const [loading, setLoading]               = useState(false);
  const [searched, setSearched]             = useState(false);
  const [showAll, setShowAll]               = useState(false);
  const [showAllBundles, setShowAllBundles] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryRef       = useRef(query);
  useEffect(() => { queryRef.current = query; });
  const didMount = useRef(false);

  // ── Fetch brands on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/products/brands')
      .then(r => r.json())
      .then(data => {
        const names = (data.brands ?? []).map((b: { name: string }) => b.name.toLowerCase());
        setBrands(BRAND_ORDER.filter(b => names.includes(b)));
      })
      .catch(() => setBrands(BRAND_ORDER));
  }, []);

  // ── Product search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (brand: string | null, q: string, cat: string | null) => {
    if (!brand && !q.trim() && !cat) {
      setProducts([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    setShowAll(false);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (brand)    params.set('brand', brand);
      if (cat)      params.set('category', cat);
      const res  = await fetch(`/api/products/search?${params}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bundle fetch (by brand) ─────────────────────────────────────────────
  const fetchBundles = useCallback(async (brand: string) => {
    setLoading(true);
    setShowAllBundles(false);
    setProducts([]);
    try {
      const res  = await fetch(`/api/products/bundles?brand=${encodeURIComponent(brand)}`);
      const data = await res.json();
      setBundles(data.items ?? []);
    } catch {
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Reactive search — brand/category changes (excludes bundles mode) ────
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (activeCategory === 'bundles') return;
    doSearch(activeBrand, queryRef.current, activeCategory);
  }, [activeBrand, activeCategory, doSearch]);

  // ── Handlers ────────────────────────────────────────────────────────────
  function exitBundleMode() {
    setBundles([]);
    setBundleBrand(null);
  }

  function handleBrand(brand: string) {
    if (activeCategory === 'bundles') { setActiveCategory(null); exitBundleMode(); }
    setActiveBrand(prev => prev === brand ? null : brand);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cat = activeCategory === 'bundles' ? null : activeCategory;
    if (activeCategory === 'bundles') { setActiveCategory(null); exitBundleMode(); }
    doSearch(activeBrand, query, cat);
  }

  function handleQuickAccess(id: string) {
    if (id === 'search') {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (id === 'bundles') {
      if (activeCategory === 'bundles') {
        setActiveCategory(null);
        exitBundleMode();
      } else {
        setActiveBrand(null);
        setActiveCategory('bundles');
        exitBundleMode(); // show brand picker first
      }
      return;
    }
    // Regular category (Toner, Drum, etc.) — exit bundles if active
    exitBundleMode();
    setActiveCategory(prev => (prev === 'bundles' ? id : prev === id ? null : id));
  }

  function handleBundleBrand(brand: string) {
    if (bundleBrand === brand) {
      setBundleBrand(null);
      setBundles([]);
    } else {
      setBundleBrand(brand);
      fetchBundles(brand);
    }
  }

  // ── Data computation ────────────────────────────────────────────────────
  // Deduplicación: filtra productos con SKU normalizado repetido
  const seen = new Set<string>();
  const cleanProducts = products
    .filter(p => !NOISE_CATEGORIES.has(p.category ?? ''))
    .filter(p => {
      const key = p.sku.toLowerCase().replace(/-/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const pairs        = pairProducts(cleanProducts);
  const withSavings  = pairs.filter(p =>
    p.compatible && p.original && (p.original.publicPrice ?? 0) > (p.compatible.publicPrice ?? 0)
  );
  const sortedPairs  = [...withSavings, ...pairs.filter(p => !withSavings.includes(p))];
  const visiblePairs = showAll ? sortedPairs : sortedPairs.slice(0, SHOWCASE_LIMIT);
  const hasMore      = sortedPairs.length > SHOWCASE_LIMIT;

  const visibleBundles   = showAllBundles ? bundles : bundles.slice(0, BUNDLE_LIMIT);
  const hasMoreBundles   = bundles.length > BUNDLE_LIMIT;
  const bundleBrandLabel = bundleBrand ? (BRAND_CONFIG[bundleBrand]?.label ?? bundleBrand.toUpperCase()) : '';

  // ── JSX ─────────────────────────────────────────────────────────────────
  return (
    <section
      id="consumibles"
      className="py-20 section-border-top relative overflow-hidden"
      style={{ background: '#0B0E14' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black mb-4"
            style={{ background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.25)', color: '#00C896' }}
          >
            <Tag className="w-3 h-3" /> Comparador de Precios en Tiempo Real
          </div>
          <h2
            className="font-syne mb-3"
            style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 800, color: 'white' }}
          >
            Busca tu consumible,<br />
            <span style={{ color: '#00C896' }}>compara Original vs Compatible</span>
          </h2>
          <p className="hidden sm:block font-medium max-w-xl mx-auto text-sm" style={{ color: '#7A8494' }}>
            Mostramos ambas opciones para que decidas: máximo ahorro con Compatible ToneBOX
            o calidad original de fábrica.
          </p>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8 max-w-sm sm:max-w-md mx-auto">
          {QUICK_ACCESS.map(qa => {
            const isActive = activeCategory === qa.id;
            return (
              <button
                key={qa.id}
                onClick={() => handleQuickAccess(qa.id)}
                className="flex flex-col items-center gap-1.5 py-3 sm:py-4 px-1 rounded-2xl transition-all active:scale-95"
                style={{
                  border:     isActive ? '2px solid #00C896' : '2px solid rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(0,200,150,0.12)' : 'rgba(255,255,255,0.04)',
                  color:      isActive ? '#00C896' : 'rgba(255,255,255,0.6)',
                  boxShadow:  isActive ? '0 0 12px rgba(0,200,150,0.3)' : undefined,
                }}
              >
                <span className="text-xl sm:text-2xl leading-none flex items-center justify-center">
                  {qa.icon}
                </span>
                <span className="text-[10px] sm:text-[11px] font-black text-center leading-tight">
                  {qa.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Brand filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {brands.map(b => {
            const cfg = BRAND_CONFIG[b];
            if (!cfg) return null;
            const isActive = activeBrand === b;
            return (
              <button
                key={b}
                onClick={() => handleBrand(b)}
                className="px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95"
                style={{
                  background: isActive ? cfg.bg : 'rgba(255,255,255,0.06)',
                  color:      isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  border:     isActive ? `2px solid ${cfg.bg}` : '1px solid rgba(255,255,255,0.1)',
                  transform:  isActive ? 'scale(1.05)' : undefined,
                  boxShadow:  isActive ? `0 0 14px ${cfg.bg}55` : undefined,
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 pointer-events-none" style={{ color: '#7A8494' }} />
            <input
              ref={searchInputRef}
              id="consumibles-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ej: toner para hp laserjet, CE285A, TN-660…"
              className="w-full pl-11 pr-28 py-3 rounded-2xl text-sm font-medium focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border:     '2px solid rgba(255,255,255,0.1)',
                color:      'white',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#00C896')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#00C896', color: '#0B0E14' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>
        </form>

        {/* ── Results tree ── */}
        {loading ? (
          // Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>

        ) : activeCategory === 'bundles' ? (
          // ── DUO PACKS MODE ──────────────────────────────────────────────
          !bundleBrand ? (
            // Paso 1: Brand picker
            <BrandPickerForBundles onSelect={handleBundleBrand} />

          ) : bundles.length === 0 ? (
            // Sin combos para esta marca
            <div className="text-center py-16">
              <Package className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="font-semibold mb-1" style={{ color: '#7A8494' }}>
                No tenemos combos de {bundleBrandLabel} por ahora
              </p>
              <button
                onClick={() => { setBundleBrand(null); setBundles([]); }}
                className="text-xs mt-2"
                style={{ color: '#00C896', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Elegir otra marca
              </button>
              <div className="mt-6">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hola ToneBOX, ¿tienen combos Duo Pack de ${bundleBrandLabel}?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all hover:-translate-y-0.5"
                  style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Preguntar por combos {bundleBrandLabel}
                </a>
              </div>
            </div>

          ) : (
            // Grilla de combos
            <>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold" style={{ color: '#7A8494' }}>
                  {bundles.length} combo{bundles.length !== 1 ? 's' : ''} {bundleBrandLabel}
                  <span className="ml-2 font-black" style={{ color: '#00C896' }}>· Envío gratis incluido</span>
                </p>
                <button
                  onClick={() => { setBundleBrand(null); setBundles([]); }}
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Cambiar marca
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {visibleBundles.map(b => (
                  <BundleCard key={b.id} bundle={b} onSelect={onSelectProduct} />
                ))}
              </div>
              {hasMoreBundles && !showAllBundles && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowAllBundles(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    Explorar otros {bundles.length - BUNDLE_LIMIT} combos de ahorro de {bundleBrandLabel}
                  </button>
                </div>
              )}
            </>
          )

        ) : !searched ? (
          // ── WELCOME STATE ────────────────────────────────────────────────
          <div className="text-center py-16">
            <Package className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="font-semibold" style={{ color: '#7A8494' }}>
              Selecciona un acceso rápido o escribe un modelo
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Ej: &quot;toner para hp laserjet&quot;, &quot;CE285A&quot;, &quot;TN-660&quot;
            </p>
          </div>

        ) : sortedPairs.length === 0 ? (
          // ── RESCUE ASSISTANT ─────────────────────────────────────────────
          <RescueAssistant query={query} brand={activeBrand} />

        ) : (
          // ── PRODUCT GRID ─────────────────────────────────────────────────
          <>
            <p className="text-xs font-semibold text-center mb-5" style={{ color: '#7A8494' }}>
              {sortedPairs.length} producto{sortedPairs.length !== 1 ? 's' : ''} encontrado{sortedPairs.length !== 1 ? 's' : ''}
              {withSavings.length > 0 && (
                <span className="ml-2 font-black" style={{ color: '#00C896' }}>
                  · {withSavings.length} con ahorro real
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {visiblePairs.map(pair => (
                <ComparisonCard key={pair.key} pair={pair} onSelect={onSelectProduct} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(p => !p)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {showAll
                    ? '▲ Ver menos'
                    : `Ver todos (${sortedPairs.length - SHOWCASE_LIMIT} productos más)`}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
