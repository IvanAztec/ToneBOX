'use client';

import { ReactNode, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, Building2, Settings,
  LogOut, Menu, X, Bell, Package, Truck, AlertTriangle, Megaphone,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import ToneBoxLogo from '@/components/shared/ToneBoxLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Panel Principal',    href: '/dashboard',            icon: LayoutDashboard },
  { name: 'Inventario CT',      href: '/admin/inventory',      icon: Package,       adminOnly: true },
  { name: 'Importar Catálogos', href: '/admin/providers',      icon: Truck,         adminOnly: true },
  { name: 'Zona Crítica',       href: '/admin/critical',       icon: AlertTriangle, adminOnly: true },
  { name: 'Campañas de Cierre', href: '/admin/campanas',       icon: Megaphone,     adminOnly: true },
  { name: 'Mis Pedidos',        href: '/dashboard/billing',    icon: CreditCard },
  { name: 'CRM Clientes',       href: '/dashboard/teams',      icon: Users, adminOnly: true },
  { name: 'Mi Empresa',         href: '/dashboard/workspaces', icon: Building2 },
  { name: 'Configuración',      href: '/dashboard/settings',   icon: Settings },
];

const INK  = '#0B0E14';
const INK2 = '#161B26';
const GREEN = '#00C896';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = '#7A8494';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname   = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const closeSidebar   = useCallback(() => setSidebarOpen(false), []);
  const toggleUserMenu = useCallback(() => setUserMenuOpen(p => !p), []);
  const handleLogout   = useCallback(() => logout(), [logout]);

  const isAdmin    = user?.role === 'admin';
  const visibleNav = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen" style={{ background: INK }}>

      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: INK2, borderRight: `1px solid ${BORDER}` }}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div
            className="flex items-center justify-between px-5 h-16"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <Link href="/dashboard">
              <ToneBoxLogo size="sm" />
            </Link>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: MUTED }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge admin */}
          {isAdmin && (
            <div className="px-5 py-2" style={{ background: 'rgba(0,200,150,0.08)', borderBottom: `1px solid rgba(0,200,150,0.15)` }}>
              <p className="font-mono text-[10px] font-black tracking-[3px] uppercase" style={{ color: GREEN }}>
                Superadmin
              </p>
            </div>
          )}

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-sm"
                  style={{
                    background: isActive ? 'rgba(0,200,150,0.1)' : 'transparent',
                    color:      isActive ? GREEN : MUTED,
                    fontWeight: isActive ? 700 : 500,
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                >
                  <span style={{ color: isActive ? GREEN : MUTED }}><item.icon className="w-4 h-4" /></span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Usuario */}
          <div className="p-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: 'rgba(0,200,150,0.15)', color: GREEN }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'white' }}>
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs truncate" style={{ color: MUTED }}>
                  {user?.email || ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: MUTED }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#FF5C28'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = MUTED}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="lg:pl-64">

        {/* Barra superior */}
        <header
          className="sticky top-0 z-30"
          style={{ background: 'rgba(11,14,20,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">

            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: MUTED }}
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Breadcrumb / título de página */}
              <span className="hidden sm:block font-mono text-[10px] tracking-[2px] uppercase" style={{ color: MUTED }}>
                // ToneBOX Admin
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="relative p-2 rounded-xl transition-colors"
                style={{ color: MUTED }}
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5C28] rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
                  style={{ border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs"
                    style={{ background: 'rgba(0,200,150,0.2)', color: GREEN }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {user?.name?.split(' ')[0] || 'Usuario'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50"
                    style={{ background: INK2, border: `1px solid ${BORDER}`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                  >
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                      onClick={() => setUserMenuOpen(false)}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'white'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
                    >
                      Configuración
                    </Link>
                    <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium transition-colors"
                      style={{ color: '#FF5C28' }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido de página */}
        <main className="p-4 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
