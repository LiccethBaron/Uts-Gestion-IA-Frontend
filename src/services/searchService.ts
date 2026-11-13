import { apiClient } from './apiClient';
import { SearchQueryDTO, SearchResponse, DocumentItem } from '../types/document.types';
import { sanitizeSearchQuery } from '../utils/sanitize';

/**
 * Servicio para el Módulo de Búsqueda y Recuperación Documental (CU01, CU02, RF-01, RF-02, RF-05).
 */
export const searchService = {
  /**
   * Ejecuta búsqueda semántica o convencional con filtros facetados.
   */
  async searchDocuments(params: SearchQueryDTO): Promise<SearchResponse> {
    const sanitizedQuery = sanitizeSearchQuery(params.q);

    return apiClient.get<SearchResponse>('/search', {
      q: sanitizedQuery,
      tipo: params.tipo,
      formato: params.formato,
      anio: params.anio,
      carpetaId: params.carpetaId,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      modo: params.modo ?? 'semantico',
    });
  },

  /**
   * Recupera el detalle completo y metadatos de un documento específico (CU03).
   */
  async getDocumentDetail(documentId: string): Promise<DocumentItem> {
    const response = await apiClient.get<{ success: boolean; data: DocumentItem }>(
      `/documents/${documentId}`
    );
    return response.data;
  },
};

