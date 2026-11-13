'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../../services/documentService';
import { FolderItem } from '../../../types/document.types';

export default function ExplorerPage() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);

  useEffect(() => {
    async function loadFolders() {
      try {
        const tree = await documentService.getFolderTree();
        setFolders(tree);
        if (tree.length > 0) setSelectedFolder(tree[0]);
      } catch {
        // En caso de que el backend aún no esté conectado, mostrar árbol demostrativo
        const mockFolders: FolderItem[] = [
          {
            id: '1',
            dropboxId: 'db-1',
            nombre: '01. GESTIÓN DIRECTIVA Y CALIDAD',
            rutaCompleta: '/UTS/01. GESTION DIRECTIVA',
            totalDocumentos: 14,
          },
          {
            id: '2',
            dropboxId: 'db-2',
            nombre: '02. PROCESOS ACADÉMICOS',
            rutaCompleta: '/UTS/02. PROCESOS ACADEMICOS',
            totalDocumentos: 38,
          },
          {
            id: '3',
            dropboxId: 'db-3',
            nombre: '03. INVESTIGACIÓN E INNOVACIÓN',
            rutaCompleta: '/UTS/03. INVESTIGACION',
            totalDocumentos: 22,
          },
          {
            id: '4',
            dropboxId: 'db-4',
            nombre: '04. EXTENSIÓN Y PROYECCIÓN SOCIAL',
            rutaCompleta: '/UTS/04. EXTENSION',
            totalDocumentos: 9,
          },
        ];
        setFolders(mockFolders);
        setSelectedFolder(mockFolders[0]);
      } finally {
        setIsLoading(false);
      }
    }
    loadFolders();
  }, []);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explorador Jerárquico de Carpetas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Navegación tradicional por la estructura oficial de directorios institucionales sincronizados
          desde Dropbox UTS (RF-10).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Carpetas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Directorios Disponibles
          </h2>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {folders.map((folder) => {
                const isSelected = selectedFolder?.id === folder.id;
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{folder.nombre}</span>
                      {folder.totalDocumentos !== undefined && (
                        <span className="ml-2 text-slate-400 font-normal">
                          {folder.totalDocumentos}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Detalle de la Carpeta Seleccionada */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          {selectedFolder ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Directorio Institucional</span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {selectedFolder.nombre}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-mono">
                Ruta canónica: {selectedFolder.rutaCompleta}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-600">
                  Para buscar documentos específicos dentro de este directorio con asistencia de IA,
                  utiliza el buscador con el filtro de carpeta activado.
                </p>
                <div className="mt-4">
                  <a
                    href={`/search?carpetaId=${selectedFolder.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
                  >
                    Buscar en esta carpeta
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Selecciona una carpeta para ver sus detalles.</p>
          )}
        </div>
      </div>
    </main>
  );
}

