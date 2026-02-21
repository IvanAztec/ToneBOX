/**
 * Service to handle notification scheduling and message construction for WhatsApp/Email.
 */
export const notificationScheduler = {
    /**
     * Prepares the message structure for a Duo Pack upsell.
     */
    prepareDuoPackMessage(userName, printerModel) {
        return {
            to: 'whatsapp', // Metadata for the sender
            body: `Hola ${userName}, soy tu asistente de ToneBOX.mx. Notamos que tu impresora ${printerModel || 'impresora'} está por requerir su siguiente tóner. Por ser uno de nuestros clientes VIP, hoy tenemos para ti una oferta especial en el Duo Pack para que ahorres más. ¿Te lo mandamos hoy mismo para que lo tengas con tiempo y tu oficina nunca se detenga? 🚀`,
            actions: [
                { label: 'Confirmar Pedido (Oferta VIP)', url: '/checkout/confirm-bundle' }
            ]
        };
    },

    /**
     * Mock function to simulate sending a WhatsApp lead message.
     * In production, this would hit a Twilio or Meta WhatsApp Business API.
     */
    async sendWhatsAppReminder(whatsappNumber, messageBody) {
        console.log(`[WhatsApp Lead] Sending to ${whatsappNumber}: ${messageBody}`);
        // implementation for WhatsApp API goes here
        return { success: true, timestamp: new Date() };
    }
};
