/**
 * CT Internacional — Cliente FTP
 *
 * Descarga /catalogo_xml/productos.json del servidor FTP de CT.
 * Archivo: ~5 MB JSON, ~6,000 productos con stock, precios e imágenes.
 *
 * Estructura de cada producto:
 *   clave, nombre, marca, categoria, subcategoria, descripcion_corta,
 *   existencia: { "SLP": 2, "GDL": 5, ... },   ← sumar todos los warehouses
 *   precio: 708.19, moneda: "MXN", tipoCambio: 1
 *   imagen: "https://static.ctonline.mx/..."
 */

import { Client } from 'basic-ftp';
import { Writable } from 'stream';

const FTP_HOST = process.env.CT_FTP_HOST || '216.70.82.104';
const FTP_USER = process.env.CT_FTP_USER || 'SLT0689';
const FTP_PASS = process.env.CT_FTP_PASS || 'fgw9wsjLAZ9wtKdBZLujqCHzqleJYpLP';
const FTP_PORT = parseInt(process.env.CT_FTP_PORT || '21');
const CATALOG_PATH = '/catalogo_xml/productos.json';

/**
 * Descarga y parsea el catálogo JSON desde el FTP de CT.
 * Retorna el array crudo de productos (misma interfaz que getCTExistencia).
 */
export async function downloadCTCatalogViaFTP() {
    const client = new Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host:     FTP_HOST,
            port:     FTP_PORT,
            user:     FTP_USER,
            password: FTP_PASS,
            secure:   false,
        });
        console.log(`[FTP] ✅ Conectado a CT Internacional (${FTP_HOST})`);

        // Stream hacia buffer en memoria
        const chunks = [];
        const writable = new Writable({
            write(chunk, _enc, cb) { chunks.push(chunk); cb(); },
        });

        console.log(`[FTP] Descargando ${CATALOG_PATH}...`);
        await client.downloadTo(writable, CATALOG_PATH);

        const raw  = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(raw);

        // CT devuelve array directo
        const products = Array.isArray(data)
            ? data
            : data.productos || data.existencia || data.data || [];

        console.log(`[FTP] Catálogo descargado: ${products.length} registros`);
        return products;

    } finally {
        client.close();
    }
}

/**
 * Normaliza existencia desde el formato FTP:
 *   { "SLP": 2, "GDL": 5, "MTY": 1 }  →  8
 * También compatible con número o array (formato HTTP API).
 */
export function normalizeFTPStock(existencia) {
    if (typeof existencia === 'number') return existencia;
    if (Array.isArray(existencia)) {
        return existencia.reduce((sum, e) => sum + (e.cantidad || e.stock || 0), 0);
    }
    if (existencia && typeof existencia === 'object') {
        return Object.values(existencia).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }
    return 0;
}

/**
 * Convierte precio a MXN:
 *   - moneda MXN: precio directo
 *   - moneda USD: precio × tipoCambio
 */
export function normalizePriceMXN(precio, moneda, tipoCambio) {
    const p = parseFloat(precio) || 0;
    if (!p) return null;
    if ((moneda || 'MXN').toUpperCase() === 'USD') {
        return parseFloat((p * (parseFloat(tipoCambio) || 17.5)).toFixed(2));
    }
    return parseFloat(p.toFixed(2));
}
