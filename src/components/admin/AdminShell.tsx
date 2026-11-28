'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Verificando credenciales administrativas...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Panel de Métricas' },
    { href: '/admin/documents', label: 'Gestión Documental (CRUD)' },
    { href: '/admin/explorer', label: 'Gestión de Carpetas' },
    ...(isAdmin ? [{ href: '/admin/users', label: 'Subadministradores' }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Barra Lateral Administrativa */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="pb-4 border-b border-slate-800 mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Panel Administrativo
            </span>
            <h2 className="text-sm font-bold text-white mt-1">{user.nombreCompleto}</h2>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {user.rol}
            </span>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/30 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Dinámico del Submódulo */}
      <section className="flex-1 p-6 md:p-8 bg-slate-50 overflow-y-auto">{children}</section>
    </div>
  );
}
