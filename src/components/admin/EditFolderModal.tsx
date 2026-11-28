'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { FolderItem, UpdateFolderPayload } from '../../types/document.types';
import { FolderHierarchySelector } from './FolderHierarchySelector';

interface EditFolderModalProps {
  folder: FolderItem;
  folders: FolderItem[];
  rootContainer: FolderItem | null;
  excludedFolderIds: ReadonlySet<string>;
  isRefreshingFolders?: boolean;
  onRefreshFolders?: () => void;
  onClose: () => void;
  onUpdated: (folder: FolderItem) => void;
}

function validateFolderName(rawName: string): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return 'El nombre de la carpeta es obligatorio.';
  }
  if (trimmed.length > 255) {
    return 'El nombre de la carpeta no puede superar 255 caracteres.';
  }
  if (trimmed.includes('/')) {
    return 'El nombre de la carpeta no debe contener el carácter «/».';
  }
  return null;
}

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  folder,
  folders,
  rootContainer,
  excludedFolderIds,
  isRefreshingFolders = false,
  onRefreshFolders,
  onClose,
  onUpdated,
}) => {
  const [nombre, setNombre] = useState(folder.nombre);
  const [carpetaPadreId, setCarpetaPadreId] = useState(
    folder.carpetaPadreId ?? rootContainer?.id ?? ''
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const trimmedName = nombre.trim();
  const nameChanged = trimmedName !== folder.nombre;
  const parentChanged =
    Boolean(carpetaPadreId) && carpetaPadreId !== (folder.carpetaPadreId ?? '');
  const hasChanges = nameChanged || parentChanged;

  const targetParent =
    folders.find((item) => item.id === carpetaPadreId) ??
    (folder.carpetaPadreId
      ? folders.find((item) => item.id === folder.carpetaPadreId)
      : rootContainer) ??
    rootContainer;
  const baseTargetPath = (
    targetParent?.rutaCompleta ?? '/BASE_DOCUMENTAL'
  ).replace(/\/+$/, '');
  const previewPath = `${baseTargetPath}/${trimmedName || folder.nombre}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateFolderName(nombre);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    const payload: UpdateFolderPayload = {};
    if (nameChanged) {
      payload.nombre = trimmedName;
    }
    if (parentChanged) {
      payload.carpetaPadreId = carpetaPadreId;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const updated = await documentService.updateFolder(folder.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No fue posible renombrar o reubicar la carpeta en el servidor.'
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
      aria-labelledby="edit-folder-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2
              id="edit-folder-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Renombrar o Mover Carpeta
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              Editando: <span className="font-semibold text-slate-700">{folder.nombre}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <strong className="font-semibold">Error al actualizar la carpeta:</strong>{' '}
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="edit-folder-name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nombre de la carpeta <span className="text-red-600">*</span>
            </label>
            <input
              id="edit-folder-name"
              type="text"
              maxLength={255}
              value={nombre}
              disabled={isSubmitting}
              onChange={(e) => {
                setNombre(e.target.value);
                if (nameError) setNameError(null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100"
            />
            {nameError && <p className="mt-1 text-[11px] text-red-600">{nameError}</p>}
          </div>

          <FolderHierarchySelector
            idPrefix="edit-folder"
            label="Ubicación / Carpeta Padre"
            folders={folders}
            isLoading={false}
            value={carpetaPadreId}
            onChange={setCarpetaPadreId}
            allowRootSelection
            excludedFolderIds={excludedFolderIds}
            emptyLabel={
              rootContainer
                ? `Raíz institucional (${rootContainer.nombre})`
                : 'Raíz institucional (/BASE_DOCUMENTAL)'
            }
            onRefresh={onRefreshFolders}
            isRefreshing={isRefreshingFolders}
          />

          {hasChanges && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-[11px]">
              <div>
                <span className="font-semibold text-slate-600">Ruta actual:</span>
                <p className="font-mono text-slate-500 break-all mt-0.5">
                  {folder.rutaCompleta}
                </p>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="font-semibold text-emerald-800">Nueva ruta:</span>
                <p className="font-mono text-emerald-700 break-all mt-0.5">
                  {previewPath}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
            <strong className="font-semibold">Sincronización en cascada:</strong> al guardar
            un cambio de nombre o ubicación, el directorio se moverá en Dropbox y se
            actualizarán automáticamente las rutas de todas sus subcarpetas y documentos hijos.
          </div>

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
              disabled={isSubmitting || !hasChanges}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Moviendo y actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
