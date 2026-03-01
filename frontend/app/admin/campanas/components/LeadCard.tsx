'use client';

import { useState } from 'react';
import {
    MessageCircle,
    ChevronDown,
    ChevronUp,
    Building2,
    Package,
    Loader2,
    UserPlus
} from 'lucide-react';
import { PipelineLead, Vendedor, PipelineStage } from '../lib/zod';

interface Template { name: string; subtitle: string; emoji: string; template: string; }
type Templates = { A: Template; B: Template; C: Template };

// ── Helpers ───────────────────────────────────────────────────────────────────
function interpolate(tpl: string, vars: Record<string, string>) {
    return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v || ''), tpl);
}

function buildVars(lead: PipelineLead, today: Date) {
    const daysAgo = lead.daysRemaining <= 0 ? String(Math.abs(lead.daysRemaining)) : '0';
    return {
        nombre: lead.user.name ?? 'Cliente',
        empresa: lead.user.empresa ?? 'tu empresa',
        modelo: lead.product.sku,
        impresora: 'tu impresora',
        daysRemaining: String(lead.daysRemaining > 0 ? lead.daysRemaining : 0),
        daysAgo,
    };
}

function segmentLabel(days: number) {
    if (days <= 0) return { label: 'AGOTADO', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
    if (days <= 3) return { label: `${days}d URGENTE`, color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' };
    if (days <= 10) return { label: `${days}d CRÍTICO`, color: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
    return { label: `${days}d`, color: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' };
}

interface LeadCardProps {
    lead: PipelineLead;
    templates: Templates;
    vendedores: Vendedor[];
    onAssignVendedor: (leadId: string, vendedorId: string) => Promise<void>;
    onMoveStage: (leadId: string, stage: PipelineStage, templateUsed?: string) => Promise<void>;
}

export default function LeadCard({ lead, templates, vendedores, onAssignVendedor, onMoveStage }: LeadCardProps) {
    const today = new Date();
    const [selectedTpl, setSelectedTpl] = useState<'A' | 'B' | 'C'>('A');
    const [expanded, setExpanded] = useState(false);
    const [firing, setFiring] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const segment = segmentLabel(lead.daysRemaining);
    const vars = buildVars(lead, today);
    const tpl = templates[selectedTpl];
    const message = interpolate(tpl.template, vars);
    const waTarget = (lead.user.whatsapp ?? '').replace(/\D/g, '') || '528441628536';
    const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(message)}`;

    const handleFire = async () => {
        setFiring(true);
        window.open(waUrl, '_blank');

        // Si estaba como prospecto, al disparar el WhatsApp asume etapa 'contactado' automáticamente
        if (lead.stage === 'prospecto') {
            await onMoveStage(lead.id, 'contactado', selectedTpl);
        }

        setTimeout(() => setFiring(false), 1500);
    };

    const handleVendedorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAssigning(true);
        try {
            await onAssignVendedor(lead.id, e.target.value);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${segment.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${segment.dot}`} />
                        {segment.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        {lead.product.sku}
                    </span>
                    <button
                        onClick={() => setExpanded(p => !p)}
                        className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="px-4 py-3 flex-1 flex flex-col gap-3">
                {/* User Info */}
                <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight truncate">{lead.user.name}</p>
                    {lead.user.empresa && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" /> {lead.user.empresa}
                        </p>
                    )}
                </div>

                {/* Asignación de Vendedor */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                        value={lead.vendedor_id ?? ''}
                        onChange={handleVendedorChange}
                        disabled={assigning}
                        className="bg-transparent text-xs font-medium text-slate-700 w-full focus:outline-none focus:ring-0 disabled:opacity-50"
                    >
                        <option value="">Sin asignar</option>
                        {vendedores.map(v => (
                            <option key={v.id} value={v.id}>{v.nombre}</option>
                        ))}
                    </select>
                    {assigning && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </div>

                {/* Template selector + preview */}
                {expanded && (
                    <div className="space-y-3 mt-2 pt-3 border-t border-slate-100">
                        <div className="flex gap-1">
                            {(['A', 'B', 'C'] as const).map(key => {
                                const t = templates[key];
                                const isSel = key === selectedTpl;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedTpl(key)}
                                        className={`flex-1 text-center py-1.5 rounded-lg border transition-all ${isSel
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="text-sm leading-none block">{t.emoji}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                            <p className="text-[10px] font-bold text-slate-500 mb-1">Preview {selectedTpl}: {tpl.name}</p>
                            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{message}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Area */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 mt-auto">
                {lead.stage === 'cerrado_ganado' || lead.stage === 'cerrado_perdido' ? (
                    <div className={`text-center py-1.5 rounded-lg text-xs font-bold border ${lead.stage === 'cerrado_ganado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {lead.stage.replace('_', ' ').toUpperCase()}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFire}
                            disabled={firing}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-70 text-xs"
                        >
                            {firing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                            {firing ? 'Abriendo...' : `WhatsApp`}
                        </button>
                        <select
                            value={lead.stage}
                            onChange={(e) => onMoveStage(lead.id, e.target.value as PipelineStage)}
                            className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="prospecto">Prospecto</option>
                            <option value="contactado">Contactado</option>
                            <option value="cotizado">Cotizado</option>
                            <option value="cerrado_ganado">¡Ganado!</option>
                            <option value="cerrado_perdido">Perdido</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
