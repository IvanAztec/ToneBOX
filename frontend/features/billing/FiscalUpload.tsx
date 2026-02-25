'use client';

import { useState, useRef, type DragEvent } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFiscalExtraction } from './useFiscalExtraction';
import type { FiscalData } from './types';

const GREEN  = '#00C896';
const MUTED  = '#7A8494';
const AMBER  = '#FFB400';
const BORDER = 'rgba(255,255,255,0.08)';

interface FiscalUploadProps {
  onExtracted: (data: Partial<FiscalData>, url: string | null) => void;
}

export function FiscalUpload({ onExtracted }: FiscalUploadProps) {
  const { status, result, upload, reset } = useFiscalExtraction();
  const [dragging, setDragging]           = useState(false);
  const [filename, setFilename]           = useState<string | null>(null);
  const inputRef                          = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return;
    setFilename(file.name);
    const r = await upload(file);
    if (r.status === 'success' && r.data) onExtracted(r.data, r.url);
  };

  const onDrop      = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
  const onDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleReset = () => { reset(); setFilename(null); if (inputRef.current) inputRef.current.value = ''; };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(0,200,150,0.07)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: GREEN }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: GREEN }}>CSF procesada — datos auto-rellenados</p>
          <p className="text-[10px] truncate" style={{ color: MUTED }}>{filename}</p>
        </div>
        <button onClick={handleReset} className="p-1 rounded-lg hover:bg-white/5" style={{ color: MUTED }}>
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px dashed ${BORDER}` }}>
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: GREEN }} />
        <p className="text-xs" style={{ color: MUTED }}>Extrayendo datos de {filename}…</p>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: dragging ? 'rgba(0,200,150,0.07)' : 'rgba(255,255,255,0.02)',
          border: `1px dashed ${dragging ? 'rgba(0,200,150,0.4)' : 'rgba(255,255,255,0.15)'}`,
        }}>
        <Upload className="w-4 h-4" style={{ color: dragging ? GREEN : MUTED }} />
        <p className="text-[11px] text-center" style={{ color: MUTED }}>
          <span style={{ color: GREEN, fontWeight: 700 }}>Subir Constancia Fiscal (CSF)</span>
          {' '}para auto-rellenar datos
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>PDF • opcional</p>
      </div>

      {status === 'error' && (
        <p className="flex items-center gap-1 text-[10px] mt-1.5" style={{ color: AMBER }}>
          <AlertCircle className="w-3 h-3" />
          {result.error ?? 'No se pudo leer el PDF — llena los datos manualmente'}
        </p>
      )}

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
