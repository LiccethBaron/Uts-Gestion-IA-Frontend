'use client';

import React from 'react';
import { useSearch } from '../../../hooks/useSearch';
import { SearchBar } from '../../../components/search/SearchBar';
import { FacetFilters } from '../../../components/search/FacetFilters';
import { SearchResultCard } from '../../../components/search/SearchResultCard';
import { SearchSkeleton } from '../../../components/search/SearchSkeleton';
import { documentService } from '../../../services/documentService';

export default function SearchPage() {
  const {
    query,
    setQuery,
    filters,
    updateFilter,
    resetFilters,
    results,
    totalCount,
    isLoading,
    error,
    page,
    setPage,
    pageSize,
  } = useSearch();

  const handlePreview = async (documentId: string) => {
    try {
      const previewUrl = await documentService.getPreviewUrl(documentId);
      if (previewUrl) {
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Enlace de previsualización no disponible para este documento.');
      }
    } catch {
      alert('Error al obtener la previsualización del documento.');
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const downloadUrl = await documentService.getDownloadUrl(documentId);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Enlace de descarga no disponible en Dropbox.');
      }
    } catch {
      alert('Error al solicitar la descarga del documento desde Dropbox.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
      {/* Encabezado y Barra de Búsqueda Principal */}
      <section className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Buscador Documental Institucional UTS
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Encuentra reglamentos, manuales, formatos y acuerdos institucionales mediante consultas
          en lenguaje natural asistidas por Inteligencia Artificial.
        </p>

        <div className="mt-6">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            mode={filters.modo}
            onModeChange={(m) => updateFilter('modo', m)}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Grid de Contenido: Filtros Laterales + Lista de Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Columna de Filtros Facetados */}
        <div className="lg:col-span-1">
          <FacetFilters
            filters={filters}
            onFilterChange={updateFilter}
            onReset={resetFilters}
          />
        </div>

        {/* Columna de Resultados */}
        <section className="lg:col-span-3 space-y-4">
          {/* Barra de estado / conteo */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span>
              {query || filters.formato || filters.tipo || filters.anio ? (
                <>
                  Se encontraron <strong className="text-slate-900">{totalCount}</strong>{' '}
                  documentos relevantes
                </>
              ) : (
                'Escribe una consulta para explorar la base documental'
              )}
            </span>

            {totalCount > 0 && (
              <span>
                Página {page} de {totalPages || 1}
              </span>
            )}
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">No fue posible completar la búsqueda:</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          )}

          {/* Estado de Carga */}
          {isLoading && <SearchSkeleton />}

          {/* Estado de Resultados Vacíos */}
          {!isLoading && !error && results.length === 0 && (query || filters.formato || filters.tipo) && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No se encontraron documentos coincidentes
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Intenta reformular tu consulta con términos más generales o verifica los filtros de
                año y formato aplicados.
              </p>
            </div>
          )}

          {/* Estado Inicial (Sin búsqueda) */}
          {!isLoading && !error && results.length === 0 && !query && !filters.formato && !filters.tipo && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <h3 className="text-base font-semibold text-slate-800">
                ¿Qué deseas consultar hoy?
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Prueba buscando:{' '}
                <button
                  type="button"
                  onClick={() => setQuery('manual de funciones y competencias')}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  &ldquo;manual de funciones y competencias&rdquo;
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => setQuery('reglamento estudiantil')}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  &ldquo;reglamento estudiantil&rdquo;
                </button>{' '}
                o{' '}
                <button
                  type="button"
                  onClick={() => setQuery('modalidades de trabajo de grado')}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  &ldquo;modalidades de trabajo de grado&rdquo;
                </button>
                .
              </p>
            </div>
          )}

          {/* Lista de Resultados */}
          {!isLoading &&
            results.map((doc) => (
              <SearchResultCard
                key={doc.id}
                document={doc}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            ))}

          {/* Paginación */}
          {!isLoading && totalPages > 1 && (
            <nav
              aria-label="Paginación de resultados"
              className="flex items-center justify-center gap-2 pt-4"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Siguiente
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

