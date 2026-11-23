'use client';

import React from 'react';
import Link from 'next/link';
import { FolderItem } from '../../types/document.types';
import { FolderTreeNode } from '../../utils/folderTree';

interface FolderDetailPanelProps {
  selectedNode: FolderTreeNode | null;
  breadcrumbs: FolderItem[];
  onSelectFolder: (folderId: string) => void;
  isRootSelected?: boolean;
  onCreateSubfolder?: (parentFolder: FolderItem) => void;
  onEditFolder?: (folder: FolderItem) => void;
  onDeleteFolder?: (node: FolderTreeNode) => void;
}

export const FolderDetailPanel: React.FC<FolderDetailPanelProps> = ({
  selectedNode,
  breadcrumbs,
  onSelectFolder,
  isRootSelected = false,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
}) => {
  if (!selectedNode) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <p className="text-xs text-slate-500">
          Selecciona una carpeta del árbol izquierdo para explorar su contenido.
        </p>
      </div>
    );
  }

  const parentFolder =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* Migas de pan y navegación hacia arriba */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <nav aria-label="Ruta jerárquica" className="flex flex-wrap items-center gap-1 text-xs">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                {index > 0 && <span className="text-slate-300">/</span>}
                {isLast ? (
                  <span className="font-semibold text-emerald-800">{crumb.nombre}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectFolder(crumb.id)}
                    className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    {crumb.nombre}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {parentFolder && (
          <button
            type="button"
            onClick={() => onSelectFolder(parentFolder.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Subir nivel</span>
          </button>
        )}
      </div>

      {/* Información principal de la carpeta */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span>Directorio Institucional</span>
            {isRootSelected && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Carpeta raíz protegida
              </span>
            )}
          </div>
        </div>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {selectedNode.folder.nombre}
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-mono break-all">
          Ruta canónica: {selectedNode.folder.rutaCompleta}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
              {selectedNode.children.length} subcarpeta(s) directa(s)
            </span>
            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
              {selectedNode.aggregateDocumentCount} documento(s) indexado(s)
            </span>
          </div>

          {(onCreateSubfolder || onEditFolder || onDeleteFolder) && (
            <div className="flex flex-wrap items-center gap-2">
              {onCreateSubfolder && (
                <button
                  type="button"
                  onClick={() => onCreateSubfolder(selectedNode.folder)}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Nueva subcarpeta</span>
                </button>
              )}

              {!isRootSelected && onEditFolder && (
                <button
                  type="button"
                  onClick={() => onEditFolder(selectedNode.folder)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Renombrar / Mover</span>
                </button>
              )}

              {!isRootSelected && onDeleteFolder && (
                <button
                  type="button"
                  onClick={() => onDeleteFolder(selectedNode)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subcarpetas hijas directas */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Subcarpetas dentro de este directorio
        </h3>

        {selectedNode.children.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
            Esta carpeta no contiene subcarpetas hijas. Puedes consultar directamente los
            documentos almacenados aquí desde el buscador.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedNode.children.map((child) => (
              <button
                key={child.folder.id}
                type="button"
                onClick={() => onSelectFolder(child.folder.id)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-800 truncate">
                      {child.folder.nombre}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {child.subfolderCount > 0
                        ? `${child.subfolderCount} subcarpeta(s)`
                        : 'Carpeta final'}
                      {' · '}
                      {child.aggregateDocumentCount} doc(s)
                    </p>
                  </div>
                </div>

                <svg
                  className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-emerald-700 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Acción hacia el buscador semántico filtrado */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Para consultar documentos específicos dentro de este directorio con asistencia de IA:
        </p>
        <Link
          href={`/search?carpetaId=${selectedNode.folder.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
        >
          <span>Buscar en esta carpeta</span>
        </Link>
      </div>
    </div>
  );
};
