'use client';

import React, { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { useFolderDropboxFiles } from '../../hooks/useFolderDropboxFiles';
import { FolderHierarchySelector } from './FolderHierarchySelector';
import {
  CreateDocumentPayload,
  DocumentFormat,
  DocumentItem,
  FolderItem,
} from '../../types/document.types';

interface CreateDocumentModalProps {
  isOpen: boolean;
  folders: FolderItem[];
  isLoadingFolders: boolean;
  isRefreshingFolders?: boolean;
  onRefreshFolders?: () => void;
  onClose: () => void;
  onCreated: (doc: DocumentItem) => void;
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

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (upload.middleware.ts)
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

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  folders,
  isLoadingFolders,
  isRefreshingFolders = false,
  onRefreshFolders,
  onClose,
  onCreated,
}) => {
  const [codigoDocumental, setCodigoDocumental] = useState('');
  const [nombre, setNombre] = useState('');
  const [carpetaId, setCarpetaId] = useState('');
  const [formato, setFormato] = useState<DocumentFormat | ''>('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('Manual');
  const [tipoPersonalizado, setTipoPersonalizado] = useState('');
  const [anio, setAnio] = useState('2026');
  const [descripcion, setDescripcion] = useState('');

  const [sourceMode, setSourceMode] = useState<DropboxSourceMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rutaCompleta, setRutaCompleta] = useState('');
  const [includeSubfolders, setIncludeSubfolders] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFolder = folders.find((f) => f.id === carpetaId);
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
    carpetaId,
    isOpen && sourceMode === 'link',
    includeSubfolders && hasSubfolders
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

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
      errors.codigoDocumental = 'El código documental es obligatorio.';
    }
    if (nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }
    if (!carpetaId) {
      errors.carpetaId = 'Debes seleccionar una carpeta de destino.';
    }
    if (!formato) {
      errors.formato = 'Selecciona el formato del documento.';
    }
    if (!resolvedTipo) {
      errors.tipo = 'El tipo documental es obligatorio.';
    }

    const parsedYear = Number.parseInt(anio, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1980 || parsedYear > 2100) {
      errors.anio = 'Ingresa un año válido entre 1980 y 2100.';
    }

    if (!descripcion.trim()) {
      errors.descripcion = 'La descripción del documento es obligatoria.';
    }

    if (sourceMode === 'upload') {
      if (!selectedFile) {
        errors.file = 'Debes adjuntar un archivo (.pdf, .docx, .doc, .xlsx o .xls).';
      }
    } else if (!rutaCompleta.trim()) {
      errors.rutaCompleta = 'La ruta o nombre del archivo en Dropbox es obligatorio.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm() || !formato) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateDocumentPayload = {
        carpetaId,
        codigoDocumental: codigoDocumental.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        formato,
        tipo: resolvedTipo,
        anio: Number.parseInt(anio, 10),
        ...(sourceMode === 'upload'
          ? {
              file: selectedFile,
              rutaCompleta: rutaCompleta.trim() || undefined,
            }
          : {
              rutaCompleta: rutaCompleta.trim(),
            }),
      };

      const createdDoc = await documentService.createDocument(payload);
      onCreated(createdDoc);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'No fue posible registrar el documento en el servidor.'
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
      aria-labelledby="create-document-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2
              id="create-document-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Registrar y Vincular Nuevo Documento (CU08)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Completa los metadatos institucionales y sube o vincula el archivo en Dropbox.
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
              <strong className="font-semibold">Error al guardar:</strong> {submitError}
            </div>
          )}

          {/* Código y Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-codigo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Código Documental <span className="text-red-600">*</span>
              </label>
              <input
                id="create-codigo"
                type="text"
                value={codigoDocumental}
                onChange={(e) => {
                  setCodigoDocumental(e.target.value);
                  clearFieldError('codigoDocumental');
                }}
                placeholder="Ej. MAN-SGC-005"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {fieldErrors.codigoDocumental && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.codigoDocumental}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="create-formato"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Formato <span className="text-red-600">*</span>
              </label>
              <select
                id="create-formato"
                value={formato}
                onChange={(e) => {
                  setFormato(e.target.value as DocumentFormat | '');
                  clearFieldError('formato');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">Selecciona un formato</option>
                {ALLOWED_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    .{fmt}
                  </option>
                ))}
              </select>
              {fieldErrors.formato && (
                <p className="mt-1 text-[11px] text-red-600">{fieldErrors.formato}</p>
              )}
            </div>
          </div>

          {/* Nombre oficial */}
          <div>
            <label
              htmlFor="create-nombre"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nombre Oficial del Documento <span className="text-red-600">*</span>
            </label>
            <input
              id="create-nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                clearFieldError('nombre');
              }}
              placeholder="Ej. Manual de Procedimientos Académicos UTS"
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
                htmlFor="create-tipo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tipo Documental <span className="text-red-600">*</span>
              </label>
              <select
                id="create-tipo"
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
                htmlFor="create-anio"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Año <span className="text-red-600">*</span>
              </label>
              <input
                id="create-anio"
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
              htmlFor="create-descripcion"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Descripción <span className="text-red-600">*</span>
            </label>
            <textarea
              id="create-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                clearFieldError('descripcion');
              }}
              placeholder="Resumen del contenido y alcance institucional del documento..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            {fieldErrors.descripcion && (
              <p className="mt-1 text-[11px] text-red-600">{fieldErrors.descripcion}</p>
            )}
          </div>

          {/* Selector Jerárquico y Buscador de Carpeta Destino */}
          <FolderHierarchySelector
            idPrefix="create"
            folders={folders}
            isLoading={isLoadingFolders}
            value={carpetaId}
            onChange={(nextFolderId) => {
              setCarpetaId(nextFolderId);
              clearFieldError('carpetaId');
            }}
            required
            emptyLabel="Selecciona una carpeta principal"
            error={fieldErrors.carpetaId}
            onRefresh={onRefreshFolders}
            isRefreshing={isRefreshingFolders}
          />

          {/* Sección de archivo / vínculo en Dropbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                Archivo Institucional en Dropbox <span className="text-red-600">*</span>
              </span>
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
                  Subir archivo a Dropbox
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
            </div>

            {sourceMode === 'upload' ? (
              <div key="create-dropbox-upload" className="space-y-3">
                <div>
                  <label
                    htmlFor="create-file"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Seleccionar archivo (.pdf, .docx, .doc, .xlsx, .xls — máx. 25 MB)
                  </label>
                  <input
                    key="create-file"
                    id="create-file"
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {selectedFile && (
                    <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                      Archivo listo: {selectedFile.name} (
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                  {fieldErrors.file && (
                    <p className="mt-1 text-[11px] text-red-600">{fieldErrors.file}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-custom-path"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Nombre o ruta destino personalizada (opcional)
                  </label>
                  <input
                    key="create-custom-path"
                    id="create-custom-path"
                    type="text"
                    value={rutaCompleta}
                    onChange={(e) => setRutaCompleta(e.target.value)}
                    placeholder="Si se deja vacío usará el nombre original del archivo en la carpeta"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            ) : (
              <div key="create-dropbox-link" className="space-y-3">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label
                      htmlFor="create-dropbox-file-select"
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
                    key="create-dropbox-file-select"
                    id="create-dropbox-file-select"
                    value={
                      dropboxFiles.some((f) => f.pathDisplay === rutaCompleta)
                        ? rutaCompleta
                        : ''
                    }
                    disabled={!carpetaId || isLoadingDropboxFiles}
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
                      {!carpetaId
                        ? 'Primero selecciona una carpeta destino arriba'
                        : isLoadingDropboxFiles
                          ? 'Consultando archivos en Dropbox...'
                          : dropboxFiles.length === 0
                            ? 'No se encontraron archivos directos en esta carpeta'
                            : 'Elige un archivo de la carpeta (opcional)'}
                    </option>
                    {dropboxFiles.map((file) => {
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
                          disabled={file.yaVinculado}
                        >
                          {displayName}
                          {file.yaVinculado ? ' (Ya vinculado)' : ''}
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
                    htmlFor="create-ruta"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Ruta o nombre del archivo en Dropbox <span className="text-red-600">*</span>
                  </label>
                  <input
                    key="create-ruta"
                    id="create-ruta"
                    type="text"
                    value={rutaCompleta}
                    onChange={(e) => {
                      setRutaCompleta(e.target.value);
                      clearFieldError('rutaCompleta');
                    }}
                    placeholder="/BASE_DOCUMENTAL/Carpeta/Archivo.pdf o Archivo.pdf"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    El backend buscará automáticamente el identificador interno del archivo en
                    Dropbox a partir de esta ruta o nombre.
                  </p>
                  {fieldErrors.rutaCompleta && (
                    <p className="mt-1 text-[11px] text-red-600">{fieldErrors.rutaCompleta}</p>
                  )}
                </div>
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
              {isSubmitting ? 'Guardando y subiendo...' : 'Crear Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
