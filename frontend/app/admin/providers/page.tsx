'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, CheckCircle2, AlertTriangle, Loader2,
  ArrowLeft, Truck, FileSpreadsheet, X,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ImportResult {
  success: boolean;
  provider?: string;
  valid?: number;
  created?: number;
  updated?: number;
  errors?: string[];
  error?: string;
}

type ProviderState = {
  file: File | null;
  importing: boolean;
  result: ImportResult | null;
};

type ProviderCode = 'CADTONER' | 'BOP' | 'UNICOM';

// ── Config de proveedores ─────────────────────────────────────────────────────

const PROVIDERS: {
  code: ProviderCode;
  name: string;
  location: string;
  badge: string;
  badgeColor: string;
  description: string;
  accepts: string;
}[] = [
  {
    code:        'CADTONER',
    name:        'CADTONER México',
    location:    'Guadalajara, Jalisco',
    badge:       'COMPATIBLE',
    badgeColor:  'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Toners compatibles HP, Brother, Kyocera, Samsung, Xerox. Formato: "Listado CADTONER.xlsx"',
    accepts:     '.xlsx,.xls',
  },
  {
    code:        'BOP',
    name:        'BOP Internacional',
    location:    'CDMX',
    badge:       'COMPATIBLE',
    badgeColor:  'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Toners y tintas compatibles multi-marca. Formato: "LISTA PRECIOS BOP CONSUMIBLES.xlsx"',
    accepts:     '.xlsx,.xls',
  },
  {
    code:        'UNICOM',
    name:        'UNICOM Monterrey',
    location:    'Monterrey, NL',
    badge:       'ORIGINAL',
    badgeColor:  'bg-green-50 text-green-700 border-green-200',
    description: 'Originales HP, Xerox, Epson, Brother, Canon, Lexmark y más. Formato: "Lista UNICOM.xls.xlsx"',
    accepts:     '.xlsx,.xls',
  },
];

// ── Página ────────────────────────────────────────────────────────────────────

export default function ProvidersImportPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const initialState: Record<ProviderCode, ProviderState> = {
    CADTONER: { file: null, importing: false, result: null },
    BOP:      { file: null, importing: false, result: null },
    UNICOM:   { file: null, importing: false, result: null },
  };

  const [states, setStates] = useState(initialState);
  const fileRefs = {
    CADTONER: useRef<HTMLInputElement>(null),
    BOP:      useRef<HTMLInputElement>(null),
    UNICOM:   useRef<HTMLInputElement>(null),
  };

  const updateState = useCallback(
    (code: ProviderCode, patch: Partial<ProviderState>) =>
      setStates(prev => ({ ...prev, [code]: { ...prev[code], ...patch } })),
    []
  );

  const handleFileChange = (code: ProviderCode, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    updateState(code, { file, result: null });
  };

  const handleImport = async (code: ProviderCode) => {
    const { file } = states[code];
    if (!file) return;

    updateState(code, { importing: true, result: null });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const res = await fetch(`/api/admin/providers/${code}/import`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename':   file.name,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });

      const data: ImportResult = await res.json();
      updateState(code, { result: data, importing: false });

      // Limpiar file input para poder reimportar
      if (fileRefs[code].current) fileRefs[code].current.value = '';
      if (data.success) updateState(code, { file: null });

    } catch {
      updateState(code, {
        importing: false,
        result: { success: false, error: 'Error de red — revisa la conexión con Railway.' },
      });
    }
  };

  const clearFile = (code: ProviderCode) => {
    if (fileRefs[code].current) fileRefs[code].current.value = '';
    updateState(code, { file: null, result: null });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-green-600" />
              Importar Catálogos
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Carga los archivos de precio de cada proveedor para actualizar el catálogo.
            </p>
          </div>
        </div>

        {/* Tarjetas de proveedores */}
        <div className="grid grid-cols-1 gap-4">
          {PROVIDERS.map(prov => {
            const state = states[prov.code];
            const result = state.result;

            return (
              <div
                key={prov.code}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
              >
                {/* Cabecera proveedor */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900">{prov.name}</h2>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${prov.badgeColor}`}>
                          {prov.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{prov.location}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-5">{prov.description}</p>

                {/* Selector de archivo */}
                <input
                  ref={fileRefs[prov.code]}
                  type="file"
                  accept={prov.accepts}
                  onChange={e => handleFileChange(prov.code, e)}
                  className="hidden"
                  id={`file-${prov.code}`}
                />

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Botón seleccionar */}
                  <label
                    htmlFor={`file-${prov.code}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {state.file ? 'Cambiar archivo' : 'Seleccionar archivo'}
                  </label>

                  {/* Nombre del archivo seleccionado */}
                  {state.file && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm text-green-800 font-medium max-w-xs">
                      <FileSpreadsheet className="w-4 h-4 shrink-0 text-green-600" />
                      <span className="truncate">{state.file.name}</span>
                      <button
                        onClick={() => clearFile(prov.code)}
                        className="ml-1 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Botón importar */}
                  <button
                    onClick={() => handleImport(prov.code)}
                    disabled={!state.file || state.importing}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                  >
                    {state.importing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Importar {prov.code}</>
                    )}
                  </button>
                </div>

                {/* Resultado */}
                {result && (
                  <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium flex items-start gap-2 ${
                    result.success
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {result.success ? (
                        <>
                          <span className="font-bold">Importación exitosa.</span>{' '}
                          {result.valid} productos procesados —{' '}
                          <span className="text-green-700">{result.created} nuevos</span>,{' '}
                          {result.updated} actualizados.
                          {result.errors && result.errors.length > 0 && (
                            <p className="mt-1 text-xs text-yellow-700">
                              {result.errors.length} errores menores: {result.errors[0]}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-bold">Error:</span> {result.error}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-400 text-center pb-4">
          Los archivos se procesan directamente en el servidor. No se almacenan localmente.
          Puedes reimportar en cualquier momento para actualizar precios y disponibilidad.
        </p>

      </div>
    </DashboardLayout>
  );
}
