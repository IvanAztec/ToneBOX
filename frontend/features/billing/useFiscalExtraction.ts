'use client';

import { useState, useCallback } from 'react';
import type { FiscalData, ExtractionStatus, CSFExtractionResult } from './types';

export function useFiscalExtraction() {
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [result, setResult] = useState<CSFExtractionResult>({
    status: 'idle', data: null, url: null, error: null,
  });

  const upload = useCallback(async (file: File): Promise<CSFExtractionResult> => {
    setStatus('uploading');
    setResult({ status: 'uploading', data: null, url: null, error: null });

    const formData = new FormData();
    formData.append('csf', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/billing/csf/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const json: { success?: boolean; data?: Partial<FiscalData>; url?: string; error?: string } = await res.json();

      if (!res.ok) {
        const r: CSFExtractionResult = {
          status: 'error', data: null, url: null,
          error: json.error ?? 'Error al procesar el archivo',
        };
        setStatus('error');
        setResult(r);
        return r;
      }

      const r: CSFExtractionResult = {
        status: 'success',
        data: json.data ?? null,
        url: json.url ?? null,
        error: null,
      };
      setStatus('success');
      setResult(r);
      return r;
    } catch {
      const r: CSFExtractionResult = {
        status: 'error', data: null, url: null, error: 'Error de conexión',
      };
      setStatus('error');
      setResult(r);
      return r;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult({ status: 'idle', data: null, url: null, error: null });
  }, []);

  return { status, result, upload, reset };
}
