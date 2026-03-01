'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone, ArrowLeft, RefreshCw, Loader2, Play
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';
import KanbanBoard from './components/KanbanBoard';
import { PipelineLead, Vendedor, PipelineStage } from './lib/zod';

interface Template { name: string; subtitle: string; emoji: string; template: string; }
type Templates = { A: Template; B: Template; C: Template };

// ── Default templates ─────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES: Templates = {
  A: { name: 'Urgencia', subtitle: '', emoji: '🚨', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} se agotó hace {daysAgo} días. ¿Lo coordinamos hoy? Responde *Rescate*. 🚀' },
  B: { name: 'Prevención', subtitle: '', emoji: '⚠️', template: 'Hola {nombre}, tu tóner {modelo} en {empresa} tiene {daysRemaining} días restantes. ¿Lo pedimos antes de que se acabe? Responde *Adelante*. 💪' },
  C: { name: 'Promoción', subtitle: '', emoji: '🎯', template: 'Hola {nombre}, llevando 2 tóners {modelo} en {empresa} te damos 10% de descuento. ¿Aprovechamos? Responde *Pack2*. 🛒' },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CampanasPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock pipeline data adapted from previous generic alerts
      // En una implementación real con DB aquí se pedirán PipelineLeads y Vendedores
      const [alertsRes, tplRes] = await Promise.all([
        fetch('/api/admin/critical-alerts?all=true'),
        fetch('/api/admin/message-templates'),
      ]);
      const alertsData = await alertsRes.json();
      const tplData = await tplRes.json();

      const alerts: any[] = alertsData.alerts ?? [];

      // Transform client alerts into pipeline leads for Kanban Demo functionality
      const transformedLeads: PipelineLead[] = alerts.map((a: any, i) => ({
        id: `virtual-lead-${i}`,
        client_id: a.user.id,
        subscription_id: a.subscriptionId,
        vendedor_id: null,
        stage: a.daysRemaining <= 0 ? 'contactado' : 'prospecto',
        valor_estimado: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: a.user,
        product: a.product,
        daysRemaining: a.daysRemaining
      }));

      // Mock Vendedores for UI Showcase
      setVendedores([
        { id: '1111-2222', nombre: 'Juan Pérez', email: 'juan@sfact.io', activo: true },
        { id: '3333-4444', nombre: 'María Lopez', email: 'maria@sfact.io', activo: true },
        { id: '5555-6666', nombre: 'Luis Gmz', email: 'luis@sfact.io', activo: true }
      ]);

      setLeads(transformedLeads);
      if (tplData.success) setTemplates(tplData.templates);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const handleAssignVendedor = async (leadId: string, vendedorId: string) => {
    // API Call a supabase pasaría acá:
    // await fetch('/api/admin/pipeline/assign', ...)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, vendedor_id: vendedorId } : l));
  };

  const handleMoveStage = async (leadId: string, stage: PipelineStage, templateUsed?: string) => {
    // API Call a supabase pasaría acá:
    // await fetch('/api/admin/pipeline/stage', ...)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage, template_used: templateUsed || l.template_used } : l));
  };

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-blue-500" />
                Pipeline de Ventas
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Convierte las alertas en cierres arrastrando leads o disparando plantillas WA.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refrescar Pipeline
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-sm">Ejecuta la Migración SQL</h3>
            <p className="text-slate-400 text-xs mt-1">Recuerda ejecutar el archivo `001_vendedores_pipeline.sql` para tener la BD final lista.</p>
          </div>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
            <Play className="w-3.5 h-3.5" /> Demo Mode Activo
          </button>
        </div>

        {/* Board View */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">Sin leads en el pipeline</p>
            <p className="text-sm mt-1">Espera a que se generen más alertas de consumo</p>
          </div>
        ) : (
          <KanbanBoard
            leads={leads}
            templates={templates}
            vendedores={vendedores}
            onAssignVendedor={handleAssignVendedor}
            onMoveStage={handleMoveStage}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
