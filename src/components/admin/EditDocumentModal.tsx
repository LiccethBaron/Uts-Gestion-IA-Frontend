'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { useFolderDropboxFiles } from '../../hooks/useFolderDropboxFiles';
import { FolderHierarchySelector } from './FolderHierarchySelector';
import {
  DocumentFormat,
  DocumentItem,
  FolderItem,
  UpdateDocumentMetadataPayload,
} from '../../types/document.types';

interface EditDocumentModalProps {
  document: DocumentItem;
  folders: FolderItem[];
  isLoadingFolders: boolean;
  isRefreshingFolders?: boolean;
  onRefreshFolders?: () => void;
  onClose: () => void;
  onUpdated: (doc: DocumentItem) => void;
}

type DropboxSourceMode = 'upload' | 'link';

type FormField =
  | 'codigoDocumental'
  | 'nombre'
  | 'carpetaId'
  | 'formato'
  | 'tipo'
  | 'anio'
  | 'descripcion'
  | 'file'
  | 'rutaCompleta';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_FORMATS: readonly DocumentFormat[] = ['pdf', 'docx', 'doc', 'xlsx', 'xls'];
const DOCUMENT_TYPES = [
  'Manual',
  'Procedimiento',
  'Guía',
  'Formato',
  'Resolución',
  'Reglamento',
  'Acuerdo',
  'Política',
] as const;

function detectFormatFromFilename(filename: string): DocumentFormat | null {
  const ext = filename.split('.').pop()?.trim().toLowerCase() ?? '';
  return (ALLOWED_FORMATS as readonly string[]).includes(ext)
    ? (ext as DocumentFormat)
    : null;
}

function resolveInitialCarpetaId(document: DocumentItem, folders: FolderItem[]): string {
  if (document.carpetaId) return document.carpetaId;
  const matched = folders.find(
    (folder) => folder.nombre.toLowerCase() === document.carpetaMadre.toLowerCase()
  );
  return matched?.id ?? '';
}

function resolveInitialTipoSelection(tipo?: string): {
  preset: string;
  custom: string;
} {
  if (!tipo) return { preset: 'Manual', custom: '' };
  const isPreset = (DOCUMENT_TYPES as readonly string[]).includes(tipo);
  return isPreset ? { preset: tipo, custom: '' } : { preset: 'Otro', custom: tipo };
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  document,
  folders,
  isLoadingFolders,
  isRefreshingFolders = false,
  onRefreshFolders,
  onClose,
  onUpdated,
}) => {
  const initialTipo = resolveInitialTipoSelection(document.tipo);

  const [codigoDocumental, setCodigoDocumental] = useState(
    document.codigo === 'SIN CÓDIGO' ? '' : document.codigo
  );
  const [nombre, setNombre] = useState(document.nombre);
  const [carpetaId, setCarpetaId] = useState(() =>
    resolveInitialCarpetaId(document, folders)
  );
  const [formato, setFormato] = useState<DocumentFormat>(document.formato);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>(initialTipo.preset);
  const [tipoPersonalizado, setTipoPersonalizado] = useState<string>(initialTipo.custom);
  const [anio, setAnio] = useState(String(document.anio || 2026));
  const [descripcion, setDescripcion] = useState(document.descripcion || '');

  const [replaceDropboxFile, setReplaceDropboxFile] = useState(false);
  const [sourceMode, setSourceMode] = useState<DropboxSourceMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rutaCompleta, setRutaCompleta] = useState('');
  const [includeSubfolders, setIncludeSubfolders] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveFolderId = carpetaId || document.carpetaId || '';
  const selectedFolder = folders.find((f) => f.id === effectiveFolderId);
  const hasSubfolders = Boolean(
    selectedFolder &&
      ((selectedFolder.totalSubcarpetas ?? 0) > 0 ||
        folders.some((f) => f.carpetaPadreId === selectedFolder.id))
  );

  const {
    files: dropboxFiles,
    isLoading: isLoadingDropboxFiles,
    error: dropboxFilesError,
  } = useFolderDropboxFiles(
    effectiveFolderId,
    replaceDropboxFile && sourceMode === 'link',
    includeSubfolders && hasSubfolders
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const resolvedTipo =
    tipoSeleccionado === 'Otro' ? tipoPersonalizado.trim() : tipoSeleccionado;

  const clearFieldError = (field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    clearFieldError('file');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const detected = detectFormatFromFilename(file.name);
    if (!detected) {
      setSelectedFile(null);
      setFieldErrors((prev) => ({
        ...prev,
        file: 'Formato no permitido. Solo se admiten .pdf, .docx, .doc, .xlsx y .xls.',
      }));
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setFieldErrors((prev) => ({
        ...prev,
        file: 'El archivo seleccionado está vacío.',
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setFieldErrors((prev) => ({
        ...prev,
        file: 'El archivo supera el límite máximo permitido de 25 MB.',
      }));
      return;
    }

    setSelectedFile(file);
    setFormato(detected);
    clearFieldError('formato');
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<FormField, string>> = {};

    if (!codigoDocumental.trim()) {
      errors.codigoDocumental = 'El código documental no puede quedar vacío.';
    }
    if (nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }
    if (!resolvedTipo) {
      errors.tipo = 'El tipo documental es obligatorio.';
    }

    const parsedYear = Number.parseInt(anio, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1980 || parsedYear > 2100) {
      errors.anio = 'Ingresa un año válido entre 1980 y 2100.';
    }

    if (!descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria.';
    }

    if (replaceDropboxFile) {
      if (sourceMode === 'upload') {
        if (!selectedFile) {
          errors.file = 'Adjunta el archivo nuevo que reemplazará al actual.';
        }
      } else if (!rutaCompleta.trim()) {
        errors.rutaCompleta = 'Ingresa la nueva ruta o nombre del archivo en Dropbox.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UpdateDocumentMetadataPayload = {
        codigoDocumental: codigoDocumental.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo: resolvedTipo,
        anio: Number.parseInt(anio, 10),
        formato,
        ...(carpetaId ? { carpetaId } : {}),
        ...(replaceDropboxFile
          ? sourceMode === 'upload'
            ? {
                file: selectedFile,
                rutaCompleta: rutaCompleta.trim() || undefined,
              }
            : {
                rutaCompleta: rutaCompleta.trim(),
              }
          : {}),
      };

      const updatedDoc = await documentService.updateMetadata(document.id, payload);
      onUpdated(updatedDoc);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No fue posible actualizar los metadatos del documento.'
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
      aria-labelledby="edit-document-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2
              id="edit-document-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Editar Documento y Metadatos (CU07)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">
              Editando: <span className="font-semibold text-slate-700">{document.nombre}</span>
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <strong className="font-semibold">Error al actualizar:</strong> {submitError}
            </div>
          )}

          {/* Código y Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-codigo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Código Documental <span className="text-red-600">*</span>
              </label>
              <input
                id="edit-codigo"
                type="text"
                value={codigoDocumental}
                onChange={(e) => {
                  setCodigoDocumental(e.target.value);
                  clearFieldError('codigoDocumental');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {fieldErrors.codigoDocumental && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.codigoDocumental}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-formato"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Formato <span className="text-red-600">*</span>
              </label>
              <select
                id="edit-formato"
                value={formato}
                onChange={(e) => {
                  setFormato(e.target.value as DocumentFormat);
                  clearFieldError('formato');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {ALLOWED_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    .{fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label
              htmlFor="edit-nombre"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nombre Oficial del Documento <span className="text-red-600">*</span>
            </label>
            <input
              id="edit-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                clearFieldError('nombre');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            {fieldErrors.nombre && (
              <p className="mt-1 text-[11px] text-red-600">{fieldErrors.nombre}</p>
            )}
          </div>

          {/* Tipo y Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-tipo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tipo Documental <span className="text-red-600">*</span>
              </label>
              <select
                id="edit-tipo"
                value={tipoSeleccionado}
                onChange={(e) => {
                  setTipoSeleccionado(e.target.value);
                  clearFieldError('tipo');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {DOCUMENT_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
                <option value="Otro">Otro...</option>
              </select>
              {tipoSeleccionado === 'Otro' && (
                <input
                  type="text"
                  value={tipoPersonalizado}
                  onChange={(e) => {
                    setTipoPersonalizado(e.target.value);
                    clearFieldError('tipo');
                  }}
                  placeholder="Especifica el tipo"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              )}
              {fieldErrors.tipo && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.tipo}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-anio"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Año <span className="text-red-600">*</span>
              </label>
              <input
                id="edit-anio"
                type="number"
                min={1980}
                max={2100}
                value={anio}
                onChange={(e) => {
                  setAnio(e.target.value);
                  clearFieldError('anio');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {fieldErrors.anio && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.anio}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="edit-descripcion"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Descripción <span className="text-red-600">*</span>
            </label>
            <textarea
              id="edit-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                clearFieldError('descripcion');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            {fieldErrors.descripcion && (
              <p className="mt-1 text-[11px] text-red-600">{fieldErrors.descripcion}</p>
            )}
          </div>

          {/* Selector Jerárquico y Buscador de Carpeta Destino */}
          <FolderHierarchySelector
            idPrefix="edit"
            folders={folders}
            isLoading={isLoadingFolders}
            value={carpetaId}
            onChange={(nextFolderId) => {
              setCarpetaId(nextFolderId);
              clearFieldError('carpetaId');
            }}
            emptyLabel={`Mantener actual (${document.carpetaMadre})`}
            onRefresh={onRefreshFolders}
            isRefreshing={isRefreshingFolders}
          />

          {/* Sección de Reemplazo en Dropbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Archivo Actual en Dropbox
              </span>
              <p className="text-xs font-mono text-slate-700 break-all">
                {document.rutaCompleta}
              </p>
            </div>

            <label className="flex items-center gap-2.5 pt-2 border-t border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceDropboxFile}
                onChange={(e) => {
                  setReplaceDropboxFile(e.target.checked);
                  clearFieldError('file');
                  clearFieldError('rutaCompleta');
                }}
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-xs font-bold text-slate-800">
                Reemplazar o cambiar el documento vinculado en Dropbox
              </span>
            </label>

            {replaceDropboxFile && (
              <div className="space-y-4 pt-2">
                {/* Alerta obligatoria sobre eliminación de versión anterior */}
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
                >
                  <svg
                    className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="leading-relaxed">
                    <strong className="font-bold">Advertencia de almacenamiento:</strong> Al
                    guardar un nuevo archivo o cambiar el vínculo de Dropbox, se{' '}
                    <strong className="font-semibold">
                      eliminará automáticamente el archivo anterior de Dropbox
                    </strong>{' '}
                    para no ocupar espacio duplicado.
                  </p>
                </div>

                {/* Tabs Subir vs Vincular */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode('upload');
                      clearFieldError('rutaCompleta');
                    }}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      sourceMode === 'upload'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Subir nuevo archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceMode('link');
                      clearFieldError('file');
                    }}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      sourceMode === 'link'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vincular archivo existente
                  </button>
                </div>

                {sourceMode === 'upload' ? (
                  <div key="edit-dropbox-upload" className="space-y-3">
                    <div>
                      <label
                        htmlFor="edit-file"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Archivo de reemplazo (.pdf, .docx, .doc, .xlsx, .xls — máx. 25 MB)
                      </label>
                      <input
                        key="edit-file"
                        id="edit-file"
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      {selectedFile && (
                        <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                          Nuevo archivo seleccionado: {selectedFile.name} (
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      )}
                      {fieldErrors.file && (
                        <p className="mt-1 text-[11px] text-red-600">{fieldErrors.file}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="edit-custom-path"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Ruta o nombre destino personalizado (opcional)
                      </label>
                      <input
                        key="edit-custom-path"
                        id="edit-custom-path"
                        type="text"
                        value={rutaCompleta}
                        onChange={(e) => setRutaCompleta(e.target.value)}
                        placeholder="Si se deja vacío usará el nombre del archivo en la carpeta"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div key="edit-dropbox-link" className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <label
                          htmlFor="edit-dropbox-file-select"
                          className="block text-xs font-medium text-slate-700"
                        >
                          Seleccionar archivo existente en la carpeta de Dropbox
                        </label>
                        {hasSubfolders && (
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeSubfolders}
                              onChange={(e) => setIncludeSubfolders(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                            />
                            <span>Incluir archivos de subcarpetas</span>
                          </label>
                        )}
                      </div>
                      <select
                        key="edit-dropbox-file-select"
                        id="edit-dropbox-file-select"
                        value={
                          dropboxFiles.some((f) => f.pathDisplay === rutaCompleta)
                            ? rutaCompleta
                            : ''
                        }
                        disabled={!effectiveFolderId || isLoadingDropboxFiles}
                        onChange={(e) => {
                          const chosenPath = e.target.value;
                          setRutaCompleta(chosenPath);
                          clearFieldError('rutaCompleta');
                          const matched = dropboxFiles.find(
                            (f) => f.pathDisplay === chosenPath
                          );
                          if (matched) {
                            const detected = detectFormatFromFilename(matched.name);
                            if (detected) {
                              setFormato(detected);
                              clearFieldError('formato');
                            }
                            const lastSlash = matched.pathDisplay.lastIndexOf('/');
                            if (lastSlash > 0) {
                              const parentPath = matched.pathDisplay
                                .slice(0, lastSlash)
                                .toLowerCase();
                              const parentFolder = folders.find(
                                (folder) =>
                                  folder.rutaCompleta.replace(/\/+$/, '').toLowerCase() ===
                                  parentPath
                              );
                              if (parentFolder && parentFolder.id !== carpetaId) {
                                setCarpetaId(parentFolder.id);
                                clearFieldError('carpetaId');
                              }
                            }
                          }
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="">
                          {!effectiveFolderId
                            ? 'Selecciona una carpeta destino arriba para listar sus archivos'
                            : isLoadingDropboxFiles
                              ? 'Consultando archivos en Dropbox...'
                              : dropboxFiles.length === 0
                                ? 'No se encontraron archivos directos en esta carpeta'
                                : 'Elige un archivo de la carpeta (opcional)'}
                        </option>
                        {dropboxFiles.map((file) => {
                          const isCurrent = file.id === document.dropboxFileId;
                          const isLinkedElsewhere = file.yaVinculado && !isCurrent;
                          const folderPrefix = selectedFolder
                            ? `${selectedFolder.rutaCompleta.replace(/\/+$/, '')}/`
                            : '';
                          const displayName =
                            includeSubfolders &&
                            hasSubfolders &&
                            folderPrefix &&
                            file.pathDisplay
                              .toLowerCase()
                              .startsWith(folderPrefix.toLowerCase())
                              ? file.pathDisplay.slice(folderPrefix.length)
                              : file.name;
                          return (
                            <option
                              key={file.id}
                              value={file.pathDisplay}
                              disabled={isLinkedElsewhere}
                            >
                              {displayName}
                              {isCurrent
                                ? ' (Actual)'
                                : isLinkedElsewhere
                                  ? ' (Ya vinculado)'
                                  : ''}
                            </option>
                          );
                        })}
                      </select>
                      {dropboxFilesError && (
                        <p className="mt-1 text-[11px] text-amber-700">{dropboxFilesError}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="edit-ruta"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Nueva ruta o nombre del archivo en Dropbox{' '}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        key="edit-ruta"
                        id="edit-ruta"
                        type="text"
                        value={rutaCompleta}
                        onChange={(e) => {
                          setRutaCompleta(e.target.value);
                          clearFieldError('rutaCompleta');
                        }}
                        placeholder="/BASE_DOCUMENTAL/Carpeta/Nuevo.pdf o Nuevo.pdf"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        El backend resolverá automáticamente el nuevo identificador en Dropbox y
                        eliminará el archivo anterior al guardar.
                      </p>
                      {fieldErrors.rutaCompleta && (
                        <p className="mt-1 text-[11px] text-red-600">{fieldErrors.rutaCompleta}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
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
              {isSubmitting ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
