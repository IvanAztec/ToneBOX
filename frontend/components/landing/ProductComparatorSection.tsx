'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Tag, ShoppingCart, TrendingDown, Package } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

// ── Marcas conocidas con colores ──────────────────────────────────────────────

const BRAND_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  hp:       { bg: 'bg-blue-600',   text: 'text-white', label: 'HP' },
  brother:  { bg: 'bg-gray-800',   text: 'text-white', label: 'Brother' },
  canon:    { bg: 'bg-red-600',    text: 'text-white', label: 'Canon' },
  epson:    { bg: 'bg-indigo-600', text: 'text-white', label: 'Epson' },
  kyocera:  { bg: 'bg-amber-500',  text: 'text-white', label: 'Kyocera' },
  samsung:  { bg: 'bg-blue-900',   text: 'text-white', label: 'Samsung' },
  xerox:    { bg: 'bg-red-700',    text: 'text-white', label: 'Xerox' },
  ricoh:    { bg: 'bg-teal-600',   text: 'text-white', label: 'Ricoh' },
  lexmark:  { bg: 'bg-green-700',  text: 'text-white', label: 'Lexmark' },
};

const BRAND_ORDER = ['hp','brother','canon','epson','kyocera','samsung','xerox','ricoh','lexmark'];

// ── Agrupa productos en pares Compatible + Original ───────────────────────────
// Compatible.compatibility[] contiene el OEM sku del Original
function pairProducts(products: Product[]): ProductPair[] {
  const compatibles = products.filter(p => p.productType === 'COMPATIBLE');
  const originals   = products.filter(p => p.productType === 'ORIGINAL');

  const usedOrigIds = new Set<string>();
  const pairs: ProductPair[] = [];

  for (const comp of compatibles) {
    const matchOrig = originals.find(orig =>
      !usedOrigIds.has(orig.id) &&
      comp.compatibility?.some(c => c === orig.sku || c === orig.providerSku)
    );
    if (matchOrig) usedOrigIds.add(matchOrig.id);
    pairs.push({ compatible: comp, original: matchOrig ?? null, key: comp.id });
  }

  // Originales sin par
  for (const orig of originals) {
    if (!usedOrigIds.has(orig.id)) {
      pairs.push({ compatible: null, original: orig, key: orig.id });
    }
  }

  return pairs;
}

// ── Tarjeta de comparación ────────────────────────────────────────────────────

function ComparisonCard({ pair, onSelect }: { pair: ProductPair; onSelect: Props['onSelectProduct'] }) {
  const { compatible, original } = pair;
  const main = compatible ?? original!;

  const compPrice = compatible?.priceMXN ?? null;
  const origPrice = original?.priceMXN ?? null;

  const savings = compPrice && origPrice && origPrice > compPrice
    ? Math.round((1 - compPrice / origPrice) * 100)
    : null;

  const displayPrice = compPrice ?? origPrice;
  const displayName  = main.name.length > 55 ? main.name.slice(0, 52) + '…' : main.name;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 leading-snug">{displayName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {main.brand} · {main.category}
          </p>
        </div>
        {savings !== null && savings > 3 && (
          <span className="shrink-0 flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full">
            <TrendingDown className="w-3 h-3" /> -{savings}%
          </span>
        )}
      </div>

      {/* Precios */}
      <div className="space-y-1">
        {compPrice != null && (
          <div className="flex items-center gap-2">
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
            <span className={`text-sm font-semibold ${compPrice ? 'line-through text-gray-350' : 'text-gray-800 text-base font-black'}`}>
              ${origPrice.toFixed(0)} MXN
            </span>
            {!compPrice && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                ORIGINAL
              </span>
            )}
            {compPrice && (
              <span className="text-[10px] text-gray-400">precio original</span>
            )}
          </div>
        )}
      </div>

      {/* Mensaje de ahorro */}
      {savings !== null && savings > 3 && (
        <p className="text-xs font-bold text-green-700 bg-green-50 rounded-xl px-3 py-2">
          💚 Ahorra un {savings}% con el Compatible ToneBOX
        </p>
      )}

      {/* Proveedores */}
      <div className="flex flex-wrap gap-1">
        {compatible && (
          <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
            {compatible.provider?.code ?? 'COMPATIBLE'}
          </span>
        )}
        {original && (
          <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
            {original.provider?.code ?? 'ORIGINAL'}
          </span>
        )}
      </div>

      {/* CTA */}
      {displayPrice != null && (
        <button
          onClick={() => onSelect(main.name, displayPrice)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-600 transition-all active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Cotizar — ${displayPrice.toFixed(0)} MXN
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-7 bg-gray-100 rounded w-1/3" />
      <div className="h-8 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProductComparatorSection({ onSelectProduct }: Props) {
  const [brands, setBrands]           = useState<string[]>([]);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [query, setQuery]             = useState('');
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);

  // Cargar marcas disponibles
  useEffect(() => {
    fetch('/api/products/brands')
      .then(r => r.json())
      .then(data => {
        const names = (data.brands ?? []).map((b: { name: string }) => b.name.toLowerCase());
        // Mostrar solo marcas conocidas que tenemos en stock, en el orden preferido
        const filtered = BRAND_ORDER.filter(b => names.includes(b));
        setBrands(filtered);
      })
      .catch(() => setBrands(BRAND_ORDER));
  }, []);

  const doSearch = useCallback(async (brand: string | null, q: string) => {
    if (!brand && !q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (brand)    params.set('brand', brand);
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
    doSearch(next, query);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(activeBrand, query);
  }

  const pairs = pairProducts(products);
  const withSavings  = pairs.filter(p => p.compatible && p.original && p.original.priceMXN && p.compatible.priceMXN && p.original.priceMXN > p.compatible.priceMXN);
  const withoutPairs = pairs.filter(p => !withSavings.includes(p));
  const sortedPairs  = [...withSavings, ...withoutPairs];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-200/80 text-green-700 text-xs font-black mb-4">
            <Tag className="w-3 h-3" /> Comparador de Precios en Tiempo Real
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Busca tu consumible,<br />
            <span className="text-green-600">compara Original vs Compatible</span>
          </h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto text-sm">
            Mostramos ambas opciones para que decidas: máximo ahorro con Compatible ToneBOX
            o calidad original de fábrica.
          </p>
        </div>

        {/* Filtros de marca */}
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

        {/* Búsqueda por texto */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Busca por modelo (CE285A, TN-660, TK-1175…)"
              className="w-full pl-11 pr-32 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-green-400 transition-colors bg-white"
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

        {/* Resultados */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : !searched ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">Selecciona una marca o escribe un modelo</p>
            <p className="text-xs text-gray-300 mt-1">
              Ej: "HP", "CE285A", "TN-660", "TK-1175"
            </p>
          </div>
        ) : sortedPairs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">Sin resultados para esa búsqueda</p>
            <p className="text-xs text-gray-300 mt-1">
              Intenta con el número de parte o el modelo de impresora.
            </p>
          </div>
        ) : (
          <>
            {/* Contador */}
            <p className="text-xs text-gray-400 font-semibold text-center mb-4">
              {sortedPairs.length} producto{sortedPairs.length !== 1 ? 's' : ''} encontrado{sortedPairs.length !== 1 ? 's' : ''}
              {withSavings.length > 0 && (
                <span className="text-green-600 ml-2 font-black">
                  · {withSavings.length} con comparativa de ahorro
                </span>
              )}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedPairs.map(pair => (
                <ComparisonCard
                  key={pair.key}
                  pair={pair}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
