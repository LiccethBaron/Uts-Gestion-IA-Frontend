'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { FolderItem } from '../../types/document.types';
import { FolderHierarchySelector } from './FolderHierarchySelector';

interface CreateFolderModalProps {
  folders: FolderItem[];
  initialParentId: string;
  rootContainer: FolderItem | null;
  isRefreshingFolders?: boolean;
  onRefreshFolders?: () => void;
  onClose: () => void;
  onCreated: (folder: FolderItem) => void;
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

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  folders,
  initialParentId,
  rootContainer,
  isRefreshingFolders = false,
  onRefreshFolders,
  onClose,
  onCreated,
}) => {
  const [nombre, setNombre] = useState('');
  const [carpetaPadreId, setCarpetaPadreId] = useState(initialParentId);
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

  const selectedParent =
    folders.find((folder) => folder.id === carpetaPadreId) ?? rootContainer;
  const baseParentPath = (
    selectedParent?.rutaCompleta ?? '/BASE_DOCUMENTAL'
  ).replace(/\/+$/, '');
  const trimmedName = nombre.trim();
  const previewPath = `${baseParentPath}/${trimmedName || '<nombre_carpeta>'}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateFolderName(nombre);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const created = await documentService.createFolder({
        nombre: trimmedName,
        carpetaPadreId: carpetaPadreId || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No fue posible crear la carpeta en Dropbox y en la base de datos.'
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
      aria-labelledby="create-folder-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2
              id="create-folder-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Crear Nueva Carpeta Institucional
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Se creará directamente en Dropbox y quedará registrada con auditoría.
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
              <strong className="font-semibold">Error al crear la carpeta:</strong>{' '}
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="create-folder-name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nombre de la carpeta <span className="text-red-600">*</span>
            </label>
            <input
              id="create-folder-name"
              type="text"
              autoFocus
              maxLength={255}
              value={nombre}
              disabled={isSubmitting}
              onChange={(e) => {
                setNombre(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Ej. 07. ACTAS DE COMITÉ"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Máximo 255 caracteres. No incluyas el carácter «/».
            </p>
            {nameError && <p className="mt-1 text-[11px] text-red-600">{nameError}</p>}
          </div>

          <FolderHierarchySelector
            idPrefix="create-folder"
            label="Carpeta Padre"
            folders={folders}
            isLoading={false}
            value={carpetaPadreId}
            onChange={setCarpetaPadreId}
            allowRootSelection
            emptyLabel={
              rootContainer
                ? `Raíz institucional (${rootContainer.nombre})`
                : 'Raíz institucional (/BASE_DOCUMENTAL)'
            }
            onRefresh={onRefreshFolders}
            isRefreshing={isRefreshingFolders}
          />

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-1">
            <p className="text-[11px] font-semibold text-blue-900">
              Vista previa de la ruta destino en Dropbox
            </p>
            <p className="text-xs font-mono text-blue-800 break-all">{previewPath}</p>
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creando carpeta...' : 'Crear Carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
