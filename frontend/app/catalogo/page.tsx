'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search, MessageCircle, Package, Printer, X,
  Loader2, Tag, Menu, ChevronRight, Plus, Minus,
  ShoppingCart, Trash2, Droplets, Layers, ScrollText, LayoutGrid,
} from 'lucide-react';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';
import Footer from '@/components/shared/Footer';

// ── Design tokens ─────────────────────────────────────────────────────────────
const INK    = '#0B0E14';
const INK2   = '#161B26';
const GREEN  = '#00C896';
const MUTED  = '#7A8494';
const BORDER = 'rgba(255,255,255,0.08)';
const CARD   = 'rgba(255,255,255,0.04)';
const AMBER  = '#FFB400';
const WA     = '#25D366';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; sku: string; name: string; brand: string | null;
  category: string | null; publicPrice: number | null; speiPrice: number | null;
  productType: string | null; compatibility: string[] | string | null;
  image: string | null; availabilityStatus: string; yield: number | null;
}
interface CartItem { product: Product; qty: number; }

// ── Categorías oficiales ──────────────────────────────────────────────────────
const CAT_MAP: Record<string, string> = {
  Toner: 'Tóners', Tóner: 'Tóners',
  Ink: 'Tintas', Cartucho: 'Tintas',
  Drum: 'Tambores',
  Ribbon: 'Cintas',
  Roll: 'Rollos TPV', Label: 'Rollos TPV', Paper: 'Rollos TPV', Thermal: 'Rollos TPV',
};
const UI_CATS = ['Todos', 'Tóners', 'Tintas', 'Tambores', 'Rollos TPV', 'Cintas', 'Refacciones'] as const;
type UICat = typeof UI_CATS[number];

const CAT_LABELS: Record<UICat, string> = {
  Todos: 'Todos', Tóners: 'Tóners', Tintas: 'Tintas',
  Tambores: 'Tambores / Imagen', 'Rollos TPV': 'Rollos TPV / Térmicos',
  Cintas: 'Cintas', Refacciones: 'Refacciones',
};
const CAT_ICONS: Record<UICat, React.ReactNode> = {
  Todos:       <LayoutGrid className="w-3.5 h-3.5" />,
  Tóners:      <Printer   className="w-3.5 h-3.5" />,
  Tintas:      <Droplets  className="w-3.5 h-3.5" />,
  Tambores:    <Layers    className="w-3.5 h-3.5" />,
  'Rollos TPV':<ScrollText className="w-3.5 h-3.5" />,
  Cintas:      <Tag       className="w-3.5 h-3.5" />,
  Refacciones: <Package   className="w-3.5 h-3.5" />,
};

function mapUI(cat: string | null): UICat {
  if (!cat) return 'Refacciones';
  return (CAT_MAP[cat] as UICat) ?? 'Refacciones';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function getCompat(p: Product): string[] {
  if (!p.compatibility) return [];
  if (Array.isArray(p.compatibility)) return p.compatibility;
  return [p.compatibility];
}

// ── ToneBox Placeholder (sin ícono roto) ──────────────────────────────────────
function TBPlaceholder({ brand }: { brand?: string | null }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ background: 'rgba(0,200,150,0.03)' }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <rect width="44" height="44" rx="11" fill="rgba(0,200,150,0.07)" />
        <rect x="1" y="1" width="42" height="42" rx="10.5" stroke="rgba(0,200,150,0.18)" strokeWidth="1" />
        <text x="22" y="28" textAnchor="middle" fill="#00C896" fontSize="15"
          fontWeight="900" fontFamily="ui-monospace,monospace">TB</text>
      </svg>
      {brand && (
        <span className="font-mono text-[9px] font-black uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.18)' }}>{brand}</span>
      )}
    </div>
  );
}

// ── Availability Badge ────────────────────────────────────────────────────────
function AvailBadge({ status }: { status: string }) {
  if (status === 'IN_STOCK') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(0,200,150,0.1)', color: GREEN, border: '1px solid rgba(0,200,150,0.22)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
      Stock Inmediato
    </span>
  );
  if (status === 'ON_DEMAND') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(255,180,0,0.09)', color: AMBER, border: '1px solid rgba(255,180,0,0.2)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: AMBER }} />
      Bajo Pedido
    </span>
  );
  return null;
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ p, cartQty, onAdd, onRemove }: {
  p: Product; cartQty: number;
  onAdd: () => void; onRemove: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const inCart = cartQty > 0;
  const compat = getCompat(p);

  const waMsg = encodeURIComponent(
    `Hola Iván, me interesa el producto ${p.name}, ¿podrías confirmarme existencias y tiempo estimado de entrega?`
  );

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: CARD,
        border: `1px solid ${inCart ? 'rgba(0,200,150,0.35)' : BORDER}`,
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => { if (!inCart) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,150,0.2)'; }}
      onMouseLeave={e => { if (!inCart) (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; }}
    >
      {/* Imagen — badge NO se encima */}
      <div className="aspect-square overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.025)' }}>
        {p.image && imgOk ? (
          <img
            src={p.image} alt={p.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgOk(false)}
          />
        ) : (
          <TBPlaceholder brand={p.brand} />
        )}
        {/* Cart qty pill */}
        {inCart && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: GREEN, color: INK }}>
            {cartQty}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">

        {/* Badge + Brand */}
        <div className="flex items-center justify-between gap-1 min-h-[20px]">
          <AvailBadge status={p.availabilityStatus} />
          {p.brand && (
            <span className="font-mono text-[8px] tracking-[2px] uppercase font-black flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.22)' }}>{p.brand}</span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {p.name}
        </p>

        {/* Specs técnicas */}
        <div className="flex flex-wrap gap-1">
          {p.yield && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              ~{p.yield.toLocaleString()} págs
            </span>
          )}
          {p.productType && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
              {p.productType === 'COMPATIBLE' ? 'Compatible' : p.productType === 'ORIGINAL' ? 'Original' : p.productType}
            </span>
          )}
        </div>

        {/* Compatibilidad */}
        {compat.length > 0 && (
          <p className="text-[10px] flex items-center gap-1 line-clamp-1" style={{ color: MUTED }}>
            <Printer className="w-3 h-3 flex-shrink-0" />
            {compat.slice(0, 2).join(', ')}
            {compat.length > 2 && <span style={{ color: 'rgba(255,255,255,0.2)' }}> +{compat.length - 2}</span>}
          </p>
        )}

        <div className="flex-1" />

        {/* Precio */}
        {p.publicPrice && (
          <div>
            <p className="text-xl font-black" style={{ color: 'white' }}>${fmt(p.publicPrice)}</p>
            {p.speiPrice && p.speiPrice < p.publicPrice && (
              <p className="text-[11px] font-semibold" style={{ color: GREEN }}>
                ${fmt(p.speiPrice)} con SPEI
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        {inCart ? (
          <div className="flex items-center gap-2">
            {/* Qty control */}
            <div className="flex items-center rounded-xl overflow-hidden flex-1"
              style={{ border: '1px solid rgba(0,200,150,0.3)' }}>
              <button onClick={onRemove}
                className="px-3 py-2.5 flex-shrink-0 transition-colors hover:bg-white/5"
                style={{ color: GREEN }}>
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center text-sm font-black" style={{ color: 'white' }}>{cartQty}</span>
              <button onClick={onAdd}
                className="px-3 py-2.5 flex-shrink-0 transition-colors hover:bg-white/5"
                style={{ color: GREEN }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* WA directo */}
            <a href={`https://wa.me/528441628536?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
              title="Consultar disponibilidad"
              className="flex items-center justify-center p-2.5 rounded-xl flex-shrink-0 transition-all"
              style={{ background: 'rgba(37,211,102,0.1)', color: WA, border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <a
            href={`https://wa.me/528441628536?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => { e.preventDefault(); onAdd(); }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all"
            style={{ background: 'rgba(37,211,102,0.1)', color: WA, border: '1px solid rgba(37,211,102,0.18)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.18)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.1)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.18)';
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir al Carrito
          </a>
        )}
      </div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdate, onRemoveItem, onClear }: {
  cart: CartItem[]; onClose: () => void;
  onUpdate: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void; onClear: () => void;
}) {
  const total = cart.reduce((s, i) => s + (i.product.publicPrice ?? 0) * i.qty, 0);

  const waMsg = encodeURIComponent(
    'Hola Iván, quiero cotizar los siguientes productos:\n' +
    cart.map(i => `${i.qty}x ${i.product.name} ($${fmt((i.product.publicPrice ?? 0) * i.qty)})`).join('\n') +
    `\nTotal estimado: $${fmt(total)}. ¿Tienen disponibilidad?`
  );

  return (
    <>
      <div className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] flex flex-col"
        style={{ width: 'min(400px,100vw)', background: INK2, borderLeft: `1px solid ${BORDER}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: GREEN }} />
            <span className="font-black text-base">Tu Cotización</span>
            {cart.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,200,150,0.12)', color: GREEN }}>
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button onClick={onClear}
                className="text-[11px] font-semibold transition-colors hover:text-white"
                style={{ color: MUTED }}>Limpiar</button>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: MUTED }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <ShoppingCart className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Tu carrito está vacío
              </p>
              <p className="text-xs" style={{ color: MUTED }}>Agrega productos para cotizar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-3 p-3 rounded-xl"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {item.product.image
                    ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain p-1" />
                    : <span className="text-[9px] font-black font-mono" style={{ color: GREEN }}>TB</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold line-clamp-2 leading-snug"
                    style={{ color: 'rgba(255,255,255,0.85)' }}>{item.product.name}</p>
                  {item.product.publicPrice && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: GREEN }}>
                      ${fmt((item.product.publicPrice) * item.qty)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center rounded-lg overflow-hidden"
                      style={{ border: `1px solid ${BORDER}` }}>
                      <button onClick={() => onUpdate(item.product.id, item.qty - 1)}
                        className="px-2 py-1 transition-colors hover:bg-white/5"
                        style={{ color: MUTED }}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-black" style={{ color: 'white' }}>{item.qty}</span>
                      <button onClick={() => onUpdate(item.product.id, item.qty + 1)}
                        className="px-2 py-1 transition-colors hover:bg-white/5"
                        style={{ color: MUTED }}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 transition-colors hover:text-red-400"
                      style={{ color: MUTED }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: MUTED }}>Total estimado</span>
              <span className="text-xl font-black" style={{ color: 'white' }}>${fmt(total)}</span>
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
              * Precios y disponibilidad sujetos a confirmación con proveedor
            </p>
            <a
              href={`https://wa.me/528441628536?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-black text-sm transition-all"
              style={{ background: WA, color: '#fff' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
            >
              <MessageCircle className="w-4 h-4" />
              Finalizar Pedido por WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [products, setProducts]             = useState<Product[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [activeCategory, setActiveCategory] = useState<UICat>('Todos');
  const [scrolled, setScrolled]             = useState(false);
  const [menuOpen, setMenuOpen]             = useState(false);
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]             = useState(false);
  const searchRef                           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=200');
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.product.publicPrice ?? 0) * i.qty, 0), [cart]);

  const addToCart = (product: Product) =>
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      return ex
        ? prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { product, qty: 1 }];
    });

  const removeFromCart = (productId: string) =>
    setCart(prev => {
      const ex = prev.find(i => i.product.id === productId);
      if (!ex) return prev;
      return ex.qty <= 1
        ? prev.filter(i => i.product.id !== productId)
        : prev.map(i => i.product.id === productId ? { ...i, qty: i.qty - 1 } : i);
    });

  const updateCartQty = (productId: string, qty: number) =>
    qty <= 0
      ? setCart(prev => prev.filter(i => i.product.id !== productId))
      : setCart(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i));

  const removeCartItem = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');
    if (activeCategory !== 'Todos') list = list.filter(p => mapUI(p.category) === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      const compat = (p: Product) => Array.isArray(p.compatibility)
        ? p.compatibility.join(' ')
        : (p.compatibility ?? '');
      list = list.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        compat(p).toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const counts = useMemo(() => {
    const all = products.filter(p => p.availabilityStatus !== 'OUT_OF_STOCK');
    return Object.fromEntries(
      UI_CATS.map(cat => [cat, cat === 'Todos' ? all.length : all.filter(p => mapUI(p.category) === cat).length])
    ) as Record<UICat, number>;
  }, [products]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: INK, color: 'white' }}>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart} onClose={() => setCartOpen(false)}
          onUpdate={updateCartQty} onRemoveItem={removeCartItem}
          onClear={() => setCart([])}
        />
      )}

      {/* ── Floating Cart Button ── */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-[150] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: GREEN, color: INK, boxShadow: '0 8px 32px rgba(0,200,150,0.35)' }}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
          <span className="font-mono text-xs opacity-80">${fmt(cartTotal)}</span>
        </button>
      )}

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '10px 0' : '16px 0',
        background: 'rgba(11,14,20,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${BORDER}`, transition: 'padding 0.3s',
      }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex-shrink-0">
            <span className="block sm:hidden"><ToneBoxLogo size="sm" /></span>
            <span className="hidden sm:block"><ToneBoxLogo showTagline /></span>
          </Link>
          <div className="hidden md:flex items-center gap-2 flex-1">
            <Link href="/" className="transition-colors" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)'}>
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <span className="font-semibold" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Catálogo</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {cartCount > 0 && (
              <button onClick={() => setCartOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-xl transition-all"
                style={{ background: 'rgba(0,200,150,0.1)', color: GREEN, border: '1px solid rgba(0,200,150,0.22)', padding: '8px 14px', fontSize: 12, fontWeight: 700 }}>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={{ background: GREEN, color: INK }}>{cartCount}</span>
              </button>
            )}
            <a href="https://wa.me/528441628536" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(37,211,102,0.12)', color: WA, border: '1px solid rgba(37,211,102,0.2)', padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>
              <MessageCircle className="w-3.5 h-3.5" />WhatsApp
            </a>
            <button className="md:hidden p-2 rounded-xl" style={{ color: MUTED }}
              onClick={() => setMenuOpen(p => !p)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-5 pb-4 pt-2 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Link href="/" className="block py-2 text-sm hover:text-white transition-colors" style={{ color: MUTED }}>
              ← Volver al inicio
            </Link>
            <a href="https://wa.me/528441628536" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 text-sm font-semibold" style={{ color: WA }}>
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 90, paddingBottom: 40, background: `linear-gradient(180deg,${INK2} 0%,${INK} 100%)` }}>
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
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
            <input
              ref={searchRef} type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Busca por modelo de impresora, SKU o marca..."
              className="w-full py-3.5 pl-11 pr-10 rounded-2xl text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, color: 'white' }}
              onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(0,200,150,0.4)'}
              onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = BORDER}
            />
            {search && (
              <button onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
                style={{ color: MUTED }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Contenido ── */}
      <section className="max-w-[1160px] mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {UI_CATS.map(cat => {
            const isActive = activeCategory === cat;
            const count    = counts[cat] ?? 0;
            if (cat !== 'Todos' && count === 0) return null;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
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
                {CAT_LABELS[cat]}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? GREEN : 'rgba(255,255,255,0.3)',
                  }}>
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
            {search && <> · búsqueda: "<span style={{ color: GREEN }}>{search}</span>"</>}
            {activeCategory !== 'Todos' && <> · {CAT_LABELS[activeCategory]}</>}
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
              <Package className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div>
              <p className="font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>Sin resultados</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {search ? `No encontramos "${search}"` : 'No hay productos en esta categoría'}
              </p>
            </div>
            {search && (
              <button onClick={() => setSearch('')} className="text-sm font-semibold" style={{ color: GREEN }}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(p => {
              const cartQty = cart.find(i => i.product.id === p.id)?.qty ?? 0;
              return (
                <ProductCard key={p.id} p={p} cartQty={cartQty}
                  onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} />
              );
            })}
          </div>
        )}
      </section>

      {/* ── CTA strip ── */}
      <section className="py-14 mt-4" style={{ background: INK2, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 text-center space-y-4">
          <p className="font-mono text-[10px] tracking-[3px] uppercase font-black" style={{ color: GREEN }}>
            // ¿No encuentras tu modelo?
          </p>
          <h2 className="text-2xl sm:text-3xl font-black">
            Lo gestionamos por ti directamente con el fabricante
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: MUTED }}>
            Consulta disponibilidad y tiempos de entrega aquí.
          </p>
          <a
            href="https://wa.me/528441628536?text=Hola+Iv%C3%A1n%2C+no+encuentro+mi+modelo+en+el+cat%C3%A1logo.+%C2%BFPodr%C3%ADas+confirmarme+existencias+y+tiempo+estimado+de+entrega%3F"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all"
            style={{ background: GREEN, color: INK }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
          >
            <MessageCircle className="w-4 h-4" />
            Consultar Disponibilidad
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
