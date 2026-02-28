'use client';

import { useState, useEffect } from 'react';
import { Truck, Send, Building2, PackageCheck, Mail, Save, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface Proveedor {
    id: string;
    name: string;
    ejecutivo: string | null;
    whatsapp: string | null;
    emailPedidos: string | null;
    instruccionesDropshipping: string | null;
    active: boolean;
}

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedProv, setSelectedProv] = useState<Proveedor | null>(null);

    // Parámetros de envío
    const [pakkeGuide, setPakkeGuide] = useState('');
    const [sku, setSku] = useState('');
    const [qty, setQty] = useState(1);
    const [envioEnProgreso, setEnvioEnProgreso] = useState(false);

    useEffect(() => {
        fetchMainData();
    }, []);

    const fetchMainData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/proveedores');
            const json = await res.json();
            if (json.success) {
                setProveedores(json.data);
            } else if (json.providers) {
                // Fallback or mapped from old logic if using old route
                setProveedores(json.providers);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const testEmailLogic = async () => {
        if (!selectedProv) return;
        setEnvioEnProgreso(true);

        try {
            const res = await fetch(`/api/admin/proveedores/${selectedProv.id}/test-piloto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pakkeGuide, sku, qty })
            });
            const data = await res.json();

            if (data.success) {
                alert('✅ ¡El correo de despacho fue enviado exitosamente (vía SMTP ToneBOX) a ' + selectedProv.emailPedidos + '!');
                setShowTestModal(false);
            } else {
                alert('⚠️ Falla de Servidor SMTP:\n\n' + data.error + '\n\nRevise el archivo .env de su backend y configure SMTP_HOST, USER y PASS.');
            }
        } catch (e: any) {
            alert('Error de conexión enviando correo: ' + e.message);
        } finally {
            setEnvioEnProgreso(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Truck className="w-6 h-6 text-blue-500" />
                            Gestión de Proveedores
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Administración centralizada y Piloto Automático de Dropshipping
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4" />
                        Nuevo Proveedor
                    </button>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {proveedores.map(prov => (
                            <div key={prov.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Building2 className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white leading-tight">{prov.name}</h3>
                                                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${prov.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {prov.active ? 'ACTIVO' : 'INACTIVO'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ejecutivo y WA</p>
                                                <p className="text-sm font-medium text-slate-200">{prov.ejecutivo || 'No registrado'}</p>
                                                <p className="text-xs text-blue-400 mt-0.5">{prov.whatsapp || 'Sin WhatsApp'}</p>
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Pedidos</p>
                                                <p className="text-sm font-medium text-slate-200 break-all">{prov.emailPedidos || 'No configurado'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 mt-3">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                <PackageCheck className="w-3 h-3 text-amber-500" />
                                                Reglas Dropshipping
                                            </p>
                                            <p className="text-sm text-amber-100/80 italic">{prov.instruccionesDropshipping || 'Sin instrucciones adicionales...'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center gap-3">
                                    <button
                                        onClick={() => { if (prov.emailPedidos) { setSelectedProv(prov); setShowTestModal(true); } else { alert('⚠️ Error: Debes configurar un Email de Pedidos antes de enviar.'); } }}
                                        disabled={!prov.emailPedidos}
                                        className={`flex-1 flex items-center justify-center gap-2 font-medium py-2 rounded-lg text-sm transition-colors border ${prov.emailPedidos
                                                ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed grayscale'
                                            }`}
                                    >
                                        <Send className={`w-4 h-4 ${prov.emailPedidos ? 'text-blue-400' : 'text-slate-600'}`} />
                                        {prov.emailPedidos ? 'Enviar Pedido' : 'Configurar Email'}
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-slate-300 font-medium py-2 rounded-lg text-sm transition-colors border border-slate-800">
                                        <Save className="w-4 h-4" /> Editar Info
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Explicación de Lógica en Slate */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-8">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5" /> Arquitectura del Piloto Automático SMTP
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
                        La lógica base enviará un correo utilizando un servidor SMTP seguro asociado a <strong>pedidos@tonebox.com.mx</strong> con copia (CC) a <strong>hola@tonebox.com.mx</strong>. El cuerpo del correo mapeará de forma dinámica los campos del pedido (SKU, Cantidad, Guía Pakke y las Instrucciones estipuladas de dropshipping). Si falla, te recordará amablemente actualizar tu `.env`.
                    </p>
                </div>

                {/* Modal Simulado y de Disparo Real */}
                {showTestModal && selectedProv && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Send className="w-5 h-5 text-blue-500" /> Disparar Pedido a {selectedProv.name}
                            </h2>

                            <div className="space-y-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Ej. TON-BRO-1234"
                                    value={sku}
                                    onChange={e => setSku(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Cantidad (ej. 1)"
                                    value={qty}
                                    onChange={e => setQty(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Número de Guía Pakke (opcional)"
                                    value={pakkeGuide}
                                    onChange={e => setPakkeGuide(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono space-y-2">
                                    <p><span className="text-slate-500">From:</span> pedidos@tonebox.com.mx</p>
                                    <p><span className="text-slate-500">To:</span> {selectedProv.emailPedidos || 'No configurado'}</p>
                                    <p><span className="text-slate-500">CC:</span> hola@tonebox.com.mx</p>
                                    <p><span className="text-slate-500">Subject:</span> [URGENTE] Nuevo Pedido ToneBOX - Dropshipping</p>
                                    <hr className="border-slate-800" />
                                    <p>{selectedProv.instruccionesDropshipping}</p>
                                    <p>SKU: {sku || '...'} | Cantidad: {qty}</p>
                                    <p>Guía: {pakkeGuide || 'Sin guía cargada'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => setShowTestModal(false)} className="px-4 py-2 hover:bg-slate-700 rounded-lg text-sm text-slate-300 font-medium">Cancelar</button>
                                <button
                                    onClick={testEmailLogic}
                                    disabled={envioEnProgreso || !selectedProv.emailPedidos}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {envioEnProgreso ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Confirmar y Enviar Real
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
