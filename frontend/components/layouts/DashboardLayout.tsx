'use client';

import { ReactNode, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, Building2, Settings,
  LogOut, Menu, X, Bell, Search, ChevronDown, Package, Zap, Truck,
} from 'lucide-react';
import { useAuth } from '@/app/providers';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Panel Principal',    href: '/dashboard',             icon: LayoutDashboard },
  { name: 'Inventario CT',      href: '/admin/inventory',       icon: Package,  adminOnly: true },
  { name: 'Importar Catálogos', href: '/admin/providers',       icon: Truck,    adminOnly: true },
  { name: 'Facturación',        href: '/dashboard/billing',     icon: CreditCard },
  { name: 'Equipo',             href: '/dashboard/teams',       icon: Users },
  { name: 'Espacios de Trabajo',href: '/dashboard/workspaces',  icon: Building2 },
  { name: 'Configuración',      href: '/dashboard/settings',    icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const closeSidebar   = useCallback(() => setSidebarOpen(false), []);
  const toggleUserMenu = useCallback(() => setUserMenuOpen(p => !p), []);
  const handleLogout   = useCallback(() => logout(), [logout]);

  const isAdmin = user?.role === 'admin';
  const visibleNav = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">ToneBOX</span>
            </Link>
            <button onClick={closeSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Info de rol */}
          {isAdmin && (
            <div className="px-4 py-2 bg-green-50 border-b border-green-100">
              <p className="text-[11px] font-black text-green-700 uppercase tracking-widest">
                Superadmin
              </p>
            </div>
          )}

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-sm ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sección usuario */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Contenido principal */}
      <div className="lg:pl-64">

        {/* Barra superior */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5 text-gray-500" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm w-48 text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Notificaciones">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Configuración
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 font-medium"
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
