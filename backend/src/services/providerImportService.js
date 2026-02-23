/**
 * PROVIDER IMPORT SERVICE
 * Framework genérico para importar catálogos de proveedores externos
 * vía archivos Excel (.xlsx) o CSV.
 *
 * Proveedores soportados:
 *   BOP       → Compatibles (toners, cartuchos genéricos)
 *   CADTONER  → Compatibles (toners compatibles premium)
 *   UNICOM    → Originales HP exclusivos
 *
 * Flujo:
 *   1. Leer archivo (Buffer o path)
 *   2. Detectar columnas por alias conocidos por proveedor
 *   3. Mapear al schema Product de Supabase
 *   4. Upsert en DB
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { extractPrinterModels, detectCategory } from './ctService.js';

const prisma = new PrismaClient();

// ── Mapa de columnas por proveedor ────────────────────────────────────────────
// Lista de aliases para cada campo requerido (prioridad: primero encontrado)
const COLUMN_ALIASES = {
    sku: ['clave', 'codigo', 'sku', 'code', 'partnumber', 'part_number', 'part number', 'modelo'],
    name: ['nombre', 'descripcion', 'description', 'name', 'producto', 'articulo'],
    brand: ['marca', 'brand', 'fabricante', 'manufacturer'],
    price: ['precio', 'price', 'precio_lista', 'preciocliente', 'precio unitario', 'costo'],
    stock: ['existencia', 'stock', 'cantidad', 'disponible', 'qty', 'quantity'],
    category: ['categoria', 'category', 'tipo', 'type', 'subcategoria'],
    compatibility: ['compatibilidad', 'compatibility', 'impresoras', 'printers', 'aplica_para', 'modelos'],
    image: ['imagen', 'image', 'foto', 'photo', 'url_imagen', 'img'],
    currency: ['moneda', 'currency'],
    weight: ['peso', 'weight', 'kg'],
};

// productType por proveedor
const PROVIDER_PRODUCT_TYPE = {
    BOP:      'COMPATIBLE',
    'BOP-MX': 'COMPATIBLE',
    CADTONER: 'COMPATIBLE',
    UNICOM:   'ORIGINAL',
};

// ── Detecta columna por alias ─────────────────────────────────────────────────
function resolveColumn(headers, field) {
    const aliases = COLUMN_ALIASES[field] || [];
    const lowerHeaders = headers.map(h => (h || '').toString().toLowerCase().trim());
    for (const alias of aliases) {
        const idx = lowerHeaders.findIndex(h => h.includes(alias));
        if (idx !== -1) return headers[idx];
    }
    return null;
}

// ── Parsea archivo a array de filas ──────────────────────────────────────────
function parseFile(buffer, filename = '') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    console.log(`[Import] Archivo parseado: ${rows.length} filas desde hoja "${sheetName}"`);
    return rows;
}

// ── Normaliza un campo escalar de una fila ────────────────────────────────────
function getField(row, colName) {
    if (!colName) return '';
    const value = row[colName];
    return value !== undefined && value !== null ? String(value).trim() : '';
}

// ── Mapea una fila al schema Product ─────────────────────────────────────────
function mapRowToProduct(row, colMap, providerId, providerCode) {
    const sku     = getField(row, colMap.sku).toUpperCase();
    const name    = getField(row, colMap.name);
    const brand   = getField(row, colMap.brand) || 'Sin marca';
    const rawPrice = parseFloat(getField(row, colMap.price).replace(/[^0-9.]/g, '')) || 0;
    const currency = (getField(row, colMap.currency) || 'MXN').toUpperCase();
    const stock   = parseInt(getField(row, colMap.stock).replace(/[^0-9]/g, '')) || 0;
    const weight  = parseFloat(getField(row, colMap.weight)) || 0.5;
    const image   = getField(row, colMap.image) || null;

    if (!sku || !name) return null;

    // Precio siempre en MXN (si viene en USD, usar tipo de cambio estándar 17.5)
    const priceMXN = currency === 'USD' ? parseFloat((rawPrice * 17.5).toFixed(2)) : rawPrice;

    // Detectar categoría desde campo o nombre
    const categoryField = getField(row, colMap.category);
    const fakeProduct = {
        subcategoria: categoryField,
        nombre:       name,
        descripcion:  name,
    };
    const category = detectCategory(fakeProduct);

    // Modelos de impresora compatibles desde campo compatibility o nombre
    const compatText = getField(row, colMap.compatibility) || name;
    const compatibility = extractPrinterModels(compatText);

    return {
        sku,
        name,
        brand,
        category,
        color:              null,
        yield:              null,
        compatibility,
        availabilityStatus: stock > 0 ? 'IN_STOCK' : 'ON_DEMAND',
        productType:        PROVIDER_PRODUCT_TYPE[providerCode] || 'ORIGINAL',
        priceMXN:           priceMXN > 0 ? priceMXN : null,
        image,
        providerId,
        providerSku:        sku,
        weightKg:           weight,
    };
}

// ── Importa catálogo de un proveedor ─────────────────────────────────────────
export async function importProviderCatalog(fileBuffer, filename, providerCode) {
    // 1. Verificar proveedor en DB
    const provider = await prisma.provider.findUnique({ where: { code: providerCode } });
    if (!provider) throw new Error(`Proveedor "${providerCode}" no encontrado en la base de datos.`);

    console.log(`[Import] Iniciando importación para proveedor: ${providerCode} (${provider.name})`);

    // 2. Parsear archivo
    const rows = parseFile(fileBuffer, filename);
    if (rows.length === 0) throw new Error('El archivo está vacío o no tiene filas válidas.');

    // 3. Detectar columnas
    const headers = Object.keys(rows[0]);
    console.log(`[Import] Columnas detectadas: ${headers.join(', ')}`);

    const colMap = {};
    for (const field of Object.keys(COLUMN_ALIASES)) {
        colMap[field] = resolveColumn(headers, field);
    }

    console.log('[Import] Mapa de columnas:', JSON.stringify(colMap, null, 2));

    if (!colMap.sku || !colMap.name) {
        throw new Error(
            `No se pudieron detectar columnas esenciales (SKU/Nombre). ` +
            `Columnas encontradas: ${headers.join(', ')}`
        );
    }

    // 4. Mapear y filtrar filas válidas
    const mapped = rows
        .map(row => mapRowToProduct(row, colMap, provider.id, providerCode))
        .filter(Boolean);

    console.log(`[Import] Productos válidos para upsert: ${mapped.length} de ${rows.length}`);

    // 5. Upsert en Supabase
    let created = 0, updated = 0;
    const errors = [];

    for (const product of mapped) {
        try {
            const existing = await prisma.product.findUnique({ where: { sku: product.sku } });
            if (existing) {
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

    console.log(`[Import] ✅ ${providerCode} — Creados: ${created}, Actualizados: ${updated}, Errores: ${errors.length}`);

    return {
        provider:  providerCode,
        total:     rows.length,
        valid:     mapped.length,
        created,
        updated,
        errors:    errors.slice(0, 20),
    };
}
