/**
 * Tipos de datos para el dominio documental y búsqueda semántica UTS.
 * Conforme al Documento de Arquitectura y Especificación Técnica (RF-01, RF-02, RF-04, RF-07, RF-08).
 */

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'doc' | 'xls';

export type SearchMode = 'semantico' | 'convencional';

export interface DocumentMetadataItem {
  id: string;
  documentoId: string;
  clave: string;
  valor: string;
  estadoExtraccion: 'RECONOCIDO' | 'DESCONOCIDO';
}

export interface DocumentItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  formato: DocumentFormat;
  tipo?: string;
  anio: number;
  rutaCompleta: string;
  carpetaMadre: string;
  carpetaId?: string;
  dropboxFileId?: string;
  estaExcluido: boolean;
  esVigente: boolean;
  scoreSimilitud: number;
  justificacion?: string;
  fechaModificacionDropbox?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchQueryDTO {
  q: string;
  tipo?: string;
  formato?: DocumentFormat;
  anio?: number;
  carpetaId?: string;
  limit?: number;
  offset?: number;
  modo?: SearchMode;
}

export interface SearchResponse {
  success: boolean;
  count: number;
  total?: number;
  data: DocumentItem[];
  tiempoRespuestaMs?: number;
}

export interface FolderItem {
  id: string;
  carpetaPadreId?: string | null;
  dropboxId: string;
  nombre: string;
  rutaCompleta: string;
  totalDocumentos?: number;
  subcarpetas?: FolderItem[];
}

export interface AuditLogItem {
  id: string;
  usuarioId?: string | null;
  documentoId?: string | null;
  tipoEvento: 'BUSQUEDA_CONVENCIONAL' | 'BUSQUEDA_SEMANTICA' | 'DESCARGA';
  terminoBusqueda?: string;
  resultadosObtenidos: number;
  createdAt: string;
}

export interface SyncLogItem {
  id: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'EXITOSO' | 'FALLIDO' | 'PARCIAL';
  totalDetectados: number;
  totalProcesados: number;
  totalFallidos: number;
}

