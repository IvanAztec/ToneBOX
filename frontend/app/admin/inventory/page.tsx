'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Package, CheckCircle2, Clock, AlertTriangle, Loader2, ArrowLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  availabilityStatus: string;
  updatedAt: string;
  provider?: { name: string; code: string } | null;
}

interface IngestResult {
  products?: { created: number; updated: number };
  bundles?: { created: number };
  elapsed?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  IN_STOCK:  { label: 'En stock',   className: 'text-green-700 bg-green-50 border-green-200',  icon: <CheckCircle2 className="w-3 h-3" /> },
  ON_DEMAND: { label: 'Bajo pedido', className: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <Clock className="w-3 h-3" /> },
  OUT_OF_STOCK: { label: 'Agotado', className: 'text-red-700 bg-red-50 border-red-200',          icon: <AlertTriangle className="w-3 h-3" /> },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function InventoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<IngestResult | null>(null);
  const [search, setSearch] = useState('');

  // Redirige si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=50');
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchProducts();
  }, [isAuthenticated, fetchProducts]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/ct/ingest', { method: 'POST' });
      const data = await res.json();
      setLastSync(data);
      if (data.success) await fetchProducts();
    } catch {
      // silencioso — el error se verá en los logs de Railway
    } finally {
      setSyncing(false);
    }
  };

  const filtered = products.filter(p =>
    [p.sku, p.name, p.brand, p.category].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-green-600" />
                Inventario CT Online
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Últimos {products.length} productos sincronizados — actualización cada 15 min
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-50"
          >
            {syncing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sincronizando...</>
              : <><RefreshCw className="w-4 h-4" /> Sincronizar CT</>}
          </button>
        </div>

        {/* Resultado última sync */}
        {lastSync && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            lastSync.products ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {lastSync.products ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Sync completada en {lastSync.elapsed} —
                {lastSync.products.created} productos nuevos,
                {lastSync.products.updated} actualizados,
                {lastSync.bundles?.created ?? 0} bundles generados.
              </>
            ) : (
              <><AlertTriangle className="w-4 h-4 shrink-0" /> Error en sync — revisa los logs de Railway.</>
            )}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar por SKU, nombre, marca o categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Proveedor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Última sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (j * 10) % 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">
                        {search ? 'Sin resultados para esa búsqueda.' : 'Sin productos sincronizados aún.'}
                      </p>
                      {!search && (
                        <p className="text-xs text-gray-300 mt-1">
                          Haz clic en "Sincronizar CT" para cargar el catálogo.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => {
                    const status = STATUS_CONFIG[p.availabilityStatus] ?? STATUS_CONFIG['ON_DEMAND'];
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{p.sku}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.brand ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{p.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {p.provider?.code ?? 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${status.className}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(p.updatedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              Mostrando {filtered.length} de {products.length} productos
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
