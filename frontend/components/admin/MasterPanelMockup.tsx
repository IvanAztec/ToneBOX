'use client';

import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    TrendingUp,
    Settings,
    PlusCircle,
    ExternalLink,
    AlertCircle,
    BarChart3,
    MousePointer2
} from 'lucide-react';

const MasterPanelMockup = () => {
    const [activeProject, setActiveProject] = useState('ToneBOX');

    // Simulated Data
    const projects = ['ToneBOX', 'Project #2 (Draft)', 'Project #3'];
    const analytics = {
        visits: 1250,
        clicks: 185,
        sales: 42
    };

    const upcomingSales = [
        { name: 'Despacho Garza', model: 'Brother L2540', days: 3, status: 'Urgent' },
        { name: 'Hospital Sta. Fe', model: 'Zebra Labeler', days: 5, status: 'Warning' },
        { name: 'Restaurante Central', model: 'Epson TM-T88', days: 7, status: 'Normal' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            {/* Sidebar / Top Nav */}
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-black">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            MASTER ORCHESTRATOR <span className="text-green-500 text-sm font-bold bg-green-500/10 px-2 py-1 rounded">v2.1</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 capitalize">Iván's Multi-SaaS Control Center</p>
                    </div>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                        {projects.map(p => (
                            <button
                                key={p}
                                onClick={() => setActiveProject(p)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeProject === p ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button className="px-4 py-2 text-gray-500 hover:text-green-400 transition-colors">
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Global Metrics & Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-green-500/50 transition-all">
                        <p className="text-gray-500 text-xs font-black uppercase mb-2">Ventas Totales (ToneBOX)</p>
                        <h2 className="text-4xl font-black">$42,590.00</h2>
                        <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold">
                            <TrendingUp className="w-4 h-4" /> +15.5% vs Semana Pasada
                        </div>
                    </div>

                    {/* Funnel Widget */}
                    <div className="lg:col-span-3 bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Embudo de Conversión Real</h3>
                            <BarChart3 className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-around gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-black">{analytics.visits}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Visitas Web</p>
                            </div>
                            <div className="h-0.5 flex-1 bg-gradient-to-r from-green-500/50 via-transparent to-transparent mb-4" />
                            <div className="text-center">
                                <p className="text-3xl font-black text-green-400">{analytics.clicks}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Click WhatsApp VIP</p>
                                <span className="text-[10px] text-green-500/80 italic font-bold">14.8% Conv.</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-gradient-to-r from-green-500/50 via-transparent to-transparent mb-4" />
                            <div className="text-center">
                                <p className="text-3xl font-black">{analytics.sales}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Ventas Cerradas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CRM T-7 & Marketing Config */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CRM Próximas Ventas */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black tracking-tight">Vigilancia de Consumo (Ciclo T-7)</h3>
                            <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded">3 ALERTAS PENDIENTES</span>
                        </div>
                        <div className="space-y-4">
                            {upcomingSales.map(sale => (
                                <div key={sale.name} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${sale.status === 'Urgent' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                                            }`}>
                                            {sale.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{sale.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">{sale.model}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm font-black italic">Agotamiento en {sale.days} días</p>
                                            <p className={`text-[10px] font-bold ${sale.status === 'Urgent' ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>ESTADO: {sale.status.toUpperCase()}</p>
                                        </div>
                                        <button className="bg-green-500 text-black p-2 rounded-xl hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20">
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Marketing Config Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
                        <h3 className="text-lg font-black tracking-tight mb-2">Marketing & Tracking</h3>
                        <p className="text-xs text-gray-500 mb-6">Configuración global por Proyecto</p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Google Ads Tracking ID</label>
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-3 items-center gap-3">
                                    <MousePointer2 className="w-4 h-4 text-green-500" />
                                    <input type="text" placeholder="AW-10293..." className="bg-transparent outline-none text-xs w-full font-bold" defaultValue="AW-123456789" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">FB Pixel / CAPI Token</label>
                                <div className="flex bg-white/5 border border-white/10 rounded-xl p-3 items-center gap-3">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <input type="text" placeholder="FB-PIXEL-..." className="bg-transparent outline-none text-xs w-full font-bold" defaultValue="FB-987654321" />
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <button className="w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                                    <Settings className="w-4 h-4" /> Guardar Configuración
                                </button>
                                <p className="text-[10px] text-gray-600 mt-4 text-center italic flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Los cambios afectan a Vercel en modo Real-Time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterPanelMockup;
