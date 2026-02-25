'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CompanySettings {
  id: string;
  bankName: string;
  beneficiario: string;
  clabeNumber: string;
  comprobantesEmail: string;
  rfc: string | null;
  razonSocial: string | null;
  usoCFDI: string | null;
}

export const COMPANY_DEFAULTS: CompanySettings = {
  id:                'tonebox',
  bankName:          'BBVA Bancomer',
  beneficiario:      'ToneBox México S.A. de C.V.',
  clabeNumber:       '012180004567890123',
  comprobantesEmail: 'pagos@tonebox.mx',
  rfc:               null,
  razonSocial:       null,
  usoCFDI:           null,
};

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(COMPANY_DEFAULTS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/company-settings')
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (values: Partial<CompanySettings>): Promise<boolean> => {
    setSaving(true);
    setSaveMsg(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res  = await fetch('/api/company-settings', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSaveMsg({ ok: true, text: '✅ Configuración guardada.' });
        return true;
      }
      setSaveMsg({ ok: false, text: `❌ ${data.error?.message ?? 'Error al guardar'}` });
      return false;
    } catch {
      setSaveMsg({ ok: false, text: '❌ Error de conexión.' });
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, saveMsg, save };
}
