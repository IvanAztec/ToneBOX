'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, MessageCircle, Package, Printer, X,
  Loader2, ShoppingCart, Tag,
} from 'lucide-react';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  publicPrice: number | null;
  speiPrice: number | null;
  productType: string | null;
  compatibility: string | null;
  image: string | null;
  availabilityStatus: string;
}

// ── Mapeo de categorías DB → etiquetas UI ────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  Toner:      'Tóners',
  Cartucho:   'Tintas',
  Drum:       'Tintas',      // drums → Tintas (consumibles de inyección)
  Ribbon:     'Rollos TPV/Térmicos',
  Label:      'Rollos TPV/Térmicos',
  Paper:      'Rollos TPV/Térmicos',
};

const UI_CATEGORIES = ['Todos', 'Tóners', 'Tintas', 'Rollos TPV/Térmicos', 'Accesorios'] as const;
type UICategory = typeof UI_CATEGORIES[number];

function mapToUI(dbCategory: string | null): UICategory {
  if (!dbCategory) return 'Accesorios';
  return (CATEGORY_MAP[dbCategory] as UICategory) ?? 'Accesorios';
}

const CATEGORY_ICONS: Record<UICategory, React.ReactNode> = {
  'Todos':              <Package className="w-4 h-4" />,
  'Tóners':             <Printer className="w-4 h-4" />,
  'Tintas':             <Tag className="w-4 h-4" />,
  'Rollos TPV/Térmicos': <ShoppingCart className="w-4 h-4" />,
  'Accesorios':         <Package className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<UICategory, string> = {
  'Todos':              'bg-gray-900 text-white border-gray-900',
  'Tóners':             'bg-blue-600 text-white border-blue-600',
  'Tintas':             'bg-purple-600 text-white border-purple-600',
  'Rollos TPV/Térmicos': 'bg-amber-500 text-white border-amber-500',
  'Accesorios':         'bg-gray-600 text-white border-gray-600',
};

const CATEGORY_INACTIVE = 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50';

// ── Disponibilidad badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'IN_STOCK') {
    return <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">En stock</span>;
  }
  if (status === 'ON_DEMAND') {
    return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Por encargo</span>;
  }
  return null;
}

// ── Tarjeta de producto ───────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const waMessage = `Hola Iván, me interesa el producto ${product.name} (${product.sku}) del catálogo ToneBOX. ¿Podrías darme más información y precio?`;
  const waUrl = `https://wa.me/528441628536?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group flex flex-col">
      {/* Imagen o placeholder */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-200">
            <Package className="w-12 h-12" />
            <span className="text-xs font-mono font-bold text-gray-300">{product.sku}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={product.availabilityStatus} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex-1">
          {product.brand && (
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{product.brand}</p>
          )}
          <p className="text-sm font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">{product.name}</p>
          {product.compatibility && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 line-clamp-1">
              <Printer className="w-3 h-3 flex-shrink-0" />
              {product.compatibility}
            </p>
          )}
        </div>

        {/* Precio */}
        {product.publicPrice && (
          <div className="space-y-0.5">
            <p className="text-lg font-black text-gray-900">
              ${product.publicPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            {product.speiPrice && product.speiPrice < product.publicPrice && (
              <p className="text-xs text-green-600 font-semibold">
                ${product.speiPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} con SPEI
              </p>
            )}
          </div>
        )}

        {/* CTA WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black py-2.5 rounded-xl transition-all mt-auto"
        >
          <MessageCircle className="w-4 h-4" />
          Solicitar por WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState<UICategory>('Todos');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=200');
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Filtrado combinado: categoría + búsqueda
  const filtered = useMemo(() => {
    let list = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');

    if (activeCategory !== 'Todos') {
      list = list.filter(p => mapToUI(p.category) === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        (p.compatibility ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, activeCategory, search]);

  // Conteo por categoría
  const counts = useMemo(() => {
    const all = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');
    const c: Partial<Record<UICategory, number>> = {};
    UI_CATEGORIES.forEach(cat => {
      c[cat] = cat === 'Todos' ? all.length : all.filter(p => mapToUI(p.category) === cat).length;
    });
    return c;
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <ToneBoxLogo size="sm" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">Catálogo de Consumibles</h1>
            <p className="text-xs text-gray-400">Tóners · Tintas · Rollos · Accesorios</p>
          </div>
          <a
            href="https://wa.me/528441628536?text=Hola+Iv%C3%A1n%2C+quiero+ver+el+cat%C3%A1logo+completo+de+ToneBOX"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Buscador */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Busca por modelo de impresora, SKU o tipo de tóner..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros por categoría */}
        <div className="flex gap-2 flex-wrap">
          {UI_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const count = counts[cat] ?? 0;
            if (cat !== 'Todos' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all ${isActive ? CATEGORY_COLORS[cat] : CATEGORY_INACTIVE}`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">Sin resultados</p>
            <p className="text-sm text-gray-300 mt-1">
              {search ? `No encontramos "${search}"` : 'No hay productos en esta categoría'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm text-blue-500 hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 font-medium">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              {search && ` para "${search}"`}
              {activeCategory !== 'Todos' && ` en ${activeCategory}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}

      </main>

      {/* Footer simple */}
      <footer className="mt-16 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <ToneBoxLogo size="sm" />
          <p className="text-xs text-gray-400">Tóners y consumibles compatibles y originales · Envío a todo México</p>
          <a
            href="https://wa.me/528441628536"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 font-bold text-sm hover:text-green-700"
          >
            <MessageCircle className="w-4 h-4" />
            52 844 162 8536
          </a>
        </div>
      </footer>

    </div>
  );
}
