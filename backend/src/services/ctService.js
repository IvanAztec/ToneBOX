/**
 * CT Internacional — API Client
 * Docs: http://connect.ctonline.mx:3001
 *
 * Flujo:
 * 1. POST /cliente/token → obtiene JWT
 * 2. GET /existencia    → descarga catálogo completo (regenerado c/15 min)
 * 3. Filtrar categorías "Ahorro": toners, drums, cartuchos, ribbons
 * 4. Mapear al schema de Product de Supabase
 *
 * Proxy: Railway sale por IPs dinámicas. CT solo acepta Fixie (IPs estáticas).
 * Usamos el módulo http nativo de Node con proxy manual (sin dependencias extra).
 */

import http from 'http';

const CT_BASE_URL = process.env.CT_API_URL || 'http://connect.ctonline.mx:3001';
const CT_CLIENTE  = process.env.CT_CLIENTE   || 'SLT0689';
const CT_RFC      = process.env.CT_RFC       || 'AST091007ML6';
const CT_CORREO   = process.env.CT_CORREO    || 'ventas@aztecstudio.net';

// ── Fetch vía HTTP proxy (Fixie) ──────────────────────────────────────────────
// Para HTTP→HTTP el proxy recibe la URL completa en el path del request.
// Proxy-Authorization usa Basic auth con las credenciales de Fixie.
const FIXIE_URL = process.env.FIXIE_URL;

function ctFetch(targetUrl, options = {}) {
    return new Promise((resolve, reject) => {
        const target = new URL(targetUrl);
        const method = (options.method || 'GET').toUpperCase();
        const body   = options.body || null;
        const headers = { ...(options.headers || {}) };

        if (body) headers['Content-Length'] = Buffer.byteLength(body);

        let reqOptions;

        if (FIXIE_URL) {
            // Salir por Fixie: conectar al proxy y pedir la URL completa
            const proxy = new URL(FIXIE_URL);
            const proxyAuth = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64');
            headers['Proxy-Authorization'] = `Basic ${proxyAuth}`;
            headers['Host'] = target.host;

            reqOptions = {
                hostname: proxy.hostname,
                port:     parseInt(proxy.port) || 80,
                path:     targetUrl,           // URL absoluta al proxy HTTP
                method,
                headers,
            };
            console.log(`[CT] Usando Fixie proxy → ${proxy.hostname}:${proxy.port}`);
        } else {
            // Sin proxy (solo funciona si Railway tiene las IPs autorizadas)
            console.warn('[CT] FIXIE_URL no configurado — fetch directo');
            reqOptions = {
                hostname: target.hostname,
                port:     parseInt(target.port) || 80,
                path:     target.pathname + target.search,
                method,
                headers,
            };
        }

        const req = http.request(reqOptions, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                resolve({
                    ok:     res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    text:   () => Promise.resolve(raw),
                    json:   () => Promise.resolve(JSON.parse(raw)),
                });
            });
        });

        req.on('error', (err) => {
            reject(new Error(`ctFetch error [${method} ${targetUrl}]: ${err.message}`));
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error(`ctFetch timeout [${method} ${targetUrl}]`));
        });

        if (body) req.write(body);
        req.end();
    });
}

// ── Categorías "Ahorro" permitidas ────────────────────────────────────────────
const ALLOWED_KEYWORDS = [
    'toner', 'tóner', 'tooner', 'drum', 'tambor',
    'cartucho', 'tinta', 'ribbon', 'cinta', 'consumible',
    'ink', 'inkjet',
];

const ALLOWED_BRANDS = [
    'brother', 'hp', 'hewlett', 'canon', 'epson', 'ricoh',
    'samsung', 'lexmark', 'xerox', 'kyocera', 'sharp', 'zebra',
];

// ── Autenticación ─────────────────────────────────────────────────────────────
export async function getCTToken() {
    const response = await ctFetch(`${CT_BASE_URL}/cliente/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente:   CT_CLIENTE,
            rfc:       CT_RFC,
            correo:    CT_CORREO,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`CT Auth failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    // CT puede devolver { token } o { accessToken } o { data: { token } }
    const token = data.token || data.accessToken || data.data?.token;
    if (!token) throw new Error(`CT Auth: token no encontrado en respuesta: ${JSON.stringify(data)}`);

    console.log('[CT] Token obtenido correctamente.');
    return token;
}

// ── Descarga catálogo de existencias ─────────────────────────────────────────
export async function getCTExistencia(token) {
    const response = await ctFetch(`${CT_BASE_URL}/existencia`, {
        headers: {
            'x-auth':        token,
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`CT Existencia failed (${response.status})`);
    }

    const raw = await response.json();
    // CT puede devolver [] o { productos: [] } o { data: [] }
    const products = Array.isArray(raw)
        ? raw
        : raw.productos || raw.existencia || raw.data || [];

    console.log(`[CT] Catálogo descargado: ${products.length} registros totales`);
    return products;
}

// ── Normaliza existencia (puede ser número o array por ciudad) ────────────────
function normalizeStock(existencia) {
    if (typeof existencia === 'number') return existencia;
    if (Array.isArray(existencia)) {
        return existencia.reduce((sum, e) => sum + (e.cantidad || e.stock || 0), 0);
    }
    return 0;
}

// ── Filtra por categorías "Ahorro" ────────────────────────────────────────────
export function filterAhorroProducts(products) {
    const filtered = products.filter(p => {
        const stock = normalizeStock(p.existencia ?? p.stock ?? p.cantidad ?? 0);
        if (stock <= 0) return false;

        const haystack = [
            p.nombre, p.descripcion, p.categoria,
            p.subcategoria, p.tipoproducto, p.tipo,
        ].join(' ').toLowerCase();

        const brandName = (p.marca || p.brand || '').toLowerCase();

        const isAllowedCategory = ALLOWED_KEYWORDS.some(kw => haystack.includes(kw));
        const isAllowedBrand    = ALLOWED_BRANDS.some(b => brandName.includes(b) || haystack.includes(b));

        return isAllowedCategory || isAllowedBrand;
    });

    console.log(`[CT] Filtrado "Ahorro": ${filtered.length} productos relevantes (de ${products.length})`);
    return filtered;
}

// ── Normaliza precio ──────────────────────────────────────────────────────────
function normalizePrice(p) {
    return parseFloat(p.precio ?? p.precioLista ?? p.price ?? 0) || 0;
}

// ── Extrae modelos de impresora de la descripción ─────────────────────────────
// Patrones comunes en catálogos CT: "L2540", "HL-L2350", "MFC-L2710"
const PRINTER_MODEL_REGEX = /\b(dcp|hl|mfc|lj|laserjet|pixma|stylus|workforce|tm|mg|mx|g[0-9]{4})?[-\s]?[a-z]{0,4}[-\s]?[lmp]?\d{3,5}[dw]{0,4}\b/gi;

export function extractPrinterModels(text = '') {
    const matches = text.match(PRINTER_MODEL_REGEX) || [];
    return [...new Set(matches.map(m => m.trim().toUpperCase()))];
}

// ── Detecta categoría normalizada ─────────────────────────────────────────────
export function detectCategory(p) {
    const hay = [p.nombre, p.descripcion, p.tipoproducto, p.subcategoria]
        .join(' ').toLowerCase();

    if (hay.includes('drum') || hay.includes('tambor')) return 'Drum';
    if (hay.includes('toner') || hay.includes('tóner'))  return 'Toner';
    if (hay.includes('ribbon') || hay.includes('cinta')) return 'Ribbon';
    if (hay.includes('cartucho') || hay.includes('tinta') || hay.includes('ink')) return 'Cartucho';
    return 'Consumible';
}

// ── Mapeo CT → Product schema de Supabase ────────────────────────────────────
export function mapCTProductToSchema(p, providerId) {
    const stock = normalizeStock(p.existencia ?? p.stock ?? p.cantidad ?? 0);
    const description = `${p.nombre || ''} ${p.descripcion || ''}`.trim();

    return {
        sku:               (p.clave || p.codigo || p.sku || '').trim().toUpperCase(),
        name:              p.nombre || p.descripcion || p.clave || 'Sin nombre',
        brand:             (p.marca || p.brand || 'Sin marca').trim(),
        category:          detectCategory(p),
        color:             p.color || null,
        yield:             parseInt(p.rendimiento || p.yield || 0) || null,
        compatibility:     extractPrinterModels(description),
        availabilityStatus: stock > 0 ? 'IN_STOCK' : 'ON_DEMAND',
        providerId,
        providerSku:       (p.clave || p.codigo || '').trim(),
        weightKg:          parseFloat(p.peso || 0) || 0.5,
        // CT-specific extras (stored for reference)
        _ctPrice:          normalizePrice(p),
        _ctStock:          stock,
    };
}
