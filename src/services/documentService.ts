import { apiClient } from './apiClient';
import { DocumentItem, FolderItem } from '../types/document.types';

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
  async getFolderTree(): Promise<FolderItem[]> {
    const response = await apiClient.get<{ success: boolean; data: FolderItem[] }>('/folders');
    return response.data;
  },

  /**
   * Actualiza metadatos de un documento (CU07, RF-07, RF-15).
   */
  async updateMetadata(
    documentId: string,
    payload: {
      codigoDocumental?: string;
      nombre?: string;
      descripcion?: string;
      tipo?: string;
      anio?: number;
      esVigente?: boolean;
    }
  ): Promise<DocumentItem> {
    const response = await apiClient.put<{ success: boolean; data: DocumentItem }>(
      `/documents/${documentId}/metadata`,
      payload
    );
    return response.data;
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

