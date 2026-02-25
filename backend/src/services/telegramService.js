/**
 * telegramService.js — Notificaciones vía Telegram Bot API
 *
 * Variables requeridas en .env:
 *   TELEGRAM_BOT_TOKEN  → Token del bot (de @BotFather)
 *   TELEGRAM_CHAT_ID    → Chat ID de Iván (obtenido con /getUpdates)
 */

const TG_API = 'https://api.telegram.org';

/**
 * Envía un mensaje de texto al chat configurado.
 * Soporta HTML básico: <b>bold</b>, <i>italic</i>, <code>mono</code>
 */
export async function sendTelegramMessage(text, chatId = null) {
    const token  = process.env.TELEGRAM_BOT_TOKEN;
    const target = chatId ?? process.env.TELEGRAM_CHAT_ID;

    if (!token)  throw new Error('TELEGRAM_BOT_TOKEN no está configurado en .env');
    if (!target) throw new Error('TELEGRAM_CHAT_ID no está configurado en .env');

    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id:    target,
            text,
            parse_mode: 'HTML',
        }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
    return data.result;
}

/**
 * Verifica el estado de la configuración de Telegram.
 */
export function getTelegramStatus() {
    return {
        configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        hasToken:   !!process.env.TELEGRAM_BOT_TOKEN,
        hasChatId:  !!process.env.TELEGRAM_CHAT_ID,
    };
}
