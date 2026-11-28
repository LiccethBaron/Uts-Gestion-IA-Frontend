'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export function HeaderNav() {
  const { isAuthenticated, isAdmin, isSubAdmin } = useAuth();
  const canAccessAdmin = isAuthenticated && (isAdmin || isSubAdmin);

  return (
    <nav className="flex items-center gap-4 text-sm font-medium">
      <Link
        href="/search"
        className="text-slate-600 hover:text-emerald-700 transition px-2 py-1"
      >
        Buscador
      </Link>

      {canAccessAdmin && (
        <Link
          href="/admin/explorer"
          className="text-slate-600 hover:text-emerald-700 transition px-2 py-1"
        >
          Gestión de Carpetas
        </Link>
      )}

      <Link
        href={canAccessAdmin ? '/admin/dashboard' : '/login'}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-emerald-700 transition"
      >
        {canAccessAdmin ? 'Panel Admin' : 'Acceso Admin'}
      </Link>
    </nav>
  );
}
