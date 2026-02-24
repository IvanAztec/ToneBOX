/**
 * PROVIDER IMPORT SERVICE
 * Parsers dedicados para BOP, CADTONER y UNICOM.
 *
 * Arquitectura:
 *   importProviderCatalog(buffer, filename, code) → dispatch al parser correcto
 *   ├── parseCadtoner()  → xlsx con headers en fila 1, OEM propagado
 *   ├── parseBOP()       → xlsx con headers en fila 7, secciones por marca
 *   └── parseUnicom()    → xlsx con headers en fila 0, filtro consumibles
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { detectCategory } from './ctService.js';
import { computePrices } from './pricingService.js';

const prisma = new PrismaClient();

// ── Detecta marca desde número de parte OEM (estándar de la industria) ────────
function detectBrandFromOEM(oem) {
    const u = (oem || '').toUpperCase().trim();
    // HP: CB, CC, CE, CF prefijos modernos; C[dígito] legacy; Q legacy; W nuevos
    if (/^(CB|CC|CE|CF|W[0-9]|Q[0-9]|C[0-9])/.test(u)) return 'HP';
    if (/^(TN|DR|LC)/.test(u))                          return 'Brother';
    if (/^TK/.test(u))                                  return 'Kyocera';
    if (/^(MLT|CLT|SCX|ML-)/.test(u))                  return 'Samsung';
    if (/^(CRG|PGI|CLI|BCI|GPR|IR[0-9]|3[0-9]{3}C)/.test(u)) return 'Canon';
    if (/^(T[0-9]{3,4}|S0[0-9])/.test(u))              return 'Epson';
    if (/^(106R|006R|101R|013R|108R)/.test(u))          return 'Xerox';
    if (/^(40[0-9]{4}|88[0-9]{4}|593-)/.test(u))       return 'Ricoh';
    if (/^[0-9]{5}[A-Z]{2}/.test(u))                   return 'Lexmark';
    return 'Genérico';
}

// ── Extrae la base OEM de un SKU CADTONER ────────────────────────────────────
// CE285A/CB435ACOMP-S → CE285A  |  CE278ACOMP-S → CE278A  |  TN-660COMP-AI → TN-660
function extractBaseFromClave(clave) {
    return clave
        .split('/')[0]
        .replace(/COMP.*$/i, '')
        .replace(/-AI.*$/i, '')
        .replace(/-S$/i, '')
        .replace(/-XXL$/i, '')
        .trim();
}

// ── Extrae modelos de impresora de texto libre ────────────────────────────────
// Busca patrones: P1102, M1536, MFP M26nw, M402dn, HL-L2300, MFC-L2710, etc.
const PRINTER_MODEL_REGEX = /\b(MFP\s?)?([A-Z]{1,3}[-\s]?[A-Z]{0,3}[-\s]?[lLmMpP]?\d{3,5}[wWdDnNfF]{0,4})\b/g;

function extractPrinterModelsFromText(text = '') {
    const matches = text.match(PRINTER_MODEL_REGEX) || [];
    return [...new Set(
        matches.map(m => m.replace(/\s+/g, '').toUpperCase()).filter(m => m.length >= 3)
    )].slice(0, 12); // máx 12 modelos por producto
}

// ── Upsert batch en Supabase ──────────────────────────────────────────────────
async function upsertProducts(products) {
    let created = 0, updated = 0;
    const errors = [];
    for (const product of products) {
        try {
            const exists = await prisma.product.findUnique({ where: { sku: product.sku } });
            if (exists) {
                await prisma.product.update({ where: { sku: product.sku }, data: product });
                updated++;
            } else {
                await prisma.product.create({ data: product });
                created++;
            }
        } catch (err) {
            errors.push(`${product.sku}: ${err.message}`);
        }
    }
    return { created, updated, errors };
}

// ════════════════════════════════════════════════════════════════════════════
// PARSER: CADTONER
// Formato: Fila 0=título | Fila 1=headers | Datos desde Fila 2
// Cols: OEM | Clave CAD | Rendimiento | Dll.17.65 | Precio distribuidor | Precio UF. | Notas
// El campo OEM se propaga hacia abajo (filas vacías heredan el último OEM)
// ════════════════════════════════════════════════════════════════════════════
function parseCadtoner(buffer, providerId) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
        { header: 1, defval: '' }
    );

    let lastOEM = '';
    const products = [];

    for (const row of rawRows.slice(2)) {
        if (row[0] && String(row[0]).trim()) lastOEM = String(row[0]).trim();

        const clave         = String(row[1] || '').trim().toUpperCase();
        const rendimiento   = parseInt(row[2]) || null;
        const precioDistMXN = parseFloat(row[4]) || 0;

        if (!clave || precioDistMXN <= 0) continue;

        // OEM parts para compatibilidad y marca
        const oemParts   = lastOEM.split('/').map(s => s.trim()).filter(Boolean);
        const baseOEM    = extractBaseFromClave(clave);
        const brand      = detectBrandFromOEM(oemParts[0] || baseOEM);
        const shortOEM   = oemParts.slice(0, 2).join('/') || baseOEM;
        const name       = `Toner Compatible ${shortOEM} ${brand}`.trim();

        products.push({
            sku:                clave,
            name,
            brand,
            category:           'Toner',
            color:              null,
            yield:              rendimiento,
            compatibility:      oemParts,                         // parte OEM = clave de búsqueda
            availabilityStatus: 'IN_STOCK',
            productType:        'COMPATIBLE',
            costPrice:          parseFloat(precioDistMXN.toFixed(2)),
            ...computePrices(precioDistMXN, 'COMPATIBLE'),
            image:              null,
            providerId,
            providerSku:        clave,
            weightKg:           0.5,
        });
    }

    console.log(`[CADTONER] Parser: ${products.length} productos válidos`);
    return products;
}

// ════════════════════════════════════════════════════════════════════════════
// PARSER: BOP
// Formato: Fila 7=headers | Fila 8=sub-sección | Datos desde Fila 9+
// Cols: [0]=interno | [1]=Nombre Comercial | [2]=MODELO(OEM) | [3]=Rendimiento
//       [4]=Precio Distribuidor MAS IVA | [5]=Precio Público | [6]=Compatibilidad
// Filas de sección: [4] no es número > 0
// ════════════════════════════════════════════════════════════════════════════
function parseBOP(buffer, providerId) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rawRows  = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
        { header: 1, defval: '' }
    );

    const products = [];

    for (const row of rawRows.slice(8)) {
        const modelo   = String(row[2] || '').trim().toUpperCase();
        const nombre   = String(row[1] || '').trim();
        const precio   = parseFloat(String(row[4]).replace(/[^0-9.]/g, '')) || 0;
        const rendim   = parseInt(row[3]) || null;
        const compat   = String(row[6] || '').trim();

        if (precio <= 0) continue;          // sección header o fila vacía
        if (!modelo && !nombre) continue;

        // SKU: usar MODELO si parece OEM; si no (ej: "H-664XL TRICOLOR"), usar nombre
        const sku = (modelo && modelo.length >= 3 ? modelo : nombre).replace(/\s+/g, '-').toUpperCase();

        // Tomar el primer OEM para detectar marca
        const firstOEM = modelo.split('/')[0].trim();
        const brand    = detectBrandFromOEM(firstOEM) !== 'Genérico'
            ? detectBrandFromOEM(firstOEM)
            : detectBrandFromOEM(nombre.split('/')[0].trim());

        // OEM parts para campo compatibility (búsqueda por # de parte)
        const oemParts = modelo
            ? modelo.split(/[/,]/).map(s => s.trim()).filter(Boolean)
            : [];

        // Modelos de impresora desde campo compatibilidad
        const printerModels = extractPrinterModelsFromText(compat);
        const compatibility = [...new Set([...oemParts, ...printerModels])].slice(0, 15);

        // Nombre descriptivo
        const shortOEM = oemParts.slice(0, 2).join('/') || nombre;
        const category = compat.toLowerCase().includes('tinta') || nombre.toLowerCase().includes('tinta')
            ? 'Cartucho'
            : 'Toner';
        const productName = `${category} Compatible ${shortOEM} ${brand}`.trim();

        products.push({
            sku:                sku.substring(0, 100), // límite seguro
            name:               productName,
            brand,
            category,
            color:              null,
            yield:              rendim,
            compatibility,
            availabilityStatus: 'IN_STOCK',
            productType:        'COMPATIBLE',
            costPrice:          parseFloat(precio.toFixed(2)),
            ...computePrices(precio, 'COMPATIBLE'),
            image:              null,
            providerId,
            providerSku:        modelo || sku,
            weightKg:           0.5,
        });
    }

    console.log(`[BOP] Parser: ${products.length} productos válidos`);
    return products;
}

// ════════════════════════════════════════════════════════════════════════════
// PARSER: UNICOM
// Formato: Headers en Fila 0 (estándar)
// Cols: CLAVE | DESCRIPCION | DESCRIPCION2 | EXISTENCIA | OFERTA |
//       CODIGO_PROVEEDOR | CODIGO_FABRICANTE | PRECIO | MONEDA |
//       GRUPO | GARANTIA | MARCA | UPC_CODE
// Filtro: solo CONSUMIBLES / IMPRESION + descripción con keywords de impresión
// ════════════════════════════════════════════════════════════════════════════
const UNICOM_PRINT_GRUPOS  = new Set(['CONSUMIBLES', 'IMPRESION']);
const UNICOM_PRINT_KEYWORDS = ['toner', 'tóner', 'cartucho', 'tinta', 'ink', 'drum', 'tambor', 'ribbon'];

function parsePrintDescUnicom(desc) {
    const d = (desc || '').toLowerCase();
    return UNICOM_PRINT_KEYWORDS.some(k => d.includes(k));
}

function parseUnicom(buffer, providerId) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows     = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
        { defval: '' }
    );

    const products = [];

    for (const row of rows) {
        const clave      = String(row.CLAVE || '').trim().toUpperCase();
        const desc       = String(row.DESCRIPCION || '').trim();
        const existencia = parseInt(row.EXISTENCIA) || 0;
        const precio     = parseFloat(row.PRECIO) || 0;
        const moneda     = String(row.MONEDA || 'MXN').toUpperCase();
        const grupo      = String(row.GRUPO || '').toUpperCase().trim();
        const marca      = String(row.MARCA || '').trim();
        const codFab     = String(row.CODIGO_FABRICANTE || '').trim().toUpperCase();

        if (!clave || precio <= 0) continue;

        // Filtrar solo consumibles de impresión:
        // DEBE estar en grupo consumibles/impresión Y tener keyword de impresión en descripción
        const inPrintGrupo = UNICOM_PRINT_GRUPOS.has(grupo) || grupo === 'IMPRESION';
        const hasPrintDesc = parsePrintDescUnicom(desc);
        if (!inPrintGrupo || !hasPrintDesc) continue;

        // UNICOM usa "HEWLETT PACKARD" como marca HP
        const normalizedBrand = /hewlett|^hp$/i.test(marca) ? 'HP'
            : marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase();

        const costPrice = moneda === 'USD'
            ? parseFloat((precio * 17.5).toFixed(2))
            : parseFloat(precio.toFixed(2));

        // Compatibilidad: modelos de impresora desde descripción + código fabricante
        const printerModels = extractPrinterModelsFromText(desc);
        const compatibility = codFab
            ? [...new Set([codFab, ...printerModels])].slice(0, 15)
            : printerModels.slice(0, 15);

        const fakeProduct = { nombre: desc, subcategoria: grupo };
        const category = detectCategory(fakeProduct);

        products.push({
            sku:                clave,
            name:               desc || clave,
            brand:              normalizedBrand,
            category,
            color:              null,
            yield:              null,
            compatibility,
            availabilityStatus: existencia > 0 ? 'IN_STOCK' : 'ON_DEMAND',
            productType:        'ORIGINAL',
            costPrice,
            ...computePrices(costPrice, 'ORIGINAL'),
            image:              null,
            providerId,
            providerSku:        codFab || clave,
            weightKg:           0.5,
        });
    }

    console.log(`[UNICOM] Parser: ${products.length} productos válidos`);
    return products;
}

// ════════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════
export async function importProviderCatalog(fileBuffer, filename, providerCode) {
    const provider = await prisma.provider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new Error(`Proveedor "${providerCode}" no encontrado en la base de datos.`);

    console.log(`[Import] ${providerCode} (${provider.name}) — archivo: ${filename}`);

    let products;
    if (providerCode === 'CADTONER') {
        products = parseCadtoner(fileBuffer, provider.id);
    } else if (providerCode === 'BOP' || providerCode === 'BOP-MX') {
        products = parseBOP(fileBuffer, provider.id);
    } else if (providerCode === 'UNICOM') {
        products = parseUnicom(fileBuffer, provider.id);
    } else {
        throw new Error(`Proveedor "${providerCode}" no tiene parser dedicado. Soportados: CADTONER, BOP, UNICOM`);
    }

    if (products.length === 0) throw new Error('El parser no extrajo productos. Revisa el formato del archivo.');

    const { created, updated, errors } = await upsertProducts(products);
    console.log(`[Import] ✅ ${providerCode} — Creados: ${created}, Actualizados: ${updated}, Errores: ${errors.length}`);

    return {
        provider: providerCode,
        valid:    products.length,
        created,
        updated,
        errors:   errors.slice(0, 20),
    };
}
