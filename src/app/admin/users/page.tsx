'use client';

import React from 'react';

export default function AdminUsersPage() {
  const users = [
    {
      id: 'usr-1',
      nombreCompleto: 'Ing. Administrador General UTS',
      email: 'admin.general@uts.edu.co',
      rol: 'ADMINISTRADOR',
      estadoActivo: true,
    },
    {
      id: 'usr-2',
      nombreCompleto: 'Lic. Coordinador Académico',
      email: 'gestion.academica@uts.edu.co',
      rol: 'SUBADMINISTRADOR',
      estadoActivo: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Subadministradores (RF-11)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Control de cuentas autorizadas para gestionar metadatos e índices del repositorio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Modal de registro de nuevo subadministrador (CU06)')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
        >
          <span>+ Nuevo Administrador</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
            <tr>
              <th className="py-3 px-4">Nombre Completo</th>
              <th className="py-3 px-4">Correo Electrónico</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-900">{u.nombreCompleto}</td>
                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.rol === 'ADMINISTRADOR'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

