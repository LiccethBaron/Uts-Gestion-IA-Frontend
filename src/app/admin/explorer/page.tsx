import React from 'react';
import { FolderExplorerClient } from '../../../components/document/FolderExplorerClient';

export const instant = false;

export default function AdminExplorerPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestión y Árbol de Carpetas
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Explora, crea, renombra, reubica o elimina directorios institucionales sincronizados
          con Dropbox UTS (RF-10).
        </p>
      </div>

      <FolderExplorerClient />
    </div>
  );
}
