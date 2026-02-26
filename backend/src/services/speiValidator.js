/**
 * SPEI Validator — Integración con Banxico CEP (Comprobante Electrónico de Pago)
 *
 * Endpoint público de Banxico:
 *   https://www.banxico.org.mx/cep/obtieneDetalleCEP.do
 *
 * Parámetros del criterio (pipe-separated):
 *   fechaOperacion | monto | emisorParticipante | receptorParticipante | cuenta | claveRastreo
 *
 * Campos retornados por Banxico:
 *   - claveRastreo, emisorParticipante, receptorParticipante
 *   - nombreOrdenante, rfcCurpOrdenante (RFC del ordenante)
 *   - cuentaBeneficiario, nombreBeneficiario
 *   - importe, concepto
 *   - tipoPago, tipoCEP, estado (LIQUIDADA | DEVUELTA)
 *   - horaCertificacion (Hora oficial de certificación)
 */

const BANXICO_CEP_URL = 'https://www.banxico.org.mx/cep/obtieneDetalleCEP.do';

// Códigos de banco comunes para emisores/receptores
export const BANK_CODES = {
    'BBVA':        '40012',
    'BANAMEX':     '40002',
    'SANTANDER':   '40006',
    'HSBC':        '40021',
    'BANORTE':     '40072',
    'SCOTIABANK':  '40044',
    'INBURSA':     '40036',
    'AFIRME':      '40062',
    'BAJIO':       '30030',
    'BANBAJIO':    '30030',
    'INVEX':       '40059',
    'SPIN':        '90706',
    'CODI':        '90718',
    'STP':         '90646',
};

/**
 * Parsea la respuesta de Banxico CEP y extrae campos clave.
 * Soporta variaciones de nomenclatura en la API.
 */
function parseCEPData(raw) {
    const estado = raw.estado || raw.tipoCEP || '';
    const liquidada = estado === 'LIQUIDADA' || estado === '1';

    return {
        claveRastreo:       raw.claveRastreo || raw.clave,
        bancoEmisor:        raw.emisorParticipante || raw.nombreEmisor || raw.emisor || null,
        bancoReceptor:      raw.receptorParticipante || raw.nombreReceptor || raw.receptor || null,
        nombreOrdenante:    raw.nombreOrdenante || raw.ordenante || null,
        rfcOrdenante:       raw.rfcCurpOrdenante || raw.rfc || null,
        horaCertificacion:  raw.horaCertificacion || raw.timestamp || null,
        cuentaBeneficiario: raw.cuentaBeneficiario || null,
        nombreBeneficiario: raw.nombreBeneficiario || null,
        monto:              parseFloat(raw.importe || raw.monto || 0),
        concepto:           raw.concepto || raw.referenciaNumerica || null,
        estado:             estado,
        liquidada,
        raw,
    };
}

/**
 * Consulta el CEP de Banxico con parámetros completos.
 * @param {Object} params
 * @param {string} params.claveRastreo  — Clave de rastreo SPEI (requerida)
 * @param {string} params.fechaOperacion — Fecha YYYYMMDD (requerida)
 * @param {number} params.monto          — Monto exacto (requerido)
 * @param {string} [params.emisor]       — Código del banco emisor (40012=BBVA, etc.)
 * @param {string} [params.receptor]     — Código del banco receptor (default: BBVA=40012)
 * @param {string} [params.cuenta]       — CLABE del receptor (default: CLABE de ToneBOX)
 */
export async function queryCEP({
    claveRastreo,
    fechaOperacion,
    monto,
    emisor = '',
    receptor = '40012',
    cuenta = process.env.COMPANY_CLABE || '012180004567890123',
}) {
    if (!claveRastreo || !fechaOperacion || !monto) {
        throw new Error('Se requieren: claveRastreo, fechaOperacion y monto');
    }

    // Formato: YYYYMMDD|monto|emisor|receptor|cuenta|claveRastreo
    const criterio = `${fechaOperacion}|${parseFloat(monto).toFixed(2)}|${emisor}|${receptor}|${cuenta}|${claveRastreo}`;

    let response;
    try {
        response = await fetch(`${BANXICO_CEP_URL}?criterio=${encodeURIComponent(criterio)}`, {
            headers: {
                'Accept':          'application/json',
                'User-Agent':      'ToneBOX-CEP-Validator/1.0',
                'Cache-Control':   'no-cache',
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
        });
    } catch (fetchErr) {
        throw new Error(`Banxico CEP no disponible: ${fetchErr.message}`);
    }

    if (!response.ok) {
        throw new Error(`Banxico CEP respondió ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let raw;

    if (contentType.includes('application/json')) {
        raw = await response.json();
    } else {
        // Banxico a veces devuelve texto plano o HTML — intentar parsear JSON embebido
        const text = await response.text();
        try {
            // Buscar JSON entre llaves
            const match = text.match(/\{[\s\S]*\}/);
            if (match) raw = JSON.parse(match[0]);
            else throw new Error('Respuesta no contiene JSON');
        } catch {
            throw new Error(`Banxico CEP retornó formato inesperado: ${text.slice(0, 200)}`);
        }
    }

    if (!raw || (raw.error && !raw.claveRastreo)) {
        throw new Error(`CEP no encontrado para clave: ${claveRastreo}`);
    }

    return parseCEPData(raw);
}

/**
 * Valida un pago SPEI contra Banxico CEP.
 * Compara el monto y la cuenta receptora con los datos de la orden.
 *
 * @returns {{ valid, cep, error }}
 */
export async function validateSpeiPayment({
    claveRastreo,
    fechaOperacion,
    montoEsperado,
    clabeEsperada,
}) {
    try {
        const cep = await queryCEP({
            claveRastreo,
            fechaOperacion,
            monto: montoEsperado,
            cuenta: clabeEsperada,
        });

        // Validar estado
        if (!cep.liquidada) {
            return {
                valid:  false,
                cep,
                error:  `Transferencia en estado: ${cep.estado} (no LIQUIDADA)`,
            };
        }

        // Validar monto (tolerancia ±1 peso por redondeos)
        const delta = Math.abs(cep.monto - montoEsperado);
        if (delta > 1) {
            return {
                valid:  false,
                cep,
                error:  `Monto no coincide: CEP=${cep.monto}, Esperado=${montoEsperado}`,
            };
        }

        return { valid: true, cep, error: null };

    } catch (err) {
        return { valid: false, cep: null, error: err.message };
    }
}
