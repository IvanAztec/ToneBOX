-- CompanySettings: configuración global de la empresa (singleton)
CREATE TABLE IF NOT EXISTS "company_settings" (
  "id"                TEXT NOT NULL DEFAULT 'tonebox',
  "bankName"          TEXT NOT NULL DEFAULT 'BBVA Bancomer',
  "beneficiario"      TEXT NOT NULL DEFAULT 'ToneBox México S.A. de C.V.',
  "clabeNumber"       TEXT NOT NULL DEFAULT '012180004567890123',
  "comprobantesEmail" TEXT NOT NULL DEFAULT 'pagos@tonebox.mx',
  "rfc"               TEXT,
  "razonSocial"       TEXT,
  "usoCFDI"           TEXT,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- Seed de fila por defecto
INSERT INTO "company_settings" ("id", "bankName", "beneficiario", "clabeNumber", "comprobantesEmail", "updatedAt")
VALUES ('tonebox', 'BBVA Bancomer', 'ToneBox México S.A. de C.V.', '012180004567890123', 'pagos@tonebox.mx', NOW())
ON CONFLICT ("id") DO NOTHING;
