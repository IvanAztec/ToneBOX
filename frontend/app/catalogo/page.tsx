'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search, MessageCircle, Package, Printer, X,
  Loader2, Tag, Menu, ChevronRight,
} from 'lucide-react';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';
import Footer from '@/components/shared/Footer';

// ── Design tokens (same as landing) ──────────────────────────────────────────
const INK    = '#0B0E14';
const INK2   = '#161B26';
const GREEN  = '#00C896';
const MUTED  = '#7A8494';
const BORDER = 'rgba(255,255,255,0.08)';
const CARD   = 'rgba(255,255,255,0.04)';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; sku: string; name: string; brand: string | null;
  category: string | null; publicPrice: number | null; speiPrice: number | null;
  productType: string | null; compatibility: string | null;
  image: string | null; availabilityStatus: string; yield: number | null;
}

// ── Categorías ────────────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  Toner: 'Tóners', Cartucho: 'Tintas', Drum: 'Tintas',
  Ribbon: 'Rollos TPV', Label: 'Rollos TPV', Paper: 'Rollos TPV',
};
const UI_CATS = ['Todos', 'Tóners', 'Tintas', 'Rollos TPV', 'Accesorios'] as const;
type UICat = typeof UI_CATS[number];

function mapToUI(cat: string | null): UICat {
  if (!cat) return 'Accesorios';
  return (CATEGORY_MAP[cat] as UICat) ?? 'Accesorios';
}

const CAT_ICONS: Record<UICat, React.ReactNode> = {
  'Todos':      <Package className="w-3.5 h-3.5" />,
  'Tóners':     <Printer className="w-3.5 h-3.5" />,
  'Tintas':     <Tag className="w-3.5 h-3.5" />,
  'Rollos TPV': <Package className="w-3.5 h-3.5" />,
  'Accesorios': <Package className="w-3.5 h-3.5" />,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Tarjeta de producto — dark theme ─────────────────────────────────────────
function ProductCard({ p }: { p: Product }) {
  const msg = encodeURIComponent(
    `Hola Iván, me interesa el producto ${p.name} (${p.sku}) del catálogo ToneBOX. ¿Podrías darme precio y disponibilidad?`
  );
  const waUrl = `https://wa.me/528441628536?text=${msg}`;

  const isStock   = p.availabilityStatus === 'IN_STOCK';
  const isDemand  = p.availabilityStatus === 'ON_DEMAND';

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.25)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = BORDER}
    >
      {/* Imagen */}
      <div
        className="aspect-square flex items-center justify-center overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Package className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <span className="font-mono text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{p.sku}</span>
          </div>
        )}

        {/* Badge disponibilidad */}
        <div className="absolute top-2.5 left-2.5">
          {isStock && (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: 'rgba(0,200,150,0.15)', color: GREEN, border: '1px solid rgba(0,200,150,0.25)' }}
            >
              En stock
            </span>
          )}
          {isDemand && (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: 'rgba(255,180,0,0.12)', color: '#FFB400', border: '1px solid rgba(255,180,0,0.2)' }}
            >
              Por encargo
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1 space-y-1">
          {p.brand && (
            <p className="font-mono text-[9px] tracking-[2px] uppercase font-black" style={{ color: MUTED }}>
              {p.brand}
            </p>
          )}
          <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {p.name}
          </p>
          {p.compatibility && (
            <p className="text-[11px] flex items-center gap-1 line-clamp-1 mt-1" style={{ color: MUTED }}>
              <Printer className="w-3 h-3 flex-shrink-0" />
              {p.compatibility}
            </p>
          )}
          {p.yield && (
            <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              ~{p.yield.toLocaleString()} pág
            </p>
          )}
        </div>

        {/* Precio */}
        {p.publicPrice && (
          <div>
            <p className="text-xl font-black" style={{ color: 'white' }}>
              ${fmt(p.publicPrice)}
            </p>
            {p.speiPrice && p.speiPrice < p.publicPrice && (
              <p className="text-[11px] font-semibold" style={{ color: GREEN }}>
                ${fmt(p.speiPrice)} con SPEI
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all"
          style={{
            background: 'rgba(37,211,102,0.1)',
            color: '#25D366',
            border: '1px solid rgba(37,211,102,0.2)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.18)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.1)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.2)';
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Solicitar
        </a>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState<UICat>('Todos');
  const [scrolled, setScrolled]           = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const searchRef                         = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const filtered = useMemo(() => {
    let list = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');
    if (activeCategory !== 'Todos') list = list.filter(p => mapToUI(p.category) === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        (p.compatibility ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const counts = useMemo(() => {
    const all = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');
    return Object.fromEntries(
      UI_CATS.map(cat => [cat, cat === 'Todos' ? all.length : all.filter(p => mapToUI(p.category) === cat).length])
    ) as Record<UICat, number>;
  }, [products]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: INK, color: 'white' }}>

      {/* ── Nav ── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: scrolled ? '10px 0' : '16px 0',
          background: 'rgba(11,14,20,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BORDER}`,
          transition: 'padding 0.3s',
        }}
      >
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">

          <Link href="/" className="flex-shrink-0">
            <span className="block sm:hidden"><ToneBoxLogo size="sm" /></span>
            <span className="hidden sm:block"><ToneBoxLogo showTagline /></span>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            <Link
              href="/"
              className="transition-colors"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)'}
            >
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span className="font-semibold" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Catálogo</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://wa.me/528441628536"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', padding: '8px 14px', fontSize: 12, fontWeight: 600 }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <button
              className="md:hidden p-2 rounded-xl"
              style={{ color: MUTED }}
              onClick={() => setMenuOpen(p => !p)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden px-5 pb-4 pt-2 space-y-2"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <Link href="/" className="block py-2 text-sm transition-colors hover:text-white" style={{ color: MUTED }}>
              ← Volver al inicio
            </Link>
            <a href="https://wa.me/528441628536" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 text-sm font-semibold" style={{ color: '#25D366' }}>
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* ── Hero strip ── */}
      <section style={{ paddingTop: 90, paddingBottom: 40, background: `linear-gradient(180deg, ${INK2} 0%, ${INK} 100%)` }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8">

          <p className="font-mono text-[10px] tracking-[3px] uppercase mb-3 font-black" style={{ color: GREEN }}>
            // Catálogo Completo
          </p>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-2">
            Consumibles para <span style={{ color: GREEN }}>tu impresora</span>
          </h1>
          <p className="text-sm sm:text-base mb-8" style={{ color: MUTED }}>
            Tóners, tintas y rollos para +300 modelos. Compatibles y originales. Envío a toda la República.
          </p>

          {/* Buscador */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Busca por modelo de impresora, SKU o marca..."
              className="w-full py-3.5 pl-11 pr-10 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${BORDER}`,
                color: 'white',
              }}
              onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = `rgba(0,200,150,0.4)`}
              onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = BORDER}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors"
                style={{ color: MUTED }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Contenido ── */}
      <section className="max-w-[1160px] mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* Filtros por categoría */}
        <div className="flex gap-2 flex-wrap">
          {UI_CATS.map(cat => {
            const isActive = activeCategory === cat;
            const count = counts[cat] ?? 0;
            if (cat !== 'Todos' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: isActive ? 'rgba(0,200,150,0.12)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? GREEN : MUTED,
                  border: `1px solid ${isActive ? 'rgba(0,200,150,0.3)' : BORDER}`,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <span style={{ color: isActive ? GREEN : MUTED }}>{CAT_ICONS[cat]}</span>
                {cat}
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? GREEN : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        {!loading && (
          <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            {search && <span> · búsqueda: "<span style={{ color: GREEN }}>{search}</span>"</span>}
            {activeCategory !== 'Todos' && <span> · {activeCategory}</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: GREEN }} />
            <p className="text-sm" style={{ color: MUTED }}>Cargando catálogo...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
            >
              <Package className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>Sin resultados</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {search ? `No encontramos "${search}"` : 'No hay productos en esta categoría'}
              </p>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-sm font-semibold transition-colors"
                style={{ color: GREEN }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}

      </section>

      {/* ── CTA strip ── */}
      {!loading && filtered.length > 0 && (
        <section
          className="py-14 mt-8"
          style={{ background: INK2, borderTop: `1px solid ${BORDER}` }}
        >
          <div className="max-w-[1160px] mx-auto px-5 sm:px-8 text-center space-y-4">
            <p className="font-mono text-[10px] tracking-[3px] uppercase font-black" style={{ color: GREEN }}>
              // ¿No encuentras tu modelo?
            </p>
            <h2 className="text-2xl sm:text-3xl font-black">
              Iván te ayuda a encontrar el tóner correcto
            </h2>
            <p className="text-sm" style={{ color: MUTED }}>
              Escríbenos el modelo de tu impresora y cotizamos en minutos
            </p>
            <a
              href="https://wa.me/528441628536?text=Hola+Iv%C3%A1n%2C+necesito+un+t%C3%B3ner+para+mi+impresora+y+no+lo+encuentro+en+el+cat%C3%A1logo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all"
              style={{ background: GREEN, color: INK }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
            >
              <MessageCircle className="w-4 h-4" />
              Cotizar por WhatsApp
            </a>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
