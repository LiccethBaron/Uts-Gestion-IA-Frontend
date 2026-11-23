'use client';

import React from 'react';
import { DocumentItem } from '../../types/document.types';
import {
  formatSimilarityScore,
  getSimilarityLevel,
  getFormatBadgeClasses,
} from '../../utils/formatters';
import { env } from '../../config/env';

interface SearchResultCardProps {
  document: DocumentItem;
  onPreview: (id: string) => void;
  onDownload: (id: string) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  document,
  onPreview,
  onDownload,
}) => {
  const similarity = getSimilarityLevel(document.scoreSimilitud);
  const isHighAffinity = document.scoreSimilitud >= env.SIMILARITY_THRESHOLD;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      {/* Header con código, badges de afinidad y formato */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            {document.codigo || 'SIN CÓDIGO'}
          </span>

          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${similarity.badgeClass}`}
          >
            {similarity.label} ({formatSimilarityScore(document.scoreSimilitud)})
          </span>

          {document.esVigente === false && (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
              No Vigente
            </span>
          )}
        </div>

        <span
          className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${getFormatBadgeClasses(
            document.formato
          )}`}
        >
          {document.formato}
        </span>
      </header>

      {/* Título y descripción */}
      <div className="mt-3">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          {document.nombre}
        </h3>
        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {document.descripcion || 'Sin descripción sintética disponible para este documento.'}
        </p>
      </div>

      {/* Explicación de relevancia asistida por IA (RF-05 / Cero Alucinación) */}
      {isHighAffinity && document.justificacion && (
        <aside
          aria-label="Justificación de relevancia semántica"
          className="mt-3.5 rounded-lg bg-blue-50/80 p-3.5 text-xs text-blue-900 border-l-4 border-blue-600 shadow-xs"
        >
          <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Por qué coincide con tu búsqueda (Análisis IA):</span>
          </div>
          <p className="leading-relaxed text-blue-900/90">{document.justificacion}</p>
        </aside>
      )}

      {/* Metadatos contextuales institucionales (RF-04) */}
      <footer className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span>
            <strong className="text-slate-700">Carpeta:</strong> {document.carpetaMadre}
          </span>
          <span>
            <strong className="text-slate-700">Año:</strong> {document.anio}
          </span>
          {document.tipo && (
            <span>
              <strong className="text-slate-700">Tipo:</strong> {document.tipo}
            </span>
          )}
          <span className="truncate max-w-xs" title={document.rutaCompleta}>
            <strong className="text-slate-700">Ruta:</strong> {document.rutaCompleta}
          </span>
        </div>

        {/* Acciones seguras (RNF-03 Dropbox Read-Only) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onPreview(document.id)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Previsualizar
          </button>
          <button
            type="button"
            onClick={() => onDownload(document.id)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Descargar</span>
          </button>
        </div>
      </footer>
    </article>
  );
};

