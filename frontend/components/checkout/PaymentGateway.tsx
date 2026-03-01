'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    CreditCard, Landmark, CheckCircle2, ShieldCheck, Zap,
    Upload, Copy, ExternalLink, Loader2, Check, AlertCircle, FileText,
    PackageSearch, ArrowLeft,
} from 'lucide-react';

interface PaymentGatewayProps {
    basePrice: number;
    productName?: string;
    userId?: string;
    availabilityStatus?: 'IN_STOCK' | 'ON_DEMAND' | 'OUT_OF_STOCK';
    comboType?: string;
}

// Datos bancarios default (se sobreescriben con /api/company-settings)
const BANK_DEFAULTS = {
    clabe: '012180004567890123',
    bank: 'BBVA Bancomer',
    beneficiary: 'ToneBOX México S.A. de C.V.',
};

const WA_NUMBER = '528441628536';

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
    basePrice,
    productName = 'Duo Pack ToneBOX',
    userId,
    availabilityStatus = 'IN_STOCK',
    comboType,
}) => {
    const [method, setMethod] = useState<'card' | 'spei'>('card');
    const [speiStep, setSpeiStep] = useState<'info' | 'upload' | 'confirmed'>('info');
    const [trackingKey, setTrackingKey] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [copiedClabe, setCopiedClabe] = useState(false);
    const [copiedFolio, setCopiedFolio] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingFolio, setLoadingFolio] = useState(false);
    const [result, setResult] = useState<{ folio: string; paymentId: string } | null>(null);
    const [preFolio, setPreFolio] = useState<string | null>(null);
    const [preOrderId, setPreOrderId] = useState<string | null>(null);
    const [deliveryMethod, setDeliveryMethod] = useState<'envio' | 'sucursal'>('envio');
    const [contactName, setContactName] = useState('');
    const [contactWA, setContactWA] = useState('');
    const [bankInfo, setBankInfo] = useState(BANK_DEFAULTS);

    // Módulo Fiscal
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [rfc, setRfc] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [regimenFiscal, setRegimenFiscal] = useState('601');
    const [csfFile, setCsfFile] = useState<File | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);
    const csfRef = useRef<HTMLInputElement>(null);

    const TAX_REGIMES = [
        { code: '601', name: 'General de Ley Personas Morales' },
        { code: '603', name: 'Personas Morales con Fines no Lucrativos' },
        { code: '605', name: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
        { code: '606', name: 'Arrendamiento' },
        { code: '607', name: 'Régimen de Enajenación o Adquisición de Bienes' },
        { code: '608', name: 'Demás ingresos' },
        { code: '610', name: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
        { code: '611', name: 'Ingresos por Dividendos (socios y accionistas)' },
        { code: '612', name: 'Personas Físicas con Actividades Empresariales y Profesionales' },
        { code: '614', name: 'Ingresos por Intereses' },
        { code: '615', name: 'Régimen de los ingresos por obtención de premios' },
        { code: '616', name: 'Sin obligaciones fiscales' },
        { code: '621', name: 'Incorporación Fiscal' },
        { code: '622', name: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (AGAPES)' },
        { code: '623', name: 'Opcional para Grupos de Sociedades' },
        { code: '624', name: 'Coordinados' },
        { code: '625', name: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
        { code: '626', name: 'Régimen Simplificado de Confianza (RESICO)' }
    ];

    const hasHardware = comboType === 'BUSINESS_START';

    // Cargar datos bancarios desde CompanySettings
    useEffect(() => {
        fetch('/api/company-settings')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) {
                    setBankInfo({
                        clabe: d.data.clabeNumber || BANK_DEFAULTS.clabe,
                        bank: d.data.bankName || BANK_DEFAULTS.bank,
                        beneficiary: d.data.beneficiario || BANK_DEFAULTS.beneficiary,
                    });
                }
            })
            .catch(() => { });
    }, []);

    const speiPrice = parseFloat((basePrice / 1.04).toFixed(2));
    const discountAmount = method === 'spei' ? parseFloat((basePrice - speiPrice).toFixed(2)) : 0;
    const finalPrice = method === 'spei' ? speiPrice : basePrice;

    const waPickupMsg = encodeURIComponent(
        `Hola ToneBOX, quiero pasar a recoger:\n*${productName}*\nTotal: $${basePrice.toFixed(2)} MXN\nMi nombre: ${contactName || 'Cliente'}\n¿Cuándo puedo pasar?`
    );

    const handleCopy = async (text: string, type: 'clabe' | 'folio') => {
        await navigator.clipboard.writeText(text);
        if (type === 'clabe') { setCopiedClabe(true); setTimeout(() => setCopiedClabe(false), 2000); }
        else { setCopiedFolio(true); setTimeout(() => setCopiedFolio(false), 2000); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadedFile(file);
    };

    // Al seleccionar SPEI: genera el folio real inmediatamente
    const handleSelectSpei = async () => {
        setMethod('spei');
        setSpeiStep('info');
        if (preFolio) return; // ya tenemos folio

        setLoadingFolio(true);
        try {
            const res = await fetch('/api/payments/pre-folio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, amount: speiPrice, userId }),
            });
            const data = await res.json();
            if (data.success) {
                setPreFolio(data.folio);
                setPreOrderId(data.orderId);
            }
        } catch {
            // Folio fallback con timestamp
            setPreFolio(`TB-${Date.now().toString().slice(-4)}`);
        } finally {
            setLoadingFolio(false);
        }
    };

    const handleSpeiConfirm = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('productName', productName);
            formData.append('amount', finalPrice.toString());
            if (contactName) formData.append('clientName', contactName);
            if (contactWA) formData.append('clientContact', contactWA);
            if (userId) formData.append('userId', userId);
            if (trackingKey) formData.append('trackingKey', trackingKey);
            if (preOrderId) formData.append('existingOrderId', preOrderId);
            if (uploadedFile) formData.append('receipt', uploadedFile);

            // Blindaje Fiscal (Prioridad SAT 4.0)
            if (requiresInvoice) {
                formData.append('requiresInvoice', 'true');
                formData.append('rfc', rfc);
                formData.append('razonSocial', razonSocial);
                formData.append('regimenFiscal', regimenFiscal);
                if (csfFile) formData.append('csf', csfFile);
            }

            const res = await fetch('/api/payments/spei/confirm', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setResult({ folio: data.folio, paymentId: data.paymentId });
                setSpeiStep('confirmed');
            }
        } catch {
            setResult({ folio: preFolio || 'TB-####', paymentId: '' });
            setSpeiStep('confirmed');
        } finally {
            setLoading(false);
        }
    };

    if (basePrice === 0) {
        return (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 border border-gray-100 p-8 flex flex-col items-center justify-center text-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
                    <PackageSearch className="w-8 h-8 text-green-500" />
                </div>
                <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                    Checkout ToneBOX
                </span>
                <h3 className="text-xl font-black text-gray-900 mb-2">Elige tu Combo</h3>
                <p className="text-sm text-gray-500 font-medium max-w-[220px] leading-relaxed">
                    Selecciona un <strong className="text-gray-800">Bundle Compatible</strong> del panel para ver el precio y completar tu pedido.
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-green-600 text-xs font-black">
                    <ArrowLeft className="w-3.5 h-3.5" /> Elige tu bundle arriba
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
                    {method === 'spei' && deliveryMethod !== 'sucursal' && (
                        <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                Beneficio VIP · SPEI <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded">-4%</span>
                            </span>
                            <span className="text-green-600 font-bold">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-gray-900 font-black">Total a Pagar</span>
                        <span className="text-2xl font-black text-gray-900">
                            ${deliveryMethod === 'sucursal' ? basePrice.toFixed(2) : finalPrice.toFixed(2)} MXN
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-8">

                {hasHardware && (
                    <div className="mb-6">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">
                            Método de Entrega
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeliveryMethod('envio')}
                                className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${deliveryMethod === 'envio' ? 'border-emerald-500 bg-emerald-50 text-gray-900' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <span className="text-xl">🚚</span>
                                <span>Envío a Domicilio</span>
                                <span className="text-[11px] font-normal text-green-600">Gratis</span>
                            </button>
                            <button
                                onClick={() => { setDeliveryMethod('sucursal'); setMethod('card'); }}
                                className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-sm font-bold ${deliveryMethod === 'sucursal' ? 'border-emerald-500 bg-emerald-50 text-gray-900' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <span className="text-xl">🏢</span>
                                <span>Recoger en Sucursal</span>
                                <span className="text-[11px] font-normal text-green-600">Gratis</span>
                            </button>
                        </div>
                        {deliveryMethod === 'sucursal' && (
                            <div className="mt-3 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <span className="text-lg">📍</span>
                                <div>
                                    <p className="text-sm font-black text-gray-900">Sucursal Principal ToneBOX</p>
                                    <p className="text-xs text-gray-600 mt-0.5">Av. Garza Sada 1234, Col. Del Prado</p>
                                    <p className="text-xs text-gray-500">Monterrey, N.L. · Lun–Vie 9:00–18:00, Sáb 9:00–14:00</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── B. Contact Form ── */}
                <div className="mb-6">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">
                        Tus Datos de Contacto
                    </label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Nombre o Empresa"
                            value={contactName}
                            onChange={e => setContactName(e.target.value)}
                            className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                        />
                        <input
                            type="tel"
                            placeholder="📱 WhatsApp (para confirmar tu pedido)"
                            value={contactWA}
                            onChange={e => setContactWA(e.target.value)}
                            className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 text-center">Sin contraseña · Sin registro · Solo WhatsApp</p>
                </div>

                {/* ── C. Módulo Fiscal ── */}
                <div className="mb-6 p-5 border-2 border-gray-100 rounded-[2rem] bg-gray-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-black text-gray-900">¿Requieres Factura?</span>
                        </div>
                        <button
                            onClick={() => setRequiresInvoice(!requiresInvoice)}
                            className={`w-12 h-6 rounded-full p-1 transition-all ${requiresInvoice ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${requiresInvoice ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {requiresInvoice && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <input
                                type="text"
                                placeholder="RFC (12 o 13 caracteres)"
                                value={rfc}
                                onChange={e => setRfc(e.target.value.toUpperCase())}
                                className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 uppercase font-mono"
                            />
                            <input
                                type="text"
                                placeholder="Razón Social (idéntico a CSF)"
                                value={razonSocial}
                                onChange={e => setRazonSocial(e.target.value.toUpperCase())}
                                className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 uppercase"
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Regimen Fiscal (SAT 4.0)</label>
                                <select
                                    value={regimenFiscal}
                                    onChange={e => setRegimenFiscal(e.target.value)}
                                    className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 appearance-none"
                                >
                                    {TAX_REGIMES.map(r => (
                                        <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => csfRef.current?.click()}
                                className={`w-full border-2 border-dashed rounded-xl p-4 transition-all text-center ${csfFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-400'}`}
                            >
                                <input ref={csfRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setCsfFile(e.target.files?.[0] || null)} />
                                {csfFile ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                                        <Check className="w-4 h-4" />
                                        <span className="text-xs font-bold truncate max-w-[200px]">{csfFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Upload className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 font-bold">Subir Constancia Fiscal (PDF)</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {deliveryMethod === 'sucursal' ? (
                    <a
                        href={`https://wa.me/${WA_NUMBER}?text=${waPickupMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black transition-all hover:-translate-y-0.5 active:scale-95"
                        style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
                    >
                        📱 Confirmar Pedido por WhatsApp
                    </a>
                ) : (
                    <>
                        {speiStep !== 'confirmed' && (
                            <>
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
                                    Método de Pago
                                </label>
                                <div className="grid gap-3 mb-8">
                                    {/* Tarjeta */}
                                    <button
                                        onClick={() => { setMethod('card'); setSpeiStep('info'); }}
                                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${method === 'card'
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'card' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900">Tarjeta Débito / Crédito</p>
                                                <p className="text-xs text-gray-500">Pago Estándar — procesado por Stripe</p>
                                            </div>
                                        </div>
                                        {method === 'card' && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </button>

                                    {/* SPEI */}
                                    <button
                                        onClick={handleSelectSpei}
                                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all relative ${method === 'spei'
                                            ? 'border-emerald-500 bg-emerald-50/30'
                                            : 'border-gray-100 hover:border-emerald-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method === 'spei' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Landmark className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900">Transferencia SPEI</p>
                                                <p className="text-xs text-emerald-600 font-black">
                                                    Ahorra un 4% adicional — ${(basePrice - basePrice / 1.04).toFixed(2)} MXN menos
                                                </p>
                                            </div>
                                        </div>
                                        {method === 'spei' ? (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded absolute top-2 right-2">
                                                RECOMENDADO VIP
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Tarjeta: Botón Stripe */}
                        {method === 'card' && (
                            <button className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95">
                                Proceder al Pago Seguro →
                            </button>
                        )}

                        {/* SPEI: Datos bancarios + Folio real */}
                        {method === 'spei' && speiStep === 'info' && (
                            <div className="p-6 bg-gray-900 rounded-2xl text-white space-y-5 animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                                    <p className="text-sm font-bold">Beneficio VIP Activado</p>
                                </div>

                                {/* Folio real generado inmediatamente */}
                                {(preFolio || loadingFolio) && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                                            Tu Folio de Pago — Usa este en el Concepto
                                        </p>
                                        {loadingFolio ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                                <span className="text-sm text-gray-400">Generando folio...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-black tracking-tight text-white">{preFolio}</span>
                                                <button
                                                    onClick={() => handleCopy(preFolio!, 'folio')}
                                                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold"
                                                >
                                                    {copiedFolio ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    Copiar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Datos bancarios */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Banco</span>
                                        <span className="font-bold">{bankInfo.bank}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Beneficiario</span>
                                        <span className="font-bold">{bankInfo.beneficiary}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                        <span className="text-gray-500">CLABE</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-emerald-400">{bankInfo.clabe}</span>
                                            <button onClick={() => handleCopy(bankInfo.clabe, 'clabe')} className="text-gray-400 hover:text-white transition-colors p-1">
                                                {copiedClabe ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Monto</span>
                                        <span className="font-bold text-white">${finalPrice.toFixed(2)} MXN</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/40 rounded-xl p-4">
                                    <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-yellow-200 leading-relaxed">
                                        <strong className="text-yellow-300">IMPORTANTE:</strong>{' '}
                                        Para procesar tu pedido, es obligatorio incluir el número de folio
                                        de tu orden en el concepto de tu transferencia.
                                    </p>
                                </div>

                                <button onClick={() => setSpeiStep('upload')}
                                    className="w-full bg-emerald-500 text-black py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all active:scale-95">
                                    <Upload className="w-4 h-4" /> Ya Transferí — Subir Comprobante
                                </button>
                                <p className="text-[10px] text-gray-500 text-center">Tu pedido se despachará en cuanto validemos la transferencia.</p>
                            </div>
                        )}

                        {/* SPEI: Subir comprobante */}
                        {method === 'spei' && speiStep === 'upload' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Concepto de Pago Obligatorio
                                    </p>
                                    <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3">
                                        <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-200 leading-relaxed">
                                            Para procesar tu pedido, es obligatorio incluir el número de folio
                                            de tu orden en el concepto de tu transferencia.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-[11px] mb-1">Tu folio de pago</p>
                                            <p className="text-white font-black text-3xl tracking-tight">
                                                {preFolio || 'TB-####'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(preFolio || 'TB-####', 'folio')}
                                            className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors p-3 rounded-xl">
                                            {copiedFolio ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
                                            <span className="text-[9px] text-gray-400 font-bold">COPIAR</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all text-center ${uploadedFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                                    {uploadedFile ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                                            <FileText className="w-5 h-5" />
                                            <p className="text-sm font-bold text-slate-900">{uploadedFile.name}</p>
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

                                <input
                                    type="text"
                                    placeholder="Ej: 2024021012345678901234567890"
                                    value={trackingKey}
                                    onChange={e => setTrackingKey(e.target.value)}
                                    className="w-full border-2 border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                                />

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

                        {/* Confirmación */}
                        {speiStep === 'confirmed' && (
                            <div className="text-center py-4 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="font-black text-gray-900 text-xl mb-1">¡Comprobante Recibido!</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto mb-6">
                                    Tu asesor ToneBOX validará la transferencia y confirmará el despacho. Recibirás notificación por WhatsApp.
                                </p>

                                {(result?.folio || preFolio) && (
                                    <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Folio de Seguimiento</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-gray-900 text-3xl tracking-tight">
                                                {result?.folio || preFolio}
                                            </span>
                                            <button onClick={() => handleCopy(result?.folio || preFolio || '', 'folio')}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentGateway;
