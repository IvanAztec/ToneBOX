/**
 * SPEI Payment Service
 * Maneja la confirmación de transferencias SPEI y las notificaciones al admin.
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuración de correo (usa variables de entorno)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD, // App password de Google
    },
});

/**
 * Procesa la confirmación de pago SPEI del cliente:
 * 1. Crea el registro de pago en la BD con estatus PENDING_VALIDATION.
 * 2. Dispara el correo de alerta a Iván con todos los detalles + comprobante adjunto.
 *
 * @param {Object} data - Datos del pago confirmado por el cliente
 * @param {Buffer|null} receiptBuffer - Buffer del archivo de comprobante subido
 * @param {string|null} receiptMimetype - Tipo MIME del comprobante
 */
export async function processSpeiConfirmation(data, receiptBuffer = null, receiptMimetype = null) {
    const { orderId, amount, productName, trackingKey, clientName, clientContact } = data;

    // 1. Registrar el pago en la base de datos
    const speiPayment = await prisma.speiPayment.create({
        data: {
            orderId,
            amount: parseFloat(amount),
            productName,
            trackingKey: trackingKey || null,
            status: 'PENDING_VALIDATION',
            clientContact: clientContact || null,
        }
    });

    // 2. Preparar el correo de notificación para Iván
    const banxeoCepUrl = trackingKey
        ? `https://www.banxico.org.mx/cep/?i=SPEI&t=${trackingKey}`
        : 'https://www.banxico.org.mx/cep/';

    const emailContent = {
        from: `"ToneBOX Sistema" <${process.env.ADMIN_EMAIL}>`,
        to: process.env.ADMIN_PERSONAL_EMAIL || process.env.ADMIN_EMAIL,
        subject: `🚨 NUEVA TRANSFERENCIA SPEI — ${orderId} | $${parseFloat(amount).toFixed(2)} MXN`,
        html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #111827; border-radius: 16px; padding: 32px; color: white; margin-bottom: 24px;">
                    <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 8px;">¡Pago SPEI por Validar!</h1>
                    <p style="color: #9ca3af; margin: 0; font-size: 14px;">El cliente confirmó la transferencia. Acción requerida.</p>
                </div>
                
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                    <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin: 0 0 16px;">Detalles del Pedido</h2>
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr><td style="padding: 6px 0; color: #6b7280;">Orden ID</td><td style="font-weight: 700;">${orderId}</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Producto</td><td style="font-weight: 700;">${productName}</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Monto</td><td style="font-weight: 900; color: #059669; font-size: 18px;">$${parseFloat(amount).toFixed(2)} MXN</td></tr>
                        ${trackingKey ? `<tr><td style="padding: 6px 0; color: #6b7280;">Clave de Rastreo</td><td style="font-family: monospace; font-weight: 700;">${trackingKey}</td></tr>` : ''}
                        ${clientContact ? `<tr><td style="padding: 6px 0; color: #6b7280;">Contacto Cliente</td><td style="font-weight: 700;">${clientContact}</td></tr>` : ''}
                    </table>
                </div>

                <a href="${banxeoCepUrl}" target="_blank" style="display: block; background: #1d4ed8; color: white; text-align: center; padding: 16px; border-radius: 12px; font-weight: 900; font-size: 14px; text-decoration: none; margin-bottom: 16px;">
                    🔍 Verificar Transferencia en Banxico CEP →
                </a>

                <p style="font-size: 11px; color: #9ca3af; text-align: center;">
                    Pago ID: ${speiPayment.id} · ToneBOX Sistema Automático · ${new Date().toLocaleString('es-MX')}
                </p>
            </div>
        `,
        attachments: receiptBuffer ? [
            {
                filename: `comprobante-${orderId}.${receiptMimetype?.split('/')[1] || 'pdf'}`,
                content: receiptBuffer,
                contentType: receiptMimetype,
            }
        ] : [],
    };

    // 3. Enviar el correo
    try {
        await transporter.sendMail(emailContent);
        console.log(`[SpeiService] ✅ Notificación enviada a admin para orden ${orderId}`);
    } catch (emailError) {
        console.error(`[SpeiService] ⚠️ Error enviando correo (pago sí registrado):`, emailError.message);
    }

    return speiPayment;
}

/**
 * Valida y libera una orden SPEI como PAGADA.
 * Lo llama Iván desde el Admin Panel tras verificar en Banxico CEP.
 */
export async function approveSpeiPayment(speiPaymentId) {
    return prisma.speiPayment.update({
        where: { id: speiPaymentId },
        data: { status: 'APPROVED', approvedAt: new Date() }
    });
}
