'use client';

import { PipelineLead, Vendedor, PipelineStage } from '../lib/zod';
import LeadCard from './LeadCard';

interface Template { name: string; subtitle: string; emoji: string; template: string; }
type Templates = { A: Template; B: Template; C: Template };

interface KanbanBoardProps {
    leads: PipelineLead[];
    templates: Templates;
    vendedores: Vendedor[];
    onAssignVendedor: (leadId: string, vendedorId: string) => Promise<void>;
    onMoveStage: (leadId: string, stage: PipelineStage, templateUsed?: string) => Promise<void>;
}

export default function KanbanBoard({ leads, templates, vendedores, onAssignVendedor, onMoveStage }: KanbanBoardProps) {
    const columns: { id: PipelineStage; label: string; color: string; border: string }[] = [
        { id: 'prospecto', label: 'Prospectos', color: 'bg-slate-100', border: 'border-slate-300' },
        { id: 'contactado', label: 'Contactados', color: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'cotizado', label: 'Cotizados', color: 'bg-amber-50', border: 'border-amber-200' },
        { id: 'cerrado_ganado', label: 'Ganados', color: 'bg-green-50', border: 'border-green-300' },
        { id: 'cerrado_perdido', label: 'Perdidos', color: 'bg-red-50', border: 'border-red-200' }
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-[600px]">
            {columns.map(col => {
                const colLeads = leads.filter(l => l.stage === col.id);

                return (
                    <div key={col.id} className={`flex-shrink-0 w-80 rounded-2xl border ${col.border} ${col.color} p-4 flex flex-col h-full`}>
                        {/* Header Column */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">{col.label}</h3>
                            <span className="bg-white text-slate-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                {colLeads.length}
                            </span>
                        </div>

                        {/* Cards Area */}
                        <div className="flex-1 overflow-y-auto space-y-3 pb-8 scrollbar-hide">
                            {colLeads.map(lead => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    templates={templates}
                                    vendedores={vendedores}
                                    onAssignVendedor={onAssignVendedor}
                                    onMoveStage={onMoveStage}
                                />
                            ))}

                            {colLeads.length === 0 && (
                                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-semibold">
                                    Sin Registros
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
