'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { FolderItem } from '../../types/document.types';
import { FolderTreeNode } from '../../utils/folderTree';

interface DeleteFolderModalProps {
  node: FolderTreeNode;
  totalDescendantFolders: number;
  onClose: () => void;
  onDeleted: (deletedFolder: FolderItem) => void;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  node,
  totalDescendantFolders,
  onClose,
  onDeleted,
}) => {
  const [confirmName, setConfirmName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasImpact = totalDescendantFolders > 0 || node.aggregateDocumentCount > 0;
  const isConfirmValid = !hasImpact || confirmName.trim() === node.folder.nombre;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleConfirmDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isConfirmValid || isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await documentService.deleteFolder(node.folder.id);
      onDeleted(node.folder);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No fue posible eliminar la carpeta en Dropbox y en la base de datos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-folder-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white shadow-xl my-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="delete-folder-modal-title"
                className="text-base font-bold text-red-900"
              >
                Eliminar Carpeta Permanentemente
              </h2>
              <p className="text-xs text-red-700 mt-0.5">
                Acción destructiva en Dropbox y PostgreSQL
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900"
            >
              <strong className="font-semibold">Error al eliminar:</strong> {submitError}
            </div>
          )}

          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-900 space-y-1.5"
          >
            <p className="font-semibold">
              Esta operación eliminará la carpeta físicamente en Dropbox y en cascada de la
              base de datos. No se puede deshacer desde esta consola.
            </p>
            <p className="text-[11px] text-red-800">
              Se eliminarán la carpeta seleccionada, todas sus subcarpetas y todos los
              documentos registrados dentro de ella.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Carpeta:</span>
              <p className="font-bold text-slate-900">{node.folder.nombre}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                Ruta canónica en Dropbox:
              </span>
              <p className="font-mono text-[11px] text-slate-700 break-all">
                {node.folder.rutaCompleta}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
                {totalDescendantFolders} subcarpeta(s) descendiente(s)
              </span>
              <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 font-medium text-red-800">
                {node.aggregateDocumentCount} documento(s) indexado(s)
              </span>
            </div>
          </div>

          {hasImpact && (
            <div>
              <label
                htmlFor="delete-folder-confirm-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Para confirmar la eliminación en cascada, escribe el nombre exacto de la
                carpeta: <span className="font-mono text-red-700">{node.folder.nombre}</span>
              </label>
              <input
                id="delete-folder-confirm-name"
                type="text"
                autoFocus
                value={confirmName}
                disabled={isSubmitting}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={node.folder.nombre}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:bg-slate-100"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isConfirmValid}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-800 disabled:opacity-50 transition"
            >
              {isSubmitting
                ? 'Eliminando...'
                : hasImpact
                  ? 'Eliminar permanentemente'
                  : 'Eliminar carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
