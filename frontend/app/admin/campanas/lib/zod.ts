import { z } from 'zod';

// ==========================================
// Tipos Base (Typescript)
// ==========================================
export type PipelineStage = 'prospecto' | 'contactado' | 'cotizado' | 'cerrado_ganado' | 'cerrado_perdido';

export interface Vendedor {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    activo: boolean;
}

export interface PipelineLead {
    id: string;
    client_id: string;
    subscription_id: string;
    vendedor_id: string | null;
    stage: PipelineStage;
    template_used?: string;
    valor_estimado: number;
    fecha_asignacion?: string;
    fecha_cierre?: string;
    created_at: string;
    updated_at: string;

    // Relaciones anidadas para la UI
    user: {
        id: string;
        name: string;
        empresa?: string | null;
        whatsapp?: string | null;
    };
    product: {
        name: string;
        sku: string;
    };
    daysRemaining: number;
}

// ==========================================
// Esquemas de Validación (Zod)
// ==========================================

// Para asignar un vendedor a un lead
export const assignVendedorSchema = z.object({
    leadId: z.string().uuid({ message: "Lead ID inválido" }),
    vendedorId: z.string().uuid({ message: "Vendedor ID inválido" }).nullable(),
});

// Para actualizar de etapa el lead interactuando con el Kanban
export const updateStageSchema = z.object({
    leadId: z.string().uuid({ message: "Lead ID inválido" }),
    stage: z.enum(['prospecto', 'contactado', 'cotizado', 'cerrado_ganado', 'cerrado_perdido'], {
        required_error: "La etapa del pipeline es requerida",
        invalid_type_error: "La etapa especificada no es válida",
    }),
    templateUsed: z.string().optional(),
});

export type AssignVendedorInput = z.infer<typeof assignVendedorSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
