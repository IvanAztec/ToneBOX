'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Building2, Phone, Mail, ArrowLeft,
  Send, CheckCircle2, AlertTriangle, Loader2, Bot,
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/app/providers';

interface TelegramStatus {
  configured: boolean;
  hasToken: boolean;
  hasChatId: boolean;
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">{value || <span className="text-gray-300 font-normal">No configurado</span>}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [tgStatus, setTgStatus]         = useState<TelegramStatus | null>(null);
  const [tgToken, setTgToken]           = useState('');
  const [tgChatId, setTgChatId]         = useState('');
  const [testing, setTesting]           = useState(false);
  const [testResult, setTestResult]     = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, authLoading, router]);

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
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-800">Perfil de cuenta</h2>
          </div>
          <div className="px-5 py-2">
            <Field icon={<User className="w-4 h-4" />}     label="Nombre"    value={user?.name} />
            <Field icon={<Mail className="w-4 h-4" />}     label="Email"     value={user?.email} />
            <Field icon={<Building2 className="w-4 h-4" />} label="Empresa"  value={(user as any)?.empresa} />
            <Field icon={<User className="w-4 h-4" />}     label="Cargo"     value={(user as any)?.cargo} />
            <Field icon={<Phone className="w-4 h-4" />}    label="WhatsApp"  value={(user as any)?.whatsapp} />
          </div>
        </div>

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
                  <span>Abre Telegram → busca <code className="bg-blue-100 px-1 rounded">@BotFather</code> → envía <code className="bg-blue-100 px-1 rounded">/newbot</code> → sigue los pasos → copia el <strong>API Token</strong> (formato: <code className="bg-blue-100 px-1 rounded">123456:ABCdef...</code>)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-black w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                  <span>Inicia una conversación con tu bot (búscalo por su username) → envíale cualquier mensaje. Luego abre en el navegador: <code className="bg-blue-100 px-1 rounded break-all">https://api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</code> → busca el campo <code className="bg-blue-100 px-1 rounded">chat.id</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-black w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                  <span>Pega los valores en <code className="bg-blue-100 px-1 rounded">backend/.env</code> en las variables <code className="bg-blue-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> y <code className="bg-blue-100 px-1 rounded">TELEGRAM_CHAT_ID</code>, luego reinicia el servidor y usa el botón de prueba</span>
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
