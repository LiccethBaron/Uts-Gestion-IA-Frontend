import { apiClient } from './apiClient';
import {
  BackendDocumentRecord,
  CreateDocumentPayload,
  CreateFolderPayload,
  DocumentFormat,
  DocumentItem,
  DropboxFolderFileItem,
  FolderItem,
  UpdateDocumentMetadataPayload,
  UpdateFolderPayload,
} from '../types/document.types';

const UPLOAD_TIMEOUT_MS = 60000;
const FOLDER_MUTATION_TIMEOUT_MS = 30000;
const VALID_FORMATS: readonly DocumentFormat[] = ['pdf', 'docx', 'xlsx', 'doc', 'xls'];

function normalizeFormat(rawFormat: string): DocumentFormat {
  const normalized = rawFormat.trim().toLowerCase() as DocumentFormat;
  return VALID_FORMATS.includes(normalized) ? normalized : 'pdf';
}

function mapBackendDocumentToItem(raw: BackendDocumentRecord): DocumentItem {
  return {
    id: raw.id,
    codigo: raw.codigoDocumental || 'SIN CÓDIGO',
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? '',
    formato: normalizeFormat(raw.formato),
    tipo: raw.tipo ?? undefined,
    anio: raw.anio ?? 2026,
    rutaCompleta: raw.rutaCompleta,
    carpetaMadre: raw.carpeta?.nombre ?? 'Sin carpeta',
    carpetaId: raw.carpetaId,
    dropboxFileId: raw.dropboxFileId,
    estaExcluido: false,
    esVigente: true,
    scoreSimilitud: 1.0,
    fechaModificacionDropbox: raw.fechaModificacionDropbox,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function buildDocumentFormData(
  fields: Record<string, string | number | undefined>,
  file: File
): FormData {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      formData.append(key, String(value));
    }
  });

  return formData;
}

/**
 * Servicio para gestión documental, previsualización y descarga segura (CU04, CU07, CU08, RF-08, RF-13).
 */
export const documentService = {
  /**
   * Obtiene la URL pre-firmada o endpoint de descarga segura (solo lectura) de Dropbox (CU04, RNF-03).
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    const response = await apiClient.get<{ success: boolean; downloadUrl: string }>(
      `/documents/${documentId}/download`
    );
    return response.downloadUrl;
  },

  /**
   * Obtiene el enlace de previsualización para el visor de documentos (CU03).
   */
  async getPreviewUrl(documentId: string): Promise<string> {
    const response = await apiClient.get<{ success: boolean; previewUrl: string }>(
      `/documents/${documentId}/preview`
    );
    return response.previewUrl;
  },

  /**
   * Árbol de carpetas jerárquico de la base documental (CU02, RF-10).
   */
  async getFolderTree(options?: {
    parentId?: string;
    refresh?: boolean;
  }): Promise<FolderItem[]> {
    const response = await apiClient.get<{ success: boolean; data: FolderItem[] }>(
      '/folders',
      {
        parentId: options?.parentId,
        refresh: options?.refresh ? 'true' : undefined,
      },
      { timeoutMs: 30000 }
    );
    return response.data;
  },

  /**
   * Lista los archivos reales en Dropbox dentro de una carpeta registrada en BD.
   */
  async getFolderDropboxFiles(
    folderId: string,
    recursive: boolean = false
  ): Promise<DropboxFolderFileItem[]> {
    const response = await apiClient.get<{
      success: boolean;
      count: number;
      data: DropboxFolderFileItem[];
    }>(
      `/folders/${folderId}/dropbox-files`,
      {
        recursive: recursive ? 'true' : undefined,
      },
      { timeoutMs: FOLDER_MUTATION_TIMEOUT_MS }
    );
    return response.data;
  },

  /**
   * Obtiene el detalle de una carpeta por ID junto con sus subcarpetas directas y conteos.
   */
  async getFolderById(folderId: string): Promise<FolderItem> {
    const response = await apiClient.get<{ success: boolean; data: FolderItem }>(
      `/folders/${folderId}`,
      undefined,
      { timeoutMs: FOLDER_MUTATION_TIMEOUT_MS }
    );
    return response.data;
  },

  /**
   * Crea una nueva carpeta en Dropbox y PostgreSQL con auditoría administrativa.
   */
  async createFolder(payload: CreateFolderPayload): Promise<FolderItem> {
    const body: CreateFolderPayload = {
      nombre: payload.nombre.trim(),
      ...(payload.carpetaPadreId?.trim()
        ? { carpetaPadreId: payload.carpetaPadreId.trim() }
        : {}),
    };

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: FolderItem;
    }>('/folders', body, { timeoutMs: FOLDER_MUTATION_TIMEOUT_MS });
    return response.data;
  },

  /**
   * Renombra o mueve una carpeta en Dropbox y actualiza rutas descendientes en PostgreSQL.
   */
  async updateFolder(folderId: string, payload: UpdateFolderPayload): Promise<FolderItem> {
    const body: UpdateFolderPayload = {};
    if (payload.nombre !== undefined && payload.nombre.trim() !== '') {
      body.nombre = payload.nombre.trim();
    }
    if (payload.carpetaPadreId !== undefined && payload.carpetaPadreId.trim() !== '') {
      body.carpetaPadreId = payload.carpetaPadreId.trim();
    }

    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: FolderItem;
    }>(`/folders/${folderId}`, body, { timeoutMs: FOLDER_MUTATION_TIMEOUT_MS });
    return response.data;
  },

  /**
   * Elimina físicamente una carpeta en Dropbox y en cascada en PostgreSQL.
   */
  async deleteFolder(folderId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/folders/${folderId}`,
      { timeoutMs: FOLDER_MUTATION_TIMEOUT_MS }
    );
  },

  /**
   * Crea un documento subiendo un archivo nuevo o vinculando uno existente en Dropbox (CU08).
   */
  async createDocument(payload: CreateDocumentPayload): Promise<DocumentItem> {
    const baseFields: Record<string, string | number | undefined> = {
      carpetaId: payload.carpetaId,
      codigoDocumental: payload.codigoDocumental.trim(),
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion.trim(),
      formato: payload.formato,
      tipo: payload.tipo.trim(),
      anio: payload.anio,
      rutaCompleta: payload.rutaCompleta?.trim() || undefined,
      dropboxFileId: payload.dropboxFileId?.trim() || undefined,
      hashContenido: payload.hashContenido?.trim() || undefined,
    };

    if (payload.file) {
      const formData = buildDocumentFormData(baseFields, payload.file);
      const response = await apiClient.post<{
        success: boolean;
        data: BackendDocumentRecord;
      }>('/documents/link-dropbox', formData, { timeoutMs: UPLOAD_TIMEOUT_MS });
      return mapBackendDocumentToItem(response.data);
    }

    const response = await apiClient.post<{
      success: boolean;
      data: BackendDocumentRecord;
    }>('/documents/link-dropbox', baseFields);
    return mapBackendDocumentToItem(response.data);
  },

  /**
   * Actualiza metadatos de un documento y opcionalmente reemplaza su archivo en Dropbox (CU07, RF-07, RF-15).
   */
  async updateMetadata(
    documentId: string,
    payload: UpdateDocumentMetadataPayload
  ): Promise<DocumentItem> {
    const fields: Record<string, string | number | undefined> = {
      carpetaId: payload.carpetaId,
      codigoDocumental: payload.codigoDocumental?.trim(),
      nombre: payload.nombre?.trim(),
      descripcion: payload.descripcion?.trim(),
      tipo: payload.tipo?.trim(),
      anio: payload.anio,
      formato: payload.formato,
      dropboxFileId: payload.dropboxFileId?.trim(),
      rutaCompleta: payload.rutaCompleta?.trim(),
      hashContenido: payload.hashContenido?.trim(),
    };

    if (payload.file) {
      const formData = buildDocumentFormData(fields, payload.file);
      const response = await apiClient.patch<{
        success: boolean;
        data: BackendDocumentRecord;
      }>(`/documents/${documentId}/metadata`, formData, {
        timeoutMs: UPLOAD_TIMEOUT_MS,
      });
      return mapBackendDocumentToItem(response.data);
    }

    const jsonBody = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined && value !== '')
    );

    const response = await apiClient.patch<{
      success: boolean;
      data: BackendDocumentRecord;
    }>(`/documents/${documentId}/metadata`, jsonBody);
    return mapBackendDocumentToItem(response.data);
  },

  /**
   * Exclusión lógica de un documento del índice público (RF-13, RF-16).
   */
  async toggleExclusion(documentId: string, estaExcluido: boolean): Promise<void> {
    await apiClient.patch(`/documents/${documentId}/exclusion`, { estaExcluido });
  },

  /**
   * Solicita re-indexación y vectorización de un documento específico (CU11).
   */
  async triggerReindex(documentId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      `/documents/${documentId}/reindex`
    );
  },
};
