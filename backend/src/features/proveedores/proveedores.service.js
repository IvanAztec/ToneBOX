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
    async testPiloto(provId, pakkeGuide, orderSku, qty) {
        const prov = await prisma.provider.findUnique({ where: { id: provId } });
        if (!prov) throw new Error('Proveedor no encontrado');
        if (!prov.emailPedidos) throw new Error('El proveedor no tiene configurado un Email de Pedidos');

        // Construcción del Cuerpo del Correo
        const mailOptions = {
            from: `"ToneBOX Pedidos Automáticos" <${process.env.SMTP_USER || 'pedidos@tonebox.com.mx'}>`, // Remitente oficial
            to: prov.emailPedidos, // Destinatario (Proveedor)
            cc: 'hola@tonebox.com.mx', // Copia Oculta/CC fijada a tu correo real
            subject: `[URGENTE] Nuevo Pedido ToneBOX - Dropshipping a Cliente`,
            text: `Hola ${prov.ejecutivo || 'Equipo de Ventas'},\n\n` +
                `Por favor procesar el siguiente pedido en formato Dropshipping.\n\n` +
                `Detalles del Pedido:\n` +
                `- SKU: ${orderSku || 'N/A'}\n` +
                `- Cantidad: ${qty || 1}\n\n` +
                `Guía de Envío Proporcionada (Pakke):\n` +
                `${pakkeGuide || 'Adjunta en este correo o pendiente.'}\n\n` +
                `--- INSTRUCCIONES ESTRICTAS DE ENTREGA (DROPSHIPPING) ---\n` +
                `${prov.instruccionesDropshipping || 'Enviar en empaque neutro, sin notas publicitarias ni logotipos del remitente.'}\n\n` +
                `Cualquier confirmación, por favor responder sobre este correo a hola@tonebox.com.mx\n\n` +
                `Gracias,\n` +
                `ToneBOX Logistics System.`
        };

        // Envío Real a través de NodeMailer (Dejará log si las credenciales fallan, pero el código es completo)
        try {
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (e) {
            console.error("Nodemailer SMTP Error:", e);
            // Throw error to inform admin that variables are not set correctly yet
            throw new Error("Fallo de conexión SMTP. Verifique las variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASS.");
        }
    }
};
