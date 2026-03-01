import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { StorageService } from './storageService.js';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtppro.zoho.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Procesa la confirmación de pago SPEI:
 * 1. Crea/actualiza el SpeiPayment con PENDING_VALIDATION
 * 2. Dispara correo a Iván con asunto: [FOLIO] - Nueva Orden de [Cliente]
 * 3. Incluye datos fiscales y adjunta CSF si aplica
 */
export async function processSpeiConfirmation(data, receiptBuffer = null, receiptMimetype = null, csfBuffer = null) {
    const {
        orderId, folio, amount, productName, trackingKey, clientName, clientContact,
        requiresInvoice, rfc, razonSocial, regimenFiscal
    } = data;

    // ── CARGA DE CSF A SUPABASE STORAGE ───────────────────────────────────────
    let cloudCsfUrl = null;
    if (csfBuffer && requiresInvoice) {
        try {
            const fileName = `csf/CSF_${rfc || 'TEMP'}_${Date.now()}.pdf`;
            cloudCsfUrl = await StorageService.uploadFile(csfBuffer, fileName, 'application/pdf');

            // Vincular URL a la orden en la base de datos
            await prisma.order.update({
                where: { id: orderId },
                data: { csfUrl: cloudCsfUrl }
            });
            console.log(`[SpeiService] ☁️ CSF vinculado a orden: ${cloudCsfUrl}`);
        } catch (storageErr) {
            console.error('[SpeiService] ⚠️ Error subiendo CSF a Storage:', storageErr.message);
        }
    }

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

    // 3. Adjuntos
    const attachments = [];
    if (receiptBuffer) {
        attachments.push({
            filename: `comprobante-${displayFolio}.${receiptMimetype?.split('/')[1] || 'pdf'}`,
            content: receiptBuffer,
            contentType: receiptMimetype,
        });
    }
    if (csfBuffer) {
        attachments.push({
            filename: `CSF-${rfc || displayFolio}.pdf`,
            content: csfBuffer,
            contentType: 'application/pdf',
        });
    }

    // 4. Correo blindado con asunto estándar ToneBOX
    const emailContent = {
        from: `"ToneBOX Sistema" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_PERSONAL_EMAIL || process.env.SMTP_USER,
        subject: `[${displayFolio}] - Nueva Orden de ${displayClient}${requiresInvoice ? ' (FACTURA)' : ''}`,
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
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Producto</td>
                            <td style="padding: 12px 0; font-weight: 700;">${productName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Monto</td>
                            <td style="padding: 12px 0; font-weight: 900; color: #059669; font-size: 22px;">$${parseFloat(amount).toFixed(2)} MXN</td>
                        </tr>
                        ${requiresInvoice ? `
                        <tr style="border-bottom: 1px solid #f3f4f6; background: #fefce8;">
                            <td style="padding: 12px 8px; color: #b45309; font-weight: 900;">REQUIERE FACTURA</td>
                            <td style="padding: 12px 8px; font-size: 12px;">
                                <strong>RFC:</strong> ${rfc}<br/>
                                <strong>Razón Social:</strong> ${razonSocial}<br/>
                                <strong>Régimen:</strong> ${regimenFiscal}<br/>
                                ${cloudCsfUrl ? `<a href="${cloudCsfUrl}" target="_blank" style="color: #1d4ed8; text-decoration: underline;">📄 Ver Constancia Fiscal (CSF)</a>` : ''}
                            </td>
                        </tr>` : ''}
                        ${trackingKey ? `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Clave de Rastreo</td>
                            <td style="padding: 12px 0; font-family: monospace; font-weight: 700; color: #1d4ed8;">${trackingKey}</td>
                        </tr>` : ''}
                    </table>

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
        attachments
    };

    // 5. Enviar correo
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
