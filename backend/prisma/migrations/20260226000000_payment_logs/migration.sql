-- Migration: payment_logs — Registro de Auditoría de Pagos
-- 2026-02-26

CREATE TABLE IF NOT EXISTS "payment_logs" (
    "id"              TEXT NOT NULL,
    "catalogOrderId"  TEXT,
    "orderId"         TEXT,
    "folio"           TEXT,
    "clientName"      TEXT,
    "clientEmail"     TEXT,
    "method"          TEXT NOT NULL,
    "amount"          DOUBLE PRECISION NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'MXN',
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "claveRastreo"    TEXT,
    "cepData"         JSONB,
    "cepBancoEmisor"  TEXT,
    "cepRfcOrdenante" TEXT,
    "cepHoraCert"     TIMESTAMP(3),
    "cepEstado"       TEXT,
    "validatedBy"     TEXT,
    "validatedAt"     TIMESTAMP(3),
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payment_logs_method_status_idx"    ON "payment_logs"("method", "status");
CREATE INDEX IF NOT EXISTS "payment_logs_catalogOrderId_idx"   ON "payment_logs"("catalogOrderId");
CREATE INDEX IF NOT EXISTS "payment_logs_orderId_idx"          ON "payment_logs"("orderId");
CREATE INDEX IF NOT EXISTS "payment_logs_createdAt_idx"        ON "payment_logs"("createdAt");
