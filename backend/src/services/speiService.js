import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
    },
});

/**
 * Procesa la confirmación de pago SPEI:
 * 1. Crea/actualiza el SpeiPayment con PENDING_VALIDATION
 * 2. Dispara correo a Iván con asunto: [FOLIO] - Nueva Orden de [Cliente]
 * 3. Adjunta el comprobante si el cliente lo subió
 */
export async function processSpeiConfirmation(data, receiptBuffer = null, receiptMimetype = null) {
    const { orderId, folio, amount, productName, trackingKey, clientName, clientContact } = data;

    // Construir el folio display (si no viene, usar orderId)
    const displayFolio = folio || orderId;
    const displayClient = clientName || clientContact || 'Cliente Anónimo';

    // 1. Registrar el pago en BD
    const speiPayment = await prisma.speiPayment.create({
        data: {
            orderId: displayFolio,
            amount: parseFloat(amount),
            productName,
            trackingKey: trackingKey || null,
            status: 'PENDING_VALIDATION',
            clientContact: clientContact || null,
        }
    });

    // 2. Armar el link de Banxico CEP
    const banxeoCepUrl = trackingKey
        ? `https://www.banxico.org.mx/cep/?i=SPEI&t=${trackingKey}`
        : 'https://www.banxico.org.mx/cep/';

    // 3. Correo blindado con asunto estándar ToneBOX
    const emailContent = {
        from: `"ToneBOX Sistema" <${process.env.ADMIN_EMAIL}>`,
        to: process.env.ADMIN_PERSONAL_EMAIL || process.env.ADMIN_EMAIL,
        subject: `[${displayFolio}] - Nueva Orden de ${displayClient}`,
        html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
                <!-- Header -->
                <div style="background: #111827; border-radius: 16px 16px 0 0; padding: 32px; color: white;">
                    <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #6b7280; margin-bottom: 8px;">ToneBOX — Pago Pendiente de Validación</div>
                    <h1 style="font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">${displayFolio}</h1>
                    <p style="color: #9ca3af; margin: 4px 0 0; font-size: 14px;">Nueva Orden de <strong>${displayClient}</strong></p>
                </div>

                <!-- Detalles -->
                <div style="padding: 32px; border: 1px solid #f3f4f6; border-top: none; border-radius: 0 0 16px 16px;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 24px;">
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Folio</td>
                            <td style="padding: 12px 0; font-weight: 900; font-family: monospace; font-size: 16px;">${displayFolio}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Producto</td>
                            <td style="padding: 12px 0; font-weight: 700;">${productName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Monto</td>
                            <td style="padding: 12px 0; font-weight: 900; color: #059669; font-size: 22px;">$${parseFloat(amount).toFixed(2)} MXN</td>
                        </tr>
                        ${trackingKey ? `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Clave de Rastreo</td>
                            <td style="padding: 12px 0; font-family: monospace; font-weight: 700; color: #1d4ed8;">${trackingKey}</td>
                        </tr>` : ''}
                        ${clientContact ? `
                        <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Contacto Cliente</td>
                            <td style="padding: 12px 0; font-weight: 700;">${clientContact}</td>
                        </tr>` : ''}
                    </table>

                    <!-- Acción Principal: Verificar en Banxico -->
                    <a href="${banxeoCepUrl}" target="_blank" 
                       style="display: block; background: #1d4ed8; color: white; text-align: center; 
                              padding: 18px; border-radius: 12px; font-weight: 900; font-size: 15px; 
                              text-decoration: none; letter-spacing: -0.3px; margin-bottom: 16px;">
                        🔍 Verificar Transferencia en Banxico CEP →
                    </a>

                    <p style="font-size: 11px; color: #d1d5db; text-align: center; margin: 0;">
                        Pago ID: ${speiPayment.id} &nbsp;·&nbsp; ${new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' })} CST
                    </p>
                </div>
            </div>
        `,
        attachments: receiptBuffer ? [
            {
                filename: `comprobante-${displayFolio}.${receiptMimetype?.split('/')[1] || 'pdf'}`,
                content: receiptBuffer,
                contentType: receiptMimetype,
            }
        ] : [],
    };

    // 4. Enviar correo
    try {
        await transporter.sendMail(emailContent);
        console.log(`[SpeiService] ✅ Correo enviado: "${emailContent.subject}"`);
    } catch (emailError) {
        console.error(`[SpeiService] ⚠️ Correo no enviado (pago sí registrado):`, emailError.message);
    }

    return speiPayment;
}

/**
 * Aprueba manualmente un SPEI desde el Master Panel (tras verificar en Banxico)
 */
export async function approveSpeiPayment(speiPaymentId) {
    return prisma.speiPayment.update({
        where: { id: speiPaymentId },
        data: { status: 'APPROVED', approvedAt: new Date() }
    });
}
