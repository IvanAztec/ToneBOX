'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Tag, Package, MessageCircle, ShoppingCart } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
// ⚠️  Cambia este número por el WhatsApp de ventas ToneBOX (cód. país + número)
const WA_NUMBER      = '528441628536';
const SHOWCASE_LIMIT = 4;

const BEST_SELLER_SKUS = [
  '85A','78A','05A','80A','55A','64A','CF280A','CF226A','CF258A',
  'CE285A','CE278A','CE505A','CF283A','CF294A',
  'TN-660','TN-630','TN-760','TN-227','TN-850',
  'TK-1175','TK-1162','TK-3182',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  priceMXN: number | null;
  productType: string;
  providerSku: string | null;
  compatibility: string[];
  image?: string | null;
  provider?: { name: string; code: string } | null;
  tier?: string;
}

interface ProductPair {
  compatible: Product | null;
  original:   Product | null;
  key:        string;
}

interface Props {
  onSelectProduct: (name: string, price: number) => void;
}

// ── Brand config ──────────────────────────────────────────────────────────────

const BRAND_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  hp:      { bg: 'bg-blue-600',   text: 'text-white', label: 'HP' },
  brother: { bg: 'bg-gray-800',   text: 'text-white', label: 'Brother' },
  canon:   { bg: 'bg-red-600',    text: 'text-white', label: 'Canon' },
  epson:   { bg: 'bg-indigo-600', text: 'text-white', label: 'Epson' },
  kyocera: { bg: 'bg-amber-500',  text: 'text-white', label: 'Kyocera' },
  samsung: { bg: 'bg-blue-900',   text: 'text-white', label: 'Samsung' },
  xerox:   { bg: 'bg-red-700',    text: 'text-white', label: 'Xerox' },
  ricoh:   { bg: 'bg-teal-600',   text: 'text-white', label: 'Ricoh' },
  lexmark: { bg: 'bg-green-700',  text: 'text-white', label: 'Lexmark' },
};
const BRAND_ORDER = ['hp','brother','canon','epson','kyocera','samsung','xerox','ricoh','lexmark'];

const NOISE_CATEGORIES = new Set(['Ribbon','Label','Paper','Consumible','Ink']);

const QUICK_ACCESS = [
  { id: 'Toner',   emoji: '🖨️', label: 'Tóners'   },
  { id: 'Drum',    emoji: '🥁', label: 'Tambores'  },
  { id: 'bundles', emoji: '💎', label: 'Duo Packs' },
  { id: 'search',  emoji: '🔍', label: 'Buscador'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── ComparisonCard ────────────────────────────────────────────────────────────

function ComparisonCard({ pair, onSelect }: { pair: ProductPair; onSelect: Props['onSelectProduct'] }) {
  const { compatible, original } = pair;
  const main         = compatible ?? original!;
  const compPrice    = compatible?.priceMXN ?? null;
  const origPrice    = original?.priceMXN ?? null;
  const savings      = compPrice && origPrice && origPrice > compPrice
    ? Math.round(origPrice - compPrice) : null;
  const displayPrice = compPrice ?? origPrice;
  const shortName    = main.name.length > 48 ? main.name.slice(0, 45) + '…' : main.name;
  const bestSeller   = isBestSeller(main);

  const waMsg = encodeURIComponent(`Hola, quiero apartar:\n*${main.name}*\nPrecio: $${displayPrice?.toFixed(0)} MXN\n¿Está disponible?`);
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all flex flex-col overflow-hidden">

      {/* Imagen del producto (lazy load nativo) */}
      {main.image && (
        <div className="relative h-28 sm:h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main.image}
            alt={shortName}
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain p-3"
          />
          {bestSeller && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              🔥 Top ventas
            </span>
          )}
          {savings !== null && savings > 50 && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              💰 -{savings} MXN
            </span>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">
        {/* Header — sin imagen: badges inline */}
        {!main.image && (
          <div className="flex items-start gap-2 flex-wrap">
            {bestSeller && (
              <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                🔥 Top ventas
              </span>
            )}
            {savings !== null && savings > 50 && (
              <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                💰 Ahorras ${savings} MXN
              </span>
            )}
          </div>
        )}

        {/* Nombre */}
        <p className="font-bold text-sm text-gray-900 leading-snug">{shortName}</p>

        {/* Subtítulo — oculto en móvil */}
        <p className="hidden sm:block text-xs text-gray-400">{main.brand} · {main.category}</p>

        {/* Precios */}
        <div className="space-y-0.5">
          {compPrice != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-green-600">
                ${compPrice.toFixed(0)}
                <span className="text-xs font-bold text-green-500 ml-1">MXN</span>
              </span>
              <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                COMPATIBLE
              </span>
            </div>
          )}
          {origPrice != null && (
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${compPrice ? 'line-through text-gray-400' : 'text-gray-800 text-base font-black'}`}>
                ${origPrice.toFixed(0)} MXN
              </span>
              {!compPrice && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">ORIGINAL</span>
              )}
            </div>
          )}
        </div>

        {/* Mensaje ahorro — oculto en móvil */}
        {savings !== null && savings > 50 && (
          <p className="hidden sm:block text-xs font-bold text-green-700 bg-green-50 rounded-xl px-3 py-2">
            💚 Ahorras ${savings} MXN vs el original de fábrica
          </p>
        )}

        {/* CTAs */}
        {displayPrice != null && (
          <div className="mt-auto pt-1 flex gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-600 transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Pedir por WhatsApp
            </a>
            {/* Apartar con tarjeta — oculto en móvil */}
            <button
              onClick={() => onSelect(main.name, displayPrice)}
              className="hidden sm:flex px-3 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all active:scale-95 items-center"
              title="Apartar con tarjeta"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
      <div className="h-28 bg-gray-100 rounded-xl" />
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-7 bg-gray-100 rounded w-1/3" />
      <div className="h-10 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductComparatorSection({ onSelectProduct }: Props) {
  const [brands, setBrands]               = useState<string[]>([]);
  const [activeBrand, setActiveBrand]     = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery]                 = useState('');
  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(false);
  const [showAll, setShowAll]             = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/products/brands')
      .then(r => r.json())
      .then(data => {
        const names = (data.brands ?? []).map((b: { name: string }) => b.name.toLowerCase());
        setBrands(BRAND_ORDER.filter(b => names.includes(b)));
      })
      .catch(() => setBrands(BRAND_ORDER));
  }, []);

  const doSearch = useCallback(async (brand: string | null, q: string, cat: string | null) => {
    if (!brand && !q.trim() && !cat) return;
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

  function handleBrand(brand: string) {
    const next = activeBrand === brand ? null : brand;
    setActiveBrand(next);
    doSearch(next, query, activeCategory);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(activeBrand, query, activeCategory);
  }

  function handleQuickAccess(id: string) {
    if (id === 'search') {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (id === 'bundles') {
      document.getElementById('bundles-widget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const next = activeCategory === id ? null : id;
    setActiveCategory(next);
    doSearch(activeBrand, query, next);
  }

  const cleanProducts = products.filter(p => !NOISE_CATEGORIES.has(p.category ?? ''));
  const pairs         = pairProducts(cleanProducts);
  const withSavings   = pairs.filter(p =>
    p.compatible && p.original &&
    (p.original.priceMXN ?? 0) > (p.compatible.priceMXN ?? 0)
  );
  const withoutPairs = pairs.filter(p => !withSavings.includes(p));
  const sortedPairs  = [...withSavings, ...withoutPairs];
  const visiblePairs = showAll ? sortedPairs : sortedPairs.slice(0, SHOWCASE_LIMIT);
  const hasMore      = sortedPairs.length > SHOWCASE_LIMIT;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-200/80 text-green-700 text-xs font-black mb-4">
            <Tag className="w-3 h-3" /> Comparador de Precios en Tiempo Real
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Busca tu consumible,<br />
            <span className="text-green-600">compara Original vs Compatible</span>
          </h2>
          <p className="hidden sm:block text-gray-500 font-medium max-w-xl mx-auto text-sm">
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
                className={`flex flex-col items-center gap-1.5 py-3 sm:py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${
                  isActive
                    ? 'border-green-400 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <span className="text-xl sm:text-2xl leading-none">{qa.emoji}</span>
                <span className="text-[10px] sm:text-[11px] font-black text-gray-700 text-center leading-tight">{qa.label}</span>
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
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95 border-2 ${
                  isActive
                    ? `${cfg.bg} ${cfg.text} border-transparent shadow-lg scale-105`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ej: toner para hp laserjet, CE285A, TN-660…"
              className="w-full pl-11 pr-28 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-green-400 transition-colors bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !searched ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">Selecciona un acceso rápido o escribe un modelo</p>
            <p className="text-xs text-gray-300 mt-1">Ej: "toner para hp laserjet", "CE285A", "TN-660"</p>
          </div>
        ) : sortedPairs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">Sin resultados para esa búsqueda</p>
            <p className="text-xs text-gray-300 mt-1">Intenta con el número de parte o el modelo de impresora.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 font-semibold text-center mb-5">
              {sortedPairs.length} producto{sortedPairs.length !== 1 ? 's' : ''} encontrado{sortedPairs.length !== 1 ? 's' : ''}
              {withSavings.length > 0 && (
                <span className="text-green-600 ml-2 font-black">
                  · {withSavings.length} con ahorro real
                </span>
              )}
            </p>

            {/* Grid: 1 col mobile, 2 col desktop — máx impacto visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {visiblePairs.map(pair => (
                <ComparisonCard key={pair.key} pair={pair} onSelect={onSelectProduct} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(p => !p)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 hover:border-green-400 hover:text-green-600 transition-all"
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
