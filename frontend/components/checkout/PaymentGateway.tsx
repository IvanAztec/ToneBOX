'use client';

import React, { useState, useRef } from 'react';
import {
    CreditCard, Landmark, CheckCircle2, ShieldCheck, Zap,
    Upload, Copy, ExternalLink, Loader2, AlertCircle, Check
} from 'lucide-react';

interface PaymentGatewayProps {
    basePrice: number;
    orderId?: string;
    productName?: string;
}

const BANK_INFO = {
    clabe: '012180004567890123',
    clabeFormatted: '0121 8000 4567 8901 23',
    bank: 'BBVA Bancomer',
    beneficiary: 'ToneBOX México S.A. de C.V.',
    rfc: 'TME-240101-XXX',
};

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ basePrice, orderId = 'ORDER-001', productName = 'Duo Pack' }) => {
    const [method, setMethod] = useState<'card' | 'spei'>('card');
    const [speiStep, setSpeiStep] = useState<'info' | 'upload' | 'confirmed'>('info');
    const [trackingKey, setTrackingKey] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const discountRate = 0.04;
    const discountAmount = method === 'spei' ? basePrice * discountRate : 0;
    const finalPrice = basePrice - discountAmount;

    const handleCopyClabe = async () => {
        await navigator.clipboard.writeText(BANK_INFO.clabe);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadedFile(file);
    };

    const handleSpeiConfirm = async () => {
        if (!trackingKey && !uploadedFile) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('trackingKey', trackingKey);
        formData.append('amount', finalPrice.toString());
        formData.append('productName', productName);
        if (uploadedFile) formData.append('receipt', uploadedFile);

        try {
            await fetch('/api/payments/spei/confirm', {
                method: 'POST',
                body: formData,
            });
            setSpeiStep('confirmed');
        } catch {
            // En caso de error, igual mostrar confirmación (no bloquear al cliente)
            setSpeiStep('confirmed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all duration-500">
            {/* Resumen del Pedido */}
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-600" /> Checkout Inteligente
                    </h3>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        SSL Activo
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Precio de Lista (TC/CC)</span>
                        <span className="text-gray-900 font-bold">${basePrice.toFixed(2)}</span>
                    </div>
                    {method === 'spei' && (
                        <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                Beneficio VIP · SPEI <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded italic">-4%</span>
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
                {/* Selector de Método */}
                {speiStep !== 'confirmed' && (
                    <>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
                            Método de Pago
                        </label>
                        <div className="grid gap-3 mb-8">
                            {/* Tarjeta */}
                            <button
                                onClick={() => { setMethod('card'); setSpeiStep('info'); }}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${method === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === 'card' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Tarjeta Débito / Crédito</p>
                                        <p className="text-xs text-gray-500">Pago Estándar — procesado por Stripe</p>
                                    </div>
                                </div>
                                {method === 'card' && <CheckCircle2 className="w-6 h-6 text-gray-900" />}
                            </button>

                            {/* SPEI */}
                            <button
                                onClick={() => setMethod('spei')}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all relative group overflow-hidden ${method === 'spei' ? 'border-green-600 bg-green-50/30' : 'border-gray-100 hover:border-green-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${method === 'spei' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Transferencia SPEI</p>
                                        <p className="text-xs text-green-600 font-black">Beneficio VIP: Ahorras ${(basePrice * 0.04).toFixed(2)}</p>
                                    </div>
                                </div>
                                {method === 'spei' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : (
                                    <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded absolute top-2 right-2">
                                        RECOMENDADO VIP
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Panel por método */}
                {method === 'card' && (
                    <button className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95">
                        Proceder al Pago Seguro →
                    </button>
                )}

                {method === 'spei' && speiStep === 'info' && (
                    <div className="p-6 bg-gray-900 rounded-2xl text-white space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                            <p className="text-sm font-bold">Has activado tu Beneficio de Cliente VIP</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 space-y-2 font-mono text-xs text-gray-300">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Banco</span>
                                <span>{BANK_INFO.bank}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Beneficiario</span>
                                <span>{BANK_INFO.beneficiary}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/10 pt-2">
                                <span className="text-gray-500">CLABE</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">{BANK_INFO.clabeFormatted}</span>
                                    <button onClick={handleCopyClabe} className="text-gray-400 hover:text-white transition-colors">
                                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Concepto</span>
                                <span className="text-yellow-400 font-bold">{orderId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Monto exacto</span>
                                <span className="text-white font-bold">${finalPrice.toFixed(2)} MXN</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSpeiStep('upload')}
                            className="w-full bg-green-500 text-black py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-green-400 transition-all active:scale-95"
                        >
                            <Upload className="w-4 h-4" /> Ya transferí — Subir Comprobante
                        </button>
                        <p className="text-[10px] text-gray-500 text-center">Tu pedido se despachará en cuanto validemos el comprobante.</p>
                    </div>
                )}

                {method === 'spei' && speiStep === 'upload' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                            <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">Adjunta tu Comprobante de Pago</p>
                            <p className="text-[11px] text-blue-600">PDF, JPG o PNG — máximo 5MB</p>
                        </div>

                        {/* Upload Area */}
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all text-center ${uploadedFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
                            {uploadedFile ? (
                                <div className="flex items-center justify-center gap-2 text-green-700">
                                    <Check className="w-5 h-5" />
                                    <p className="text-sm font-bold">{uploadedFile.name}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">Haz clic para subir comprobante</p>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                            <div className="relative flex justify-center"><span className="px-4 bg-white text-xs text-gray-400 font-bold">o pega tu clave de rastreo</span></div>
                        </div>

                        <input
                            type="text"
                            placeholder="Ej: 2024021012345678901234567890"
                            value={trackingKey}
                            onChange={e => setTrackingKey(e.target.value)}
                            className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-gray-900 transition-colors"
                        />

                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Puedes verificar tu transferencia en <a href="https://www.banxico.org.mx/cep/" target="_blank" rel="noreferrer" className="text-blue-500 font-bold underline inline-flex items-center gap-0.5">banxico.org.mx/cep/ <ExternalLink className="w-3 h-3" /></a></p>
                        </div>

                        <button
                            onClick={handleSpeiConfirm}
                            disabled={loading || (!trackingKey && !uploadedFile)}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Confirmar Pago y Despachar Pedido
                        </button>
                    </div>
                )}

                {speiStep === 'confirmed' && (
                    <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-black text-gray-900 text-xl mb-2">¡Comprobante Recibido!</h3>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                            Tu asesor ToneBOX validará la transferencia y confirmará el despacho de inmediato. Recibirás una notificación por WhatsApp.
                        </p>
                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-left space-y-1 font-mono text-xs text-gray-500">
                            <p>Orden: <span className="text-gray-900 font-bold">{orderId}</span></p>
                            <p>Monto: <span className="text-gray-900 font-bold">${finalPrice.toFixed(2)} MXN</span></p>
                            <p>Estatus: <span className="text-green-600 font-bold">PENDIENTE DE VALIDACIÓN</span></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentGateway;
