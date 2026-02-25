export interface FiscalData {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  codigoPostal: string;
}

export type ExtractionStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface CSFExtractionResult {
  status: ExtractionStatus;
  data: Partial<FiscalData> | null;
  url: string | null;
  error: string | null;
}
