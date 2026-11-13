import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Búsqueda Semántica y Gestión Documental | UTS',
  description:
    'Plataforma institucional de búsqueda semántica con IA y gestión documental de las Unidades Tecnológicas de Santander.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* Barra de navegación superior institucional */}
        <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo y Nombre Institucional */}
            <Link href="/search" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white font-extrabold flex items-center justify-center text-lg tracking-wider shadow-sm group-hover:bg-emerald-800 transition">
                UTS
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Gestión Documental e IA
                </span>
                <span className="text-xs text-slate-500">Unidades Tecnológicas de Santander</span>
              </div>
            </Link>

            {/* Navegación y Accesos */}
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/search"
                className="text-slate-600 hover:text-emerald-700 transition px-2 py-1"
              >
                Buscador
              </Link>
              <Link
                href="/explorer"
                className="text-slate-600 hover:text-emerald-700 transition px-2 py-1"
              >
                Árbol de Carpetas
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-emerald-700 transition"
              >
                Acceso Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Footer institucional */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              © 2026 Unidades Tecnológicas de Santander — Plataforma Base Documental y Motor de
              Búsqueda Semántica con IA.
            </p>
            <p className="mt-1 text-slate-400">
              Proyecto de Grado en Ingeniería de Sistemas | Acceso de Solo Lectura a Dropbox UTS
              (RNF-03).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
