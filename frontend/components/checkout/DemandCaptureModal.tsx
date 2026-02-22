'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Mail, Phone, Search, Loader2 } from 'lucide-react';

interface DemandCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelQuery: string; // Ej: "TN-770" o "Brother L8900"
}

const DemandCaptureModal: React.FC<DemandCaptureModalProps> = ({ isOpen, onClose, modelQuery }) => {
    const [form, setForm] = useState({ name: '', contact: '', contactType: 'whatsapp' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/catalog/demand-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, query: modelQuery }),
            });
            setSubmitted(true);
        } catch {
            // Fallback: still mark as submitted for UX
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gray-900 p-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-white text-xl font-black tracking-tight">Rastreando tu Modelo</h2>
                    <p className="text-gray-400 text-sm mt-1 font-mono">"{modelQuery}"</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    {submitted ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-black text-gray-900 text-lg mb-2">¡Alerta Activada!</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Estamos consultando con nuestros mayoristas directos. Un asesor te contactará en cuanto confirmemos disponibilidad y precio.
                            </p>
                            <button onClick={onClose} className="mt-6 w-full bg-gray-900 text-white py-3 rounded-xl font-black text-sm hover:bg-gray-800 transition-all">
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                Estamos rastreando este modelo con nuestros mayoristas directos para garantizarte el mejor precio. Déjanos tu contacto y un asesor te enviará la cotización formal en cuanto confirmemos disponibilidad.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Tu Nombre</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ej. Carlos Leal"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-gray-900 transition-colors"
                                    />
                                </div>

                                {/* Selector de tipo de contacto */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Recibir Cotización por</label>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, contactType: 'whatsapp' })}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-bold ${form.contactType === 'whatsapp' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <Phone className="w-4 h-4" /> WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, contactType: 'email' })}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-bold ${form.contactType === 'email' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <Mail className="w-4 h-4" /> Email
                                        </button>
                                    </div>
                                    <input
                                        required
                                        type={form.contactType === 'email' ? 'email' : 'tel'}
                                        placeholder={form.contactType === 'whatsapp' ? '+52 81 1234 5678' : 'tu@empresa.com'}
                                        value={form.contact}
                                        onChange={e => setForm({ ...form, contact: e.target.value })}
                                        className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-gray-900 transition-colors"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                    Activar Alerta de Disponibilidad
                                </button>
                                <p className="text-[10px] text-gray-400 text-center">Sin spam. Solo te contactamos cuando tengamos tu cotización lista.</p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DemandCaptureModal;
