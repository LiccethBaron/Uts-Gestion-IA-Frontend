'use client';

import React from 'react';
import { SearchMode } from '../../types/document.types';

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  mode,
  onModeChange,
  isLoading = false,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Contenedor del Input */}
      <div className="relative flex items-center">
        {/* Icono de Lupa */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={
            mode === 'semantico'
              ? 'Describe en lenguaje natural lo que necesitas (ej. "requisitos de grado de tecnología en sistemas")...'
              : 'Busca por palabras exactas, código documental o nombre oficial...'
          }
          className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-24 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />

        {/* Indicador de carga o limpiar */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {isLoading && (
            <svg
              className="w-5 h-5 animate-spin text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
              title="Borrar consulta"
              aria-label="Borrar consulta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Modo de Búsqueda */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span className="font-medium">Modo de consulta:</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange('semantico')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
              mode === 'semantico'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Semántica (IA Vectorial)
          </button>
          <button
            type="button"
            onClick={() => onModeChange('convencional')}
            className={`rounded-md px-3 py-1 font-medium transition ${
              mode === 'convencional'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Convencional (FTS)
          </button>
        </div>
      </div>
    </div>
  );
};

