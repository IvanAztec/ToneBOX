'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChart3, MessageCircle } from 'lucide-react';

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
          padding: scrolled ? '12px 0' : '20px 0',
          background: 'rgba(11,14,20,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'padding 0.3s',
        }}
      >
        <div className="max-w-[1160px] mx-auto px-8 flex items-center justify-between">
          <ToneBoxLogo showTagline />

          {/* Nav links (hidden on mobile) */}
          <ul className="hidden md:flex gap-8 list-none">
            {[['#combos','Combos'],['#consumibles','Consumibles'],['#calculadora','Calcular ahorro'],['#logistica','Sucursales']].map(([href,label]) => (
              <li key={href}>
                <a href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)'}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Nav CTA */}
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 rounded-xl transition-all hover:bg-opacity-30"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)', padding: '9px 16px', fontSize: 13, fontWeight: 500 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            {!authLoading && isAuthenticated && (
              <Link href="/dashboard" className="flex items-center gap-1.5 transition-colors hover:text-[#00C896]" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <BarChart3 className="w-4 h-4" /> Admin
              </Link>
            )}
            <a
              href="#combos"
              className="font-syne font-bold rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: '#00C896', color: '#0B0E14', padding: '10px 22px', fontSize: 14 }}
            >
              Ver Combos
            </a>
          </div>
        </div>
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
