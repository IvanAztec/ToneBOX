'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Building2, Phone, Mail, ArrowLeft, Pencil,
  Save, X, Send, CheckCircle2, AlertTriangle, Loader2, Bot, Megaphone,
} from 'lucide-react';

interface Template { name: string; subtitle: string; emoji: string; template: string; }
type Templates = { A: Template; B: Template; C: Template };
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

interface TelegramStatus {
  configured: boolean;
  hasToken: boolean;
  hasChatId: boolean;
}

interface ProfileForm {
  name: string;
  empresa: string;
  cargo: string;
  whatsapp: string;
}

// ── Campo de solo lectura ─────────────────────────────────────────────────────
function ReadField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">
          {value || <span className="text-gray-300 font-normal">No configurado</span>}
        </p>
      </div>
    </div>
  );
}

// ── Campo editable ────────────────────────────────────────────────────────────
function EditField({
  icon, label, name, value, onChange, type = 'text', placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  name: keyof ProfileForm;
  value: string;
  onChange: (name: keyof ProfileForm, value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-2.5">{icon}</span>
      <div className="flex-1">
        <label className="text-xs text-gray-400 font-medium">{label}</label>
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder={placeholder || `Escribe tu ${label.toLowerCase()}...`}
          className="mt-0.5 w-full text-sm text-gray-900 font-semibold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router  = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ── Perfil ─────────────────────────────────────────────────────────────────
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveResult, setSaveResult]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [form, setForm]                 = useState<ProfileForm>({
    name:     '',
    empresa:  '',
    cargo:    '',
    whatsapp: '',
  });

  // Inicializa form cuando el user cargue
  useEffect(() => {
    if (user) {
      setForm({
        name:     user.name ?? '',
        empresa:  (user as any).empresa ?? '',
        cargo:    (user as any).cargo ?? '',
        whatsapp: (user as any).whatsapp ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const handleFieldChange = (name: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/me', {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ ok: true, msg: '✅ Perfil actualizado correctamente.' });
        setEditing(false);
        // Refresca el user en el contexto de auth
        window.dispatchEvent(new Event('auth-refresh'));
      } else {
        setSaveResult({ ok: false, msg: `❌ ${data.error ?? 'Error al guardar'}` });
      }
    } catch {
      setSaveResult({ ok: false, msg: '❌ No se pudo conectar al backend.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaura el form al estado original
    if (user) {
      setForm({
        name:     user.name ?? '',
        empresa:  (user as any).empresa ?? '',
        cargo:    (user as any).cargo ?? '',
        whatsapp: (user as any).whatsapp ?? '',
      });
    }
    setEditing(false);
    setSaveResult(null);
  };

  // ── Templates de Marketing ────────────────────────────────────────────────
  const [templates, setTemplates]         = useState<Templates | null>(null);
  const [tplSaving, setTplSaving]         = useState(false);
  const [tplResult, setTplResult]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [editingTpl, setEditingTpl]       = useState<'A' | 'B' | 'C' | null>(null);
  const [tplDraft, setTplDraft]           = useState('');

  useEffect(() => {
    if (!authLoading) {
      fetch('/api/admin/message-templates')
        .then(r => r.json())
        .then(d => { if (d.success) setTemplates(d.templates); })
        .catch(() => {});
    }
  }, [authLoading]);

  const startEditTpl = (key: 'A' | 'B' | 'C') => {
    setEditingTpl(key);
    setTplDraft(templates?.[key]?.template ?? '');
    setTplResult(null);
  };

  const saveTpl = async () => {
    if (!editingTpl || !templates) return;
    const updated = { ...templates, [editingTpl]: { ...templates[editingTpl], template: tplDraft } };
    setTplSaving(true);
    setTplResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/message-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ templates: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(updated);
        setEditingTpl(null);
        setTplResult({ ok: true, msg: '✅ Template guardado.' });
      } else {
        setTplResult({ ok: false, msg: `❌ ${data.error}` });
      }
    } catch {
      setTplResult({ ok: false, msg: '❌ No se pudo guardar.' });
    } finally {
      setTplSaving(false);
    }
  };

  // ── Telegram ───────────────────────────────────────────────────────────────
  const [tgStatus, setTgStatus]     = useState<TelegramStatus | null>(null);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetch('/api/admin/telegram/status')
        .then(r => r.json())
        .then(setTgStatus)
        .catch(() => setTgStatus({ configured: false, hasToken: false, hasChatId: false }));
    }
  }, [authLoading]);

  const handleTelegramTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res  = await fetch('/api/admin/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestResult({ ok: true, msg: `✅ Mensaje enviado (ID ${data.messageId}). Revisa tu Telegram.` });
      } else {
        setTestResult({ ok: false, msg: `❌ Error: ${data.error}` });
      }
    } catch {
      setTestResult({ ok: false, msg: '❌ No se pudo conectar al backend.' });
    } finally {
      setTesting(false);
    }
  };

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500 mt-0.5">Perfil de cuenta y conexiones del sistema</p>
          </div>
        </div>

        {/* ── Perfil ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-800">Perfil de cuenta</h2>
            </div>
            {!editing ? (
              <button
                onClick={() => { setEditing(true); setSaveResult(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          <div className="px-5 py-2">
            {/* Email — siempre solo lectura */}
            <ReadField icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email} />

            {editing ? (
              <>
                <EditField
                  icon={<User className="w-4 h-4" />}
                  label="Nombre"
                  name="name"
                  value={form.name}
                  onChange={handleFieldChange}
                  placeholder="Tu nombre completo"
                />
                <EditField
                  icon={<Building2 className="w-4 h-4" />}
                  label="Empresa"
                  name="empresa"
                  value={form.empresa}
                  onChange={handleFieldChange}
                  placeholder="Nombre de tu empresa"
                />
                <EditField
                  icon={<User className="w-4 h-4" />}
                  label="Cargo"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleFieldChange}
                  placeholder="Tu puesto o cargo"
                />
                <EditField
                  icon={<Phone className="w-4 h-4" />}
                  label="WhatsApp"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleFieldChange}
                  type="tel"
                  placeholder="52 844 123 4567"
                />
              </>
            ) : (
              <>
                <ReadField icon={<User className="w-4 h-4" />}     label="Nombre"   value={user?.name} />
                <ReadField icon={<Building2 className="w-4 h-4" />} label="Empresa"  value={(user as any)?.empresa} />
                <ReadField icon={<User className="w-4 h-4" />}     label="Cargo"    value={(user as any)?.cargo} />
                <ReadField icon={<Phone className="w-4 h-4" />}    label="WhatsApp" value={(user as any)?.whatsapp} />
              </>
            )}
          </div>

          {saveResult && (
            <div className={`mx-5 mb-4 rounded-lg border p-3 text-sm font-medium ${saveResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {saveResult.msg}
            </div>
          )}
        </div>

        {/* ── Templates de Marketing ── */}
        {templates && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-gray-800">Templates de Marketing</h2>
              <span className="text-xs text-gray-400 ml-auto">Variables: {'{nombre}'} {'{empresa}'} {'{modelo}'} {'{impresora}'} {'{daysRemaining}'} {'{daysAgo}'}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {(['A', 'B', 'C'] as const).map(key => {
                const t = templates[key];
                const isEditing = editingTpl === key;
                return (
                  <div key={key} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-gray-900">{t.emoji} {key} — {t.name}</p>
                        <p className="text-xs text-gray-400">{t.subtitle}</p>
                      </div>
                      {!isEditing ? (
                        <button onClick={() => startEditTpl(key)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all">
                          <Pencil className="w-3.5 h-3.5" />Editar
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingTpl(null); setTplResult(null); }} className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                            <X className="w-3.5 h-3.5" />Cancelar
                          </button>
                          <button onClick={saveTpl} disabled={tplSaving} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50">
                            {tplSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={tplDraft}
                        onChange={e => setTplDraft(e.target.value)}
                        rows={5}
                        className="w-full text-xs text-gray-800 border border-blue-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 whitespace-pre-wrap leading-relaxed font-mono line-clamp-3">
                        {t.template}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {tplResult && (
              <div className={`mx-5 mb-4 rounded-lg border p-3 text-sm font-medium ${tplResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {tplResult.msg}
              </div>
            )}
          </div>
        )}

        {/* ── Telegram ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-gray-800">Conexión Telegram</h2>
            </div>
            {tgStatus && (
              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                tgStatus.configured
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {tgStatus.configured ? '✓ Conectado' : '⚠ Pendiente'}
              </span>
            )}
          </div>

          <div className="px-5 py-4 space-y-4">

            {/* Instrucciones BotFather */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                <Bot className="w-4 h-4" /> 3 pasos para conectar tu bot
              </p>
              <ol className="text-xs text-blue-700 space-y-2 list-none">
                <li className="flex gap-2">
                  <span className="font-black w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                  <span>Abre Telegram → busca <code className="bg-blue-100 px-1 rounded">@BotFather</code> → envía <code className="bg-blue-100 px-1 rounded">/newbot</code> → sigue los pasos → copia el <strong>API Token</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-black w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                  <span>Inicia una conversación con tu bot → envíale cualquier mensaje. Abre en el navegador: <code className="bg-blue-100 px-1 rounded break-all">https://api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</code> → busca <code className="bg-blue-100 px-1 rounded">chat.id</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-black w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                  <span>Pega los valores en <code className="bg-blue-100 px-1 rounded">backend/.env</code>: <code className="bg-blue-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> y <code className="bg-blue-100 px-1 rounded">TELEGRAM_CHAT_ID</code>, luego reinicia el servidor</span>
                </li>
              </ol>
            </div>

            {/* Estado actual */}
            {tgStatus && (
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg border p-3 text-xs font-medium ${tgStatus.hasToken ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {tgStatus.hasToken ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                  BOT_TOKEN {tgStatus.hasToken ? 'configurado' : 'pendiente'}
                </div>
                <div className={`rounded-lg border p-3 text-xs font-medium ${tgStatus.hasChatId ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {tgStatus.hasChatId ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                  CHAT_ID {tgStatus.hasChatId ? 'configurado' : 'pendiente'}
                </div>
              </div>
            )}

            {/* Botón test */}
            <button
              onClick={handleTelegramTest}
              disabled={testing || !tgStatus?.configured}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testing ? 'Enviando...' : 'Enviar mensaje de prueba'}
            </button>

            {testResult && (
              <div className={`rounded-lg border p-3 text-sm font-medium ${testResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {testResult.msg}
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
