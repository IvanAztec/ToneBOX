'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Shield, BarChart3, Zap,
  AlertTriangle, RefreshCw, CheckCircle2, Package2,
} from 'lucide-react';
import Footer from '@/components/shared/Footer';
import PaymentGateway from '@/components/checkout/PaymentGateway';
import ProductComparatorSection from '@/components/landing/ProductComparatorSection';
import { useAuth } from '@/app/providers';

interface Bundle {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  availabilityStatus: string;
}

interface CatalogAlert {
  id: string;
  query: string;
  hitCount: number;
  priority: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'CRÍTICO',  className: 'bg-red-100 text-red-800' },
  HIGH:     { label: 'ALTO',     className: 'bg-orange-100 text-orange-800' },
  MEDIUM:   { label: 'MEDIO',    className: 'bg-yellow-100 text-yellow-800' },
};

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="h-[72px] bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-[72px] bg-gray-100 rounded-2xl animate-pulse delay-75" />
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bundles, setBundles]               = useState<Bundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [alerts, setAlerts]                 = useState<CatalogAlert[]>([]);
  const [alertsLoading, setAlertsLoading]   = useState(true);

  // Checkout state — starts empty, driven by bundle selection
  const [selectedPrice, setSelectedPrice]             = useState(0);
  const [selectedBundleId, setSelectedBundleId]       = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('Duo Pack ToneBOX');

  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/products/bundles')
      .then(r => r.json())
      .then(data => setBundles(data.items ?? []))
      .catch(() => setBundles([]))
      .finally(() => setBundlesLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/catalog/alerts')
      .then(r => r.json())
      .then(data => setAlerts(data.items ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false));
  }, []);

  function handleBundleSelect(b: Bundle) {
    if (b.price == null) return;
    setSelectedPrice(b.price);
    setSelectedBundleId(b.id);
    setSelectedProductName(b.name);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }

  function handleActivateVIP() {
    const firstPriced = bundles.find(b => b.price != null);
    if (firstPriced) {
      handleBundleSelect(firstPriced);
    } else {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* ── Navigation ── */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                ToneBOX <span className="text-green-600 font-black">v2.0</span>
              </span>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              {!authLoading && isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <Link
                href={isAuthenticated ? '/dashboard' : '/auth/login'}
                className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
              >
                {!authLoading && isAuthenticated ? 'Dashboard →' : 'Sign In'}
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative pt-20 pb-36 overflow-hidden">
        {/* Glow radial */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-green-100/60 via-transparent to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-200/80 text-green-700 text-xs font-black mb-8">
            <Shield className="w-3 h-3" /> Atención VIP · Asesoría + Asistencia
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.08] mb-6 tracking-tight">
            Tu <span className="text-green-600">Asesor</span> de Ahorro,<br />
            tu <span className="text-emerald-500">Asistente</span> de Logística.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-4 font-medium leading-relaxed">
            El primer sistema que combina la inteligencia de un Asesor de optimización
            con la eficiencia de un Asistente personal que anticipa tu demanda.
          </p>
          <p className="text-sm text-gray-400 mb-12 font-semibold italic">
            "Para un flujo Sin Pausas: Tú solo imprime, nosotros nos encargamos del resto."
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleActivateVIP}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2.5 hover:bg-green-600 transition-all shadow-2xl shadow-gray-900/20 active:scale-95"
            >
              Activar Asistencia VIP <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="mailto:ventas@aztecstudio.net?subject=Consulta%20ToneBOX"
              className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold hover:border-green-300 hover:shadow-md transition-all"
            >
              Consultar con mi Asesor
            </a>
          </div>
        </div>
      </header>

      {/* ── Intelligence Widgets ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">

          {/* ── Bundles Widget ── */}
          <div className="bg-white p-7 rounded-[2rem] shadow-2xl shadow-gray-200/60 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Package2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                Duo Pack Matches
              </span>
            </div>
            <h3 className="text-lg font-black mb-1">Bundles Compatibles</h3>
            <p className="text-xs text-gray-400 font-medium mb-5">
              Haz clic en un bundle para cargarlo al checkout →
            </p>
            <div className="space-y-3 flex-1">
              {bundlesLoading ? (
                <SkeletonCard />
              ) : bundles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package2 className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 font-semibold">Sin bundles activos aún.</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Los Duo Packs aparecerán cuando se sincronice el catálogo CT.
                  </p>
                </div>
              ) : (
                bundles.map(b => {
                  const isSelected = selectedBundleId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleBundleSelect(b)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50/50 shadow-sm shadow-green-100'
                          : 'border-gray-100 bg-gray-50/80 hover:border-blue-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-black text-sm text-gray-900 leading-snug flex-1">{b.name}</p>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
                            Ahorro 13%
                          </span>
                        )}
                      </div>
                      {b.price != null && (
                        <p className="text-xs font-black text-blue-600 mt-1.5">
                          ${b.price.toFixed(0)} MXN
                        </p>
                      )}
                      {b.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{b.description}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Search Intelligence Widget ── */}
          <div className="bg-white p-7 rounded-[2rem] shadow-2xl shadow-gray-200/60 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                Lost Opportunities
              </span>
            </div>
            <h3 className="text-lg font-black mb-1">Inteligencia de Búsqueda</h3>
            <p className="text-xs text-gray-400 font-medium mb-5">
              Productos que tus clientes buscan y no encuentran.
            </p>
            <div className="space-y-3 flex-1">
              {alertsLoading ? (
                <SkeletonCard />
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 font-semibold">Sin alertas activas.</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Aparecerán cuando los clientes busquen productos inexistentes.
                  </p>
                </div>
              ) : (
                alerts.map(a => {
                  const cfg = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG['MEDIUM'];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-4 bg-orange-50/40 rounded-2xl border border-orange-100/80"
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-900">{a.query}</p>
                        <p className="text-xs text-orange-600 font-bold mt-0.5">
                          {a.hitCount} {a.hitCount === 1 ? 'búsqueda real' : 'búsquedas reales'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Checkout Dinámico VIP ── */}
          <div ref={checkoutRef} className="lg:col-span-1">
            <PaymentGateway
              basePrice={selectedPrice}
              productName={selectedProductName}
            />
          </div>

        </div>
      </section>

      {/* ── Comparador de Productos por Marca ── */}
      <ProductComparatorSection
        onSelectProduct={(name, price) => {
          setSelectedProductName(name);
          setSelectedPrice(price);
          setTimeout(() => {
            checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 80);
        }}
      />

      {/* ── Features Section ── */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              La fábrica que trabaja <span className="text-green-600">mientras tú imprimes</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">
              Tres motores de inteligencia operando en paralelo, 24/7.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black mb-2 text-gray-900">Anticipación IA</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Calculamos tu tasa de consumo basada en el rendimiento real de tu modelo (Canon, Brother, Ricoh).
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black mb-2 text-gray-900">Cero Desperdicio</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Recibe recordatorios de reposición 7 días antes de vaciar tu tóner. Continuidad garantizada.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black mb-2 text-gray-900">Duo Pack Logic</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Combinamos Tóner y Drum automáticamente para ahorrarte hasta 13% en costos de operación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
