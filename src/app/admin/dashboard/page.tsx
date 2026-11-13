'use client';

import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Dashboard de Métricas y Auditoría (RF-14)
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Supervisión de consultas semánticas, tasas de descarga y sincronización de índices
          vectoriales.
        </p>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Documentos Indexados</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">1,248</p>
          <span className="text-[11px] text-emerald-600 font-medium">● 100% vectorizados en pgvector</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Consultas Semánticas</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">8,492</p>
          <span className="text-[11px] text-slate-500">Últimos 30 días</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Top-5 Accuracy (IA)</span>
          <p className="mt-2 text-2xl font-extrabold text-blue-700">91.4%</p>
          <span className="text-[11px] text-emerald-600 font-medium">Supera umbral meta ($\ge 85\%$)</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Descargas Seguras</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">3,120</p>
          <span className="text-[11px] text-slate-500">Vía API Dropbox (Solo lectura)</span>
        </div>
      </div>

      {/* Historial Reciente de Auditoría */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Últimas Consultas y Descargas Registradas (RF-14)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Tipo de Evento</th>
                <th className="py-2.5 px-3">Término Consultado (Sanitizado)</th>
                <th className="py-2.5 px-3">Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-mono text-[11px]">Hoy 15:42</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                    BÚSQUEDA SEMÁNTICA
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-800">&ldquo;requisitos de homologacion de materias&rdquo;</td>
                <td className="py-2.5 px-3 font-semibold">7</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-[11px]">Hoy 15:20</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    DESCARGA
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-800">MAN-SGC-002 Manual del Sistema de Calidad</td>
                <td className="py-2.5 px-3 font-semibold">1</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-[11px]">Hoy 14:05</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                    BÚSQUEDA CONVENCIONAL
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-800">&ldquo;calendario academico 2024&rdquo;</td>
                <td className="py-2.5 px-3 font-semibold">12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

