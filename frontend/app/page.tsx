'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Shield, BarChart3, Zap,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import Footer from '@/components/shared/Footer';
import PaymentGateway from '@/components/checkout/PaymentGateway';
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

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MEDIO',
};

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);

  const [alerts, setAlerts] = useState<CatalogAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [selectedPrice, setSelectedPrice] = useState(571);

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500 shadow-lg shadow-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                ToneBOX <span className="text-green-600 font-black">v2.0</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              {!authLoading && isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <Link
                href={isAuthenticated ? '/dashboard' : '/auth/register'}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-600 transition-all active:scale-95 shadow-xl shadow-gray-900/10"
              >
                {!authLoading && isAuthenticated ? 'Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-green-50 via-transparent to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-bold mb-8 animate-bounce">
            <Shield className="w-3 h-3" /> Atención VIP (Asesoría + Asistencia)
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
            Tu <span className="text-green-600">Asesor</span> de Ahorro,<br />
            tu <span className="text-emerald-500">Asistente</span> de Logística.
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6 font-medium">
            El primer sistema que combina la inteligencia de un Asesor de optimización
            con la eficiencia de un Asistente personal que anticipa tu demanda.
          </p>
          <p className="text-sm text-gray-400 mb-12 font-bold italic">
            "Para un flujo Sin Pausas: Tú solo imprime, nosotros nos encargamos del resto."
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-green-600 transition-all shadow-2xl shadow-gray-900/20">
              Activar Asistencia VIP <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold hover:border-green-200 transition-all">
              Consultar con mi Asesor
            </button>
          </div>
        </div>
      </header>

      {/* Intelligence Widgets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Bundles Widget */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                Duo Pack Matches
              </span>
            </div>
            <h3 className="text-xl font-black mb-4">Bundles Compatibles</h3>
            <div className="space-y-4 flex-1">
              {bundlesLoading ? (
                <SkeletonCard />
              ) : bundles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <RefreshCw className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">Sin bundles activos aún.</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Los Duo Packs aparecerán cuando cargues productos.
                  </p>
                </div>
              ) : (
                bundles.map(b => (
                  <button
                    key={b.id}
                    onClick={() => b.price != null && setSelectedPrice(b.price)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 text-left transition-all group"
                  >
                    {b.price != null && (
                      <p className="text-xs font-black text-blue-600 mb-1">
                        ${b.price.toFixed(0)} MXN
                      </p>
                    )}
                    <p className="font-bold text-sm text-gray-900">{b.name}</p>
                    {b.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Search Intelligence Widget */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                Lost Opportunities
              </span>
            </div>
            <h3 className="text-xl font-black mb-4">Inteligencia de Búsqueda</h3>
            <div className="space-y-4 flex-1">
              {alertsLoading ? (
                <SkeletonCard />
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">Sin alertas activas.</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Aparecerán cuando los clientes busquen productos inexistentes.
                  </p>
                </div>
              ) : (
                alerts.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 bg-orange-50/30 rounded-2xl border border-orange-100"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">{a.query}</p>
                      <p className="text-xs text-orange-600 font-bold">{a.hitCount} búsquedas reales</p>
                    </div>
                    <span className="text-[10px] font-black bg-orange-200 text-orange-800 px-2 py-1 rounded">
                      {PRIORITY_LABEL[a.priority] ?? a.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Dinámico VIP */}
          <div className="lg:col-span-1">
            <PaymentGateway basePrice={selectedPrice} />
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black mb-3 text-gray-900">Anticipación IA</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Calculamos tu tasa de consumo basada en el rendimiento real de tu modelo (Canon, Brother, Ricoh).
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black mb-3 text-gray-900">Cero Desperdicio</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Recibe recordatorios de reposición 7 días antes de vaciar tu tóner. Continuidad garantizada.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black mb-3 text-gray-900">Duo Pack Logic</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Combinamos Tóner y Drum automáticamente para ahorrarte hasta 40% en costos de operación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
