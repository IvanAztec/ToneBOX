import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuración Transporter SMTP Nodemailer
// OJO: Estas son variables que configuras en tu .env (.env en backend o donde esté alojado)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.tonebox.com.mx', // Ejemplo: smtp.hostinger.com o smtp.tu-dominio.com
    port: parseInt(process.env.SMTP_PORT || '465', 10), // Usualmente 465 (SSL) o 587 (TLS)
    secure: process.env.SMTP_SECURE === 'true' || true, // true para 465, false para 587
    auth: {
        user: process.env.SMTP_USER || 'pedidos@tonebox.com.mx',
        pass: process.env.SMTP_PASS || 'tu_contraseña_aqui',
    },
});

export const ProveedoresService = {
    // Obtener todos los proveedores para renderizar en el panel
    async getAllProveedores() {
        return prisma.provider.findMany({
            orderBy: { name: 'asc' },
        });
    },

    // Obtener un proveedor por ID
    async getProveedorById(id) {
        return prisma.provider.findUnique({
            where: { id }
        });
    },

    // Actualizar la info de Dropshipping e info contacto de un proveedor
    async updateProveedor(id, data) {
        return prisma.provider.update({
            where: { id },
            data: {
                ejecutivo: data.ejecutivo,
                whatsapp: data.whatsapp,
                emailPedidos: data.emailPedidos,
                instruccionesDropshipping: data.instruccionesDropshipping,
                active: data.active
            }
        });
    },

    // Simulación O Real de Pedido Dropshipping por SMTP
    async testPiloto(provId, pakkeGuide, orderSku, qty, options = {}) {
        const prov = await prisma.provider.findUnique({ where: { id: provId } });
        if (!prov) throw new Error('Proveedor no encontrado');
        if (!prov.emailPedidos) throw new Error('El proveedor no tiene configurado un Email de Pedidos');

        const { guideBuffer, guideMimetype, clientName, clientAddress } = options;

        // Construcción del Cuerpo del Correo con Blindaje Dropshipping HTML
        const mailOptions = {
            from: `"ToneBOX Logistics" <${process.env.SMTP_USER || 'pedidos@tonebox.com.mx'}>`,
            to: prov.emailPedidos,
            cc: 'hola@tonebox.com.mx',
            subject: `📦 [DROPSHIPPING] Orden ToneBOX - SKU: ${orderSku} - ${prov.code || prov.name}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <!-- Header -->
                <div style="background: #111827; padding: 24px; color: white;">
                    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 4px;">Logística Prioritaria ToneBOX</div>
                    <h1 style="margin: 0; font-size: 20px;">Orden de Pedido DROPSHIPPING</h1>
                </div>

                <!-- Detalles -->
                <div style="padding: 24px; background: #fff;">
                    <p style="font-size: 14px; color: #4b5563;">Hola ${prov.ejecutivo || 'Equipo de Ventas'},</p>
                    <p style="font-size: 14px; color: #4b5563;">Favor de procesar este pedido con las siguientes especificaciones:</p>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
                        <tr>
                            <td style="padding: 10px; background: #f9fafb; font-weight: bold; border-bottom: 1px solid #e5e7eb;">PRODUCTO (SKU)</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: bold;">${orderSku}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: #f9fafb; font-weight: bold; border-bottom: 1px solid #e5e7eb;">CANTIDAD</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${qty || 1} pza(s)</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: #f9fafb; font-weight: bold; border-bottom: 1px solid #e5e7eb;">DESTINATARIO</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${clientName || 'Cliente Final'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; background: #f9fafb; font-weight: bold; border-bottom: 1px solid #e5e7eb;">DIRECCIÓN</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${clientAddress || 'Ver guía adjunta'}</td>
                        </tr>
                    </table>

                    <!-- INSTRUCCIONES CRITICAS (JERARQUÍA VISUAL) -->
                    <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 14px; font-weight: 900; text-transform: uppercase;">⚠️ INSTRUCCIONES OBLIGATORIAS (ENTREGA CIEGA)</h3>
                        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #92400e; line-height: 1.6;">
                            <li style="margin-bottom: 8px;"><strong>REMITENTE CIEGO:</strong> Queda estrictamente PROHIBIDO incluir publicidad, folletos, cupones o facturas de su empresa en el paquete.</li>
                            <li style="margin-bottom: 8px;"><strong>EMPAQUE NEUTRO:</strong> Utilizar exclusivamente caja o sobre sin logotipos del proveedor. El cliente NO debe saber el origen del mayorista.</li>
                            <li><strong>GUÍA OFICIAL:</strong> Utilizar únicamente la guía adjunta a este correo. No generar guías externas.</li>
                        </ul>
                    </div>

                    <p style="font-size: 12px; color: #6b7280; text-align: center;">Favor de confirmar recepción respondiendo a hola@tonebox.com.mx</p>
                </div>

                <!-- Footer -->
                <div style="padding: 16px; background: #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af;">
                    ToneBOX Logistics System &copy; ${new Date().getFullYear()} &middot; Monterrey, MX
                </div>
            </div>
            `,
            attachments: guideBuffer ? [
                {
                    filename: `Guia-${orderSku}.${guideMimetype?.split('/')[1] || 'pdf'}`,
                    content: guideBuffer,
                    contentType: guideMimetype,
                }
            ] : []
        };

        // Envío Real a través de NodeMailer
        try {
            const info = await transporter.sendMail(mailOptions);

            // LOGUEAR EL PEDIDO EN EL HISTORIAL (Fase 2)
            await prisma.supplierOrder.create({
                data: {
                    providerId: prov.id,
                    providerName: prov.name,
                    sku: orderSku || 'N/A',
                    quantity: qty || 1,
                    pakkeGuide: pakkeGuide || 'Adjunta/Pendiente',
                    status: 'SENT',
                    metadata: { messageId: info.messageId, response: info.response }
                }
            });

            return { success: true, messageId: info.messageId };
        } catch (e) {
            console.error("Nodemailer SMTP Error:", e);
            // Loguear el fallo también (opcional)
            throw new Error("Fallo de conexión SMTP. Verifique las variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASS.");
        }
    },

    // Obtener historial completo de envíos
    async getAllOrderLogs() {
        return prisma.supplierOrder.findMany({
            include: { provider: true },
            orderBy: { createdAt: 'desc' }
        });
    }
};
