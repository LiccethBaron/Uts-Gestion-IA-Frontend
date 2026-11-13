'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login({ email, password });
    if (ok) {
      router.push('/admin/dashboard');
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-xl shadow-xs">
            UTS
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">
            Acceso Administrativo
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Módulo de Administración y Gestión del Índice Documental con IA (CU05)
          </p>
        </div>

        {/* Alerta de error */}
        {authError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {authError}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Institucional
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@correo.uts.edu.co"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <a href="/search" className="text-xs text-slate-500 hover:text-emerald-700 transition">
            ← Volver al buscador público
          </a>
        </div>
      </div>
    </main>
  );
}

