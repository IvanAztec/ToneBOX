'use client';

import React, { useState, useRef } from 'react';
import {
    CreditCard, Landmark, CheckCircle2, ShieldCheck, Zap,
    Upload, Copy, ExternalLink, Loader2, Check, AlertCircle, FileText,
    PackageSearch, ArrowLeft,
} from 'lucide-react';

interface PaymentGatewayProps {
    basePrice: number;
    productName?: string;
    clientName?: string;
    clientContact?: string;
    userId?: string;
    availabilityStatus?: 'IN_STOCK' | 'ON_DEMAND' | 'OUT_OF_STOCK';
}

const BANK_INFO = {
    clabe: '012180004567890123',
    clabeFormatted: '0121 8000 4567 8901 23',
    bank: 'BBVA Bancomer',
    beneficiary: 'ToneBOX México S.A. de C.V.',
};

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
    basePrice,
    productName = 'Duo Pack ToneBOX',
    clientName,
    clientContact,
    userId,
    availabilityStatus = 'IN_STOCK',
}) => {
    const [method, setMethod] = useState<'card' | 'spei'>('card');
    const [speiStep, setSpeiStep] = useState<'info' | 'upload' | 'confirmed'>('info');
    const [trackingKey, setTrackingKey] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [copiedClabe, setCopiedClabe] = useState(false);
    const [copiedFolio, setCopiedFolio] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ folio: string; paymentId: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // SPEI elimina el 1.04 de comisión operativa: speiPrice = publicPrice / 1.04
    const speiPrice      = parseFloat((basePrice / 1.04).toFixed(2));
    const discountAmount = method === 'spei' ? parseFloat((basePrice - speiPrice).toFixed(2)) : 0;
    const finalPrice     = method === 'spei' ? speiPrice : basePrice;

    const handleCopy = async (text: string, type: 'clabe' | 'folio') => {
        await navigator.clipboard.writeText(text);
        if (type === 'clabe') { setCopiedClabe(true); setTimeout(() => setCopiedClabe(false), 2000); }
        else { setCopiedFolio(true); setTimeout(() => setCopiedFolio(false), 2000); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadedFile(file);
    };

    const handleSpeiConfirm = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('productName', productName);
            formData.append('amount', finalPrice.toString());
            if (clientName) formData.append('clientName', clientName);
            if (clientContact) formData.append('clientContact', clientContact);
            if (userId) formData.append('userId', userId);
            if (trackingKey) formData.append('trackingKey', trackingKey);
            if (uploadedFile) formData.append('receipt', uploadedFile);

            const res = await fetch('/api/payments/spei/confirm', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setResult({ folio: data.folio, paymentId: data.paymentId });
                setSpeiStep('confirmed');
            }
        } catch {
            setSpeiStep('confirmed'); // No bloquear al cliente si hay error de red
        } finally {
            setLoading(false);
        }
    };

    // ── Estado vacío: ningún bundle seleccionado ──────────────────────────────
    if (basePrice === 0) {
        return (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 border border-gray-100 p-8 flex flex-col items-center justify-center text-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
                    <PackageSearch className="w-8 h-8 text-green-500" />
                </div>
                <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                    Checkout ToneBOX
                </span>
                <h3 className="text-xl font-black text-gray-900 mb-2">Elige tu Duo Pack</h3>
                <p className="text-sm text-gray-500 font-medium max-w-[220px] leading-relaxed">
                    Selecciona un <strong className="text-gray-800">Bundle Compatible</strong> del panel para ver el precio y completar tu pedido.
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-green-600 text-xs font-black">
                    <ArrowLeft className="w-3.5 h-3.5" /> Elige tu bundle a la izquierda
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">

            {/* ── Resumen de Orden ── */}
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-600" /> Checkout ToneBOX
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate max-w-[200px]">{productName}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0">
                        SSL Activo
                    </span>
                </div>

                {/* ── Banner ON_DEMAND ── */}
                {availabilityStatus === 'ON_DEMAND' && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-black text-amber-800">Producto Bajo Demanda</p>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                Este producto se consigue por encargo. Tu pedido se procesará y despacharemos
                                en cuanto confirmemos disponibilidad con el proveedor.
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Precio de Lista (TC/CC)</span>
                        <span className="text-gray-900 font-bold">${basePrice.toFixed(2)} MXN</span>
                    </div>
                    {method === 'spei' && (
                        <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                Beneficio VIP · SPEI <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded">-4%</span>
                            </span>
                            <span className="text-green-600 font-bold">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-gray-900 font-black">Total a Pagar</span>
                        <span className="text-2xl font-black text-gray-900">${finalPrice.toFixed(2)} MXN</span>
                    </div>
                </div>
            </div>

            <div className="p-8">

                {/* ── Selector de Método (solo en pasos info) ── */}
                {speiStep !== 'confirmed' && (
                    <>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
                            Método de Pago
                        </label>
                        <div className="grid gap-3 mb-8">
                            {/* Tarjeta */}
                            <button onClick={() => { setMethod('card'); setSpeiStep('info'); }}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'card' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
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
                            <button onClick={() => setMethod('spei')}
                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all relative ${method === 'spei' ? 'border-green-600 bg-green-50/30' : 'border-gray-100 hover:border-green-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'spei' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Transferencia SPEI</p>
                                        <p className="text-xs text-green-600 font-black">Ahorra un 4% adicional — ${(basePrice - basePrice / 1.04).toFixed(2)} MXN menos</p>
                                    </div>
                                </div>
                                {method === 'spei'
                                    ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    : <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded absolute top-2 right-2">RECOMENDADO VIP</span>}
                            </button>
                        </div>
                    </>
                )}

                {/* ── TARJETA: Botón Stripe ── */}
                {method === 'card' && (
                    <button className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95">
                        Proceder al Pago Seguro →
                    </button>
                )}

                {/* ── SPEI: Datos bancarios ── */}
                {method === 'spei' && speiStep === 'info' && (
                    <div className="p-6 bg-gray-900 rounded-2xl text-white space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                            <p className="text-sm font-bold">Beneficio VIP Activado</p>
                        </div>

                        {/* Datos bancarios */}
                        <div className="bg-white/5 rounded-xl p-4 space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Banco</span>
                                <span className="font-bold">{BANK_INFO.bank}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Beneficiario</span>
                                <span className="font-bold">{BANK_INFO.beneficiary}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                <span className="text-gray-500">CLABE</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-green-400">{BANK_INFO.clabeFormatted}</span>
                                    <button onClick={() => handleCopy(BANK_INFO.clabe, 'clabe')} className="text-gray-400 hover:text-white transition-colors p-1">
                                        {copiedClabe ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Monto</span>
                                <span className="font-bold text-white">${finalPrice.toFixed(2)} MXN</span>
                            </div>
                        </div>

                        {/* ── LEYENDA OBLIGATORIA ── */}
                        <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/40 rounded-xl p-4">
                            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-200 leading-relaxed">
                                <strong className="text-yellow-300">IMPORTANTE:</strong>{' '}
                                Para procesar tu pedido, es obligatorio incluir el número de folio
                                de tu orden en el concepto de tu transferencia.
                            </p>
                        </div>

                        <button onClick={() => setSpeiStep('upload')}
                            className="w-full bg-green-500 text-black py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-green-400 transition-all active:scale-95">
                            <Upload className="w-4 h-4" /> Ya Transferí — Subir Comprobante
                        </button>
                        <p className="text-[10px] text-gray-500 text-center">Tu pedido se despachará en cuanto validemos la transferencia.</p>
                    </div>
                )}

                {/* ── SPEI: Subir comprobante + Folio prominente ── */}
                {method === 'spei' && speiStep === 'upload' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">

                        {/* ── Folio de pago — EL ELEMENTO CLAVE ── */}
                        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Concepto de Pago Obligatorio
                            </p>

                            {/* Leyenda obligatoria */}
                            <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3">
                                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-200 leading-relaxed">
                                    Para procesar tu pedido, es obligatorio incluir el número de folio
                                    de tu orden en el concepto de tu transferencia.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-[11px] mb-1">Tu folio se asigna al confirmar abajo</p>
                                    <p className="text-white font-black text-3xl tracking-tight"
                                        style={{ fontFeatureSettings: '"tnum"' }}>
                                        TB-####
                                    </p>
                                    <p className="text-gray-400 text-[11px] mt-1">
                                        Copia el folio y agrégalo en el concepto de tu SPEI.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCopy('TB-####', 'folio')}
                                    className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-xl">
                                    {copiedFolio ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
                                    <span className="text-[9px] text-gray-400 font-bold">COPIAR</span>
                                </button>
                            </div>
                        </div>

                        {/* Upload */}
                        <button type="button" onClick={() => fileRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all text-center ${uploadedFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                            {uploadedFile ? (
                                <div className="flex items-center justify-center gap-2 text-green-700">
                                    <FileText className="w-5 h-5" />
                                    <p className="text-sm font-bold">{uploadedFile.name}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">Subir comprobante (PDF, JPG o PNG)</p>
                                </>
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                            <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-bold">o pega tu clave de rastreo</span></div>
                        </div>

                        <input type="text" placeholder="Ej: 2024021012345678901234567890"
                            value={trackingKey} onChange={e => setTrackingKey(e.target.value)}
                            className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-gray-900 transition-colors" />

                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                            <p>Verifica tu transferencia en{' '}
                                <a href="https://www.banxico.org.mx/cep/" target="_blank" rel="noreferrer"
                                    className="text-blue-500 font-bold underline inline-flex items-center gap-0.5">
                                    banxico.org.mx/cep/ <ExternalLink className="w-3 h-3" />
                                </a>
                            </p>
                        </div>

                        <button onClick={handleSpeiConfirm}
                            disabled={loading || (!trackingKey && !uploadedFile)}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Confirmar y Generar Folio de Pago
                        </button>
                    </div>
                )}

                {/* ── Pantalla de confirmación con Folio real ── */}
                {speiStep === 'confirmed' && (
                    <div className="text-center py-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="font-black text-gray-900 text-xl mb-1">¡Comprobante Recibido!</h3>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto mb-6">
                            Tu asesor ToneBOX validará la transferencia y confirmará el despacho. Recibirás notificación por WhatsApp.
                        </p>

                        {/* Folio prominente en confirmación */}
                        {result?.folio && (
                            <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Folio de Seguimiento</p>
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-gray-900 text-3xl tracking-tight">{result.folio}</span>
                                    <button onClick={() => handleCopy(result.folio, 'folio')}
                                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 px-3 py-2 rounded-xl">
                                        {copiedFolio ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedFolio ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">Guarda este folio para rastrear tu pedido.</p>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-left space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Producto</span>
                                <span className="font-bold text-gray-700">{productName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Monto</span>
                                <span className="font-bold text-gray-700">${finalPrice.toFixed(2)} MXN</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Estatus</span>
                                <span className="text-yellow-600 font-bold">PENDIENTE VALIDACIÓN</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentGateway;
