/**
 * PRICING SERVICE — Lógica de precios ToneBOX v3
 *
 * Fórmula de precio público:
 *   publicPrice = costPrice × MARGIN[productType] × OPERATIONAL_FEE
 *
 * Fórmula de precio SPEI (se elimina la comisión operativa):
 *   speiPrice = costPrice × MARGIN[productType]
 *
 * Márgenes:
 *   COMPATIBLE : 2.00  (100% margen sobre costo)
 *   ORIGINAL   : 1.35  (35%  margen sobre costo)
 *   HARDWARE   : 1.20  (20%  margen sobre costo)
 *
 * OPERATIONAL_FEE = 1.04 — incluido en el precio público.
 * Al pagar por SPEI se elimina, ahorro exacto = publicPrice × (1 − 1/1.04) ≈ 3.85%
 *
 * EJEMPLO DE VALIDACIÓN:
 *   costPrice = $71.43 MXN, productType = 'COMPATIBLE'
 *   publicPrice = $71.43 × 2.0 × 1.04 = $148.57 MXN  ✓
 *   speiPrice   = $71.43 × 2.0        = $142.86 MXN
 */

const MARGINS = {
    COMPATIBLE: 2.00,
    ORIGINAL:   1.35,
    HARDWARE:   1.20,
};

const DEFAULT_MARGIN  = 1.35;
const OPERATIONAL_FEE = 1.04;

/**
 * Calcula publicPrice y speiPrice a partir del costo del proveedor.
 * @param {number|null} costPrice  - Costo del proveedor en MXN
 * @param {string}      productType - 'COMPATIBLE' | 'ORIGINAL' | 'HARDWARE'
 * @returns {{ publicPrice: number|null, speiPrice: number|null }}
 */
export function computePrices(costPrice, productType) {
    if (!costPrice || costPrice <= 0) return { publicPrice: null, speiPrice: null };
    const margin      = MARGINS[productType] ?? DEFAULT_MARGIN;
    const speiPrice   = parseFloat((costPrice * margin).toFixed(2));
    const publicPrice = parseFloat((speiPrice * OPERATIONAL_FEE).toFixed(2));
    return { publicPrice, speiPrice };
}

/** Solo el precio público. */
export function computePublicPrice(costPrice, productType) {
    return computePrices(costPrice, productType).publicPrice;
}

/** Solo el precio SPEI. */
export function computeSpeiPrice(costPrice, productType) {
    return computePrices(costPrice, productType).speiPrice;
}
