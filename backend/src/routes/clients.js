/**
 * CRM Clients Route — /api/admin/clients
 * Requiere rol admin. Agrega LTV desde catalog_orders.
 */

import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

const router = Router();
const prisma = new PrismaClient();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const BUSINESS_TYPES = ['INSTITUCION', 'PYME', 'DESPACHO', 'CORPORATIVO', 'REVENDEDOR', 'POR_CLASIFICAR'];

const patchSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES),
});

// ── Auth guard: admin only ────────────────────────────────────────────────────
router.use(authenticate, (req, _res, next) => {
  if (req.user.role !== 'admin') throw HttpErrors.forbidden('Solo administradores');
  next();
});

// ── GET /api/admin/clients ────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { giro } = req.query;

  // Traer todos los usuarios (sin password)
  const users = await prisma.user.findMany({
    where: giro ? { businessType: String(giro) } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      empresa: true,
      cargo: true,
      ciudad: true,
      estado: true,
      whatsapp: true,
      businessType: true,
      requiresInvoice: true,
      rfc: true,
      razonSocial: true,
      customerNumber: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Agregar LTV + última compra por userId
  const ltvRaw = await prisma.catalogOrder.groupBy({
    by: ['userId'],
    _sum: { speiTotal: true },
    _max: { createdAt: true },
    _count: { id: true },
    where: {
      userId: { in: users.map(u => u.id) },
      status: { not: 'CANCELLED' },
    },
  });

  const ltvMap = new Map(ltvRaw.map(r => [r.userId, r]));

  // Buscar csfUrl más reciente por userId
  const csfOrders = await prisma.catalogOrder.findMany({
    where: {
      userId: { in: users.map(u => u.id) },
      csfUrl: { not: null },
    },
    select: { userId: true, csfUrl: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const csfMap = new Map();
  for (const o of csfOrders) {
    if (o.userId && !csfMap.has(o.userId)) csfMap.set(o.userId, o.csfUrl);
  }

  const data = users.map(u => {
    const ltv = ltvMap.get(u.id);
    return {
      ...u,
      ltv: ltv?._sum?.speiTotal ?? 0,
      orderCount: ltv?._count?.id ?? 0,
      lastPurchase: ltv?._max?.createdAt ?? null,
      csfUrl: csfMap.get(u.id) ?? null,
    };
  });

  res.json({ success: true, total: data.length, data });
}));

// ── GET /api/admin/clients/alerts ────────────────────────────────────────────
router.get('/alerts', asyncHandler(async (req, res) => {
  const { computeReplenishmentAlerts } = await import('../jobs/replenishmentAlertJob.js');
  const alerts = await computeReplenishmentAlerts();
  const summary = {
    critical: alerts.filter(a => a.level === 'CRITICAL').length,
    high: alerts.filter(a => a.level === 'HIGH').length,
    medium: alerts.filter(a => a.level === 'MEDIUM').length,
    total: alerts.length,
  };
  res.json({ success: true, summary, data: alerts });
}));

// ── GET /api/admin/clients/export ─────────────────────────────────────────────
router.get('/export', asyncHandler(async (req, res) => {
  const XLSX = _require('xlsx');

  // Reusar lógica de listado (sin filtro)
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, empresa: true,
      cargo: true, ciudad: true, estado: true, whatsapp: true,
      businessType: true, rfc: true, razonSocial: true,
      customerNumber: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const ltvRaw = await prisma.catalogOrder.groupBy({
    by: ['userId'],
    _sum: { speiTotal: true },
    _max: { createdAt: true },
    _count: { id: true },
    where: { userId: { in: users.map(u => u.id) }, status: { not: 'CANCELLED' } },
  });
  const ltvMap = new Map(ltvRaw.map(r => [r.userId, r]));

  const rows = users.map(u => {
    const ltv = ltvMap.get(u.id);
    return {
      'No. Cliente': u.customerNumber,
      'Nombre': u.name || '',
      'Email': u.email,
      'Empresa': u.empresa || '',
      'Giro': u.businessType,
      'Cargo': u.cargo || '',
      'Ciudad': u.ciudad || '',
      'Estado': u.estado || '',
      'WhatsApp': u.whatsapp || '',
      'RFC': u.rfc || '',
      'Razón Social': u.razonSocial || '',
      'LTV ($)': ltv?._sum?.speiTotal ?? 0,
      'Pedidos': ltv?._count?.id ?? 0,
      'Última Compra': ltv?._max?.createdAt ? new Date(ltv._max.createdAt).toLocaleDateString('es-MX') : '',
      'Fecha Registro': new Date(u.createdAt).toLocaleDateString('es-MX'),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="clientes-tonebox-${Date.now()}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}));

// ── PATCH /api/admin/clients/:id ──────────────────────────────────────────────
router.patch('/:id', asyncHandler(async (req, res) => {
  const result = patchSchema.safeParse(req.body);
  if (!result.success) throw HttpErrors.badRequest('Validación fallida', result.error.errors);

  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!user) throw HttpErrors.notFound('Cliente no encontrado');

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { businessType: result.data.businessType },
    select: { id: true, businessType: true },
  });

  res.json({ success: true, data: updated });
}));

export default router;
