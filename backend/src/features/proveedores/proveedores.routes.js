import { Router } from 'express';
import { ProveedoresService } from './proveedores.service.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler, HttpErrors } from '../../middleware/errorHandler.js';

const router = Router();

// ── Auth guard: admin only ──
router.use(authenticate, (req, res, next) => {
    if (req.user.role !== 'admin') throw HttpErrors.forbidden('Solo administradores pueden gestionar proveedores');
    next();
});

// GET /api/admin/proveedores -> Lista los proveedores
router.get('/', asyncHandler(async (req, res) => {
    const providers = await ProveedoresService.getAllProveedores();
    res.json({ success: true, data: providers });
}));

// GET /api/admin/proveedores/:id -> Obtiene detalles de un proveedor
router.get('/:id', asyncHandler(async (req, res) => {
    const provider = await ProveedoresService.getProveedorById(req.params.id);
    if (!provider) throw HttpErrors.notFound('Proveedor no encontrado');
    res.json({ success: true, data: provider });
}));

// PATCH /api/admin/proveedores/:id -> Actualiza info dropshipping
router.patch('/:id', asyncHandler(async (req, res) => {
    // En un caso real podrías validar req.body con Zod (id, nombre, etc)
    const updated = await ProveedoresService.updateProveedor(req.params.id, req.body);
    res.json({ success: true, data: updated });
}));

// POST /api/admin/proveedores/:id/test-piloto -> Dispara correo de prueba de pedido dropshipping
router.post('/:id/test-piloto', asyncHandler(async (req, res) => {
    const { pakkeGuide, sku, qty } = req.body;
    const result = await ProveedoresService.testPiloto(req.params.id, pakkeGuide, sku, qty);
    res.json({ success: true, message: 'Correo enviado vía SMTP de ToneBOX', result });
}));

export default router;
