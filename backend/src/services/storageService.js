import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Inicialización de Supabase con Service Role para bypass de RLS en Backend
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Servicio de almacenamiento para la Fábrica ToneBOX.
 * Gestiona la carga de documentos (CSF, Comprobantes) al bucket de Supabase.
 */
export const StorageService = {
    /**
     * Sube un archivo al bucket especificado.
     * @param {Buffer} buffer - Contenido del archivo.
     * @param {string} filename - Nombre destino.
     * @param {string} mimetype - Tipo de archivo.
     * @param {string} bucket - Nombre del bucket (default: 'documents').
     */
    async uploadFile(buffer, filename, mimetype, bucket = 'documents') {
        try {
            console.log(`[Storage] Subiendo ${filename} a bucket ${bucket}...`);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filename, buffer, {
                    contentType: mimetype,
                    upsert: true
                });

            if (error) throw error;

            // Generar una URL firmada segura (vigente por 7 días) 
            // para que el correo sea accesible pero no público permanentemente.
            const { data: signed, error: signedError } = await supabase.storage
                .from(bucket)
                .createSignedUrl(filename, 60 * 60 * 24 * 7); // 7 días

            if (signedError) throw signedError;

            console.log(`[Storage] ✅ URL Firmada generada: ${signed.signedUrl}`);
            return signed.signedUrl;
        } catch (err) {
            console.error('[Storage] ❌ Error en carga:', err.message);
            throw new Error('Error al guardar el documento en la nube.');
        }
    }
};
