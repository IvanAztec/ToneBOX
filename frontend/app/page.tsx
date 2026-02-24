'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChart3, MessageCircle, Menu, X } from 'lucide-react';

import { useAuth } from '@/app/providers';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';
import TickerBar from '@/components/landing/TickerBar';
import HeroSection from '@/components/landing/HeroSection';
import CombosSection from '@/components/landing/CombosSection';
import BrandsSection from '@/components/landing/BrandsSection';
import ProductComparatorSection from '@/components/landing/ProductComparatorSection';
import CalculatorSection from '@/components/landing/CalculatorSection';
import LogisticsSection from '@/components/landing/LogisticsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustSection from '@/components/landing/TrustSection';
import PaymentGateway from '@/components/checkout/PaymentGateway';
import Footer from '@/components/shared/Footer';

const WA_NUMBER      = '528441628536';
const WA_FLOAT_MSG   = encodeURIComponent('Hola, tengo una duda sobre ToneBox. ¿Me pueden ayudar?');
const MAX_PRICE      = 4500;
const PRIORITY_SKUS  = [
  '85A','78A','05A','80A','55A','64A','12A','35A','36A','51A','53A','26A','30A','58A','87A',
  'TN-660','TN-630','TN-760','TN-227','TN-433','TN-436','TN-850','TN-880',
  'TK-1175','TK-3182','TK-5242','TK-1162','TK-5292',
  'DR-630','DR-760','DR-820','DR-3300',
  'CRG-128','CRG-137','CRG-045',
];

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
}

function scorePriority(b: Bundle) {
  const text = `${b.name} ${b.description ?? ''}`.toUpperCase();
  return PRIORITY_SKUS.some(k => text.includes(k.toUpperCase())) ? 1 : 0;
}

function sortBundles(items: Bundle[]) {
  return [...items].sort((a, b) => {
    const d = scorePriority(b) - scorePriority(a);
    return d !== 0 ? d : (a.price ?? 0) - (b.price ?? 0);
  });
}

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bundles, setBundles]         = useState<Bundle[]>([]);
  const [selectedPrice, setPrice]     = useState(0);
  const [selectedBundleId, setBundId] = useState<string | null>(null);
  const [selectedName, setName]       = useState('Duo Pack ToneBox');
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/products/bundles?maxPrice=${MAX_PRICE}`)
      .then(r => r.json())
      .then(d => setBundles(sortBundles(d.items ?? [])))
      .catch(() => setBundles([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleBundleSelect(b: Bundle) {
    if (b.price == null) return;
    setPrice(b.price);
    setBundId(b.id);
    setName(b.name);
    setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }

  function handleProductSelect(name: string, price: number) {
    setPrice(price);
    setName(name);
    setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0B0E14', color: 'white' }}>

      {/* ── Fixed Nav ── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: scrolled ? '10px 0' : '16px 0',
          background: 'rgba(11,14,20,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'padding 0.3s',
        }}
      >
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">

          {/* Logo — isotipo solo en móvil, completo en desktop */}
          <div className="flex-shrink-0">
            <span className="block sm:hidden">
              <ToneBoxLogo size="sm" />
            </span>
            <span className="hidden sm:block">
              <ToneBoxLogo showTagline />
            </span>
          </div>

          {/* Nav links — solo desktop */}
          <ul className="hidden md:flex gap-6 list-none flex-1 justify-center">
            {[['#combos','Combos'],['#consumibles','Consumibles'],['#calculadora','Ahorro'],['#logistica','Sucursales']].map(([href,label]) => (
              <li key={href}>
                <a
                  href={href}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)'}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTAs derecha */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* WhatsApp — solo sm+ */}
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', padding: '8px 14px', fontSize: 12, fontWeight: 600 }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>

            {/* Admin link */}
            {!authLoading && isAuthenticated && (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 transition-colors hover:text-[#00C896]"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Admin
              </Link>
            )}

            {/* Ver Combos — visible en sm+, compacto en móvil */}
            <a
              href="#combos"
              className="font-syne font-bold rounded-xl transition-all hover:-translate-y-0.5 hidden sm:inline-block"
              style={{ background: '#00C896', color: '#0B0E14', padding: '9px 20px', fontSize: 13 }}
            >
              Ver Combos
            </a>

            {/* Hamburger — solo móvil */}
            <button
              className="flex sm:hidden items-center justify-center w-9 h-9 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none' }}
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div
            className="sm:hidden border-t"
            style={{ background: 'rgba(11,14,20,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {[['#combos','Combos'],['#consumibles','Consumibles'],['#calculadora','Calcular ahorro'],['#logistica','Sucursales']].map(([href,label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="py-2.5 text-sm font-medium rounded-lg px-3 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
                >
                  {label}
                </a>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <a
                href="#combos"
                onClick={() => setMenuOpen(false)}
                className="font-syne font-bold rounded-xl text-center py-3 mt-1 transition-all"
                style={{ background: '#00C896', color: '#0B0E14', fontSize: 14 }}
              >
                Ver Combos →
              </a>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-medium text-sm"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page offset for fixed nav ── */}
      <div style={{ height: 80 }} />

      {/* ── Ticker ── */}
      <TickerBar />

      {/* ── Hero ── */}
      <HeroSection
        onCombosCta={() => scrollTo('combos')}
        onCalcCta={() => scrollTo('calculadora')}
      />

      {/* ── Combos (real API bundles) ── */}
      <CombosSection bundles={bundles} onSelect={handleBundleSelect} />

      {/* ── Brands ── */}
      <BrandsSection />

      {/* ── Product Comparator (search) ── */}
      <section style={{ background: '#0B0E14' }}>
        <ProductComparatorSection onSelectProduct={handleProductSelect} />
      </section>

      {/* ── Calculator ── */}
      <CalculatorSection />

      {/* ── Logistics ── */}
      <LogisticsSection />

      {/* ── How It Works ── */}
      <HowItWorksSection />

      {/* ── Trust + Subscription + CTA ── */}
      <TrustSection />

      {/* ── Checkout (shown when product selected) ── */}
      {selectedPrice > 0 && (
        <section
          ref={checkoutRef}
          className="py-16"
          style={{ background: '#161B26', borderTop: '1px solid rgba(0,200,150,0.2)' }}
        >
          <div className="max-w-xl mx-auto px-8">
            <div className="font-mono text-[10px] tracking-[3px] uppercase mb-3 text-center" style={{ color: '#00C896' }}>
              // Finalizar Pedido
            </div>
            <h2 className="font-syne font-extrabold text-center mb-8" style={{ fontSize: 28 }}>
              {selectedName}
            </h2>
            <PaymentGateway basePrice={selectedPrice} productName={selectedName} />
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <Footer />

      {/* ── Floating WhatsApp ── */}
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_FLOAT_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 font-bold text-sm rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: '#25D366', color: 'white', padding: '12px 20px', boxShadow: '0 8px 32px rgba(37,211,102,0.4)' }}
        aria-label="Chat por WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">¿Dudas?</span>
      </a>
    </div>
  );
}
