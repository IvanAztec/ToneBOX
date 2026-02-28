'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, useToast } from '../../providers';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const INK = '#0B0E14';
const INK2 = '#161B26';
const GREEN = '#00C896';
const BORDER = 'rgba(255,255,255,0.1)';
const MUTED = '#7A8494';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const togglePasswordVisibility = useCallback(() => setShowPassword(p => !p), []);

  const onSubmit = useCallback(async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      addToast('¡Bienvenido de nuevo!', 'success');
      router.push('/dashboard');
    } catch {
      addToast('Correo o contraseña incorrectos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [login, addToast, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: INK }}
    >
      {/* Fondo con blob verde */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: -200, right: -200, width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-md w-full relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <Link href="/">
            <ToneBoxLogo size="lg" />
          </Link>
          <p className="font-mono text-[10px] tracking-[3px] uppercase mt-4" style={{ color: MUTED }}>
            // Acceso Interno
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: INK2, border: `1px solid ${BORDER}` }}
        >
          <h1 className="font-syne text-2xl font-extrabold mb-1 tracking-tight" style={{ color: 'white' }}>
            Centro de Control ToneBOX
          </h1>
          <p className="mb-8 text-sm" style={{ color: MUTED }}>
            Gestión inteligente de pedidos y logística en tiempo real
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${BORDER}`,
                    color: 'white',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = GREEN)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: '#FF5C28' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: MUTED }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm font-medium focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${BORDER}`,
                    color: 'white',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = GREEN)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: MUTED }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: '#FF5C28' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium transition-colors"
                style={{ color: MUTED }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = GREEN}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = MUTED}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-syne font-bold py-3.5 rounded-xl transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: GREEN, color: INK, border: 'none', fontSize: 15 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión →'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm" style={{ color: MUTED }}>
            ¿No tienes cuenta?{' '}
            <Link
              href="/auth/register"
              className="font-semibold transition-colors"
              style={{ color: GREEN }}
            >
              Regístrate
            </Link>
          </p>
        </div>

        {/* Back to landing */}
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.2)'}
          >
            ← Volver a tonebox.mx
          </Link>
        </p>
      </div>
    </div>
  );
}
