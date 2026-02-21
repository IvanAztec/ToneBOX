'use client';

import React, { useState } from 'react';
import { CreditCard, Landmark, CheckCircle2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

interface PaymentGatewayProps {
    basePrice: number;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ basePrice }) => {
    const [method, setMethod] = useState<'card' | 'spei'>('card');
    const discountRate = 0.04;
    const discountAmount = method === 'spei' ? basePrice * discountRate : 0;
    const finalPrice = basePrice - discountAmount;

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all duration-500">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-600" /> Checkout Inteligente
                    </h3>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Security SSL Active
                    </span>
                </div>

                {/* Resumen de Orden */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Precio de Lista (TC/CC)</span>
                        <span className="text-gray-900 font-bold">${basePrice.toFixed(2)}</span>
                    </div>
                    {method === 'spei' && (
                        <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                Descuento Pago Preferente VIP <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded italic">(-4%)</span>
                            </span>
                            <span className="text-green-600 font-bold">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-gray-900 font-black">Total a Pagar</span>
                        <span className="text-2xl font-black text-gray-900">${finalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
                    Selecciona tu Método de Pago
                </label>

                <div className="grid gap-4">
                    {/* Opción Tarjeta */}
                    <button
                        onClick={() => setMethod('card')}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${method === 'card'
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === 'card' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                }`}>
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Tarjeta Débito / Crédito</p>
                                <p className="text-xs text-gray-500">Pago Estándar (Stripe)</p>
                            </div>
                        </div>
                        {method === 'card' && <CheckCircle2 className="w-6 h-6 text-gray-900" />}
                    </button>

                    {/* Opción SPEI */}
                    <button
                        onClick={() => setMethod('spei')}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all relative group overflow-hidden ${method === 'spei'
                                ? 'border-green-600 bg-green-50/30'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === 'spei' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                }`}>
                                <Landmark className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Transferencia SPEI</p>
                                <p className="text-xs text-green-600 font-black flex items-center gap-1">
                                    Beneficio VIP: -4% de Ahorro
                                </p>
                            </div>
                        </div>
                        {method === 'spei' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded absolute top-2 right-2 group-hover:scale-105 transition-transform">
                                RECOMENDADO VIP
                            </span>
                        )}
                    </button>
                </div>

                {/* Instrucciones Post-Selección */}
                <div className="mt-8">
                    {method === 'spei' ? (
                        <div className="p-6 bg-gray-900 rounded-2xl text-white animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                <p className="text-sm font-bold">Has activado tu beneficio de Cliente VIP</p>
                            </div>
                            <div className="space-y-2 mb-6 font-mono text-xs text-gray-300">
                                <p>Banco: CLABE INTERBANCARIA</p>
                                <p>Cuenta: 0121 8000 4567 8901 23</p>
                                <p>Beneficiario: ToneBOX México</p>
                                <p>Concepto: ORDER-4592</p>
                            </div>
                            <button className="w-full bg-green-500 text-black py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-green-400 transition-all">
                                <MessageSquare className="w-4 h-4" /> Enviar comprobante por WhatsApp
                            </button>
                            <p className="text-[10px] text-gray-500 mt-4 text-center">
                                Despacho inmediato tras validación de comprobante.
                            </p>
                        </div>
                    ) : (
                        <button className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all">
                            Proceder al Pago Seguro
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
