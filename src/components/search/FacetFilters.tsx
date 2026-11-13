'use client';

import React from 'react';
import { DocumentFormat } from '../../types/document.types';
import { UseSearchFilters } from '../../hooks/useSearch';

interface FacetFiltersProps {
  filters: UseSearchFilters;
  onFilterChange: <K extends keyof UseSearchFilters>(key: K, value: UseSearchFilters[K]) => void;
  onReset: () => void;
}

const FORMAT_OPTIONS: Array<{ value: DocumentFormat | ''; label: string }> = [
  { value: '', label: 'Todos los formatos' },
  { value: 'pdf', label: 'PDF (.pdf)' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
];

const TYPE_OPTIONS: string[] = [
  'Todos los tipos',
  'Manual',
  'Procedimiento',
  'Guía',
  'Formato',
  'Resolución',
  'Reglamento',
];

export const FacetFilters: React.FC<FacetFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const hasActiveFilters = !!(filters.formato || filters.tipo || filters.anio);

  return (
    <aside
      aria-label="Filtros facetados"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Filtros de Búsqueda
        </h4>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Formato */}
        <div>
          <label htmlFor="filter-format" className="block text-xs font-medium text-slate-600 mb-1">
            Formato de Archivo
          </label>
          <select
            id="filter-format"
            value={filters.formato || ''}
            onChange={(e) =>
              onFilterChange('formato', (e.target.value as DocumentFormat) || undefined)
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Documento */}
        <div>
          <label htmlFor="filter-type" className="block text-xs font-medium text-slate-600 mb-1">
            Tipo Documental
          </label>
          <select
            id="filter-type"
            value={filters.tipo || 'Todos los tipos'}
            onChange={(e) =>
              onFilterChange(
                'tipo',
                e.target.value === 'Todos los tipos' ? undefined : e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label htmlFor="filter-year" className="block text-xs font-medium text-slate-600 mb-1">
            Año de Publicación
          </label>
          <input
            id="filter-year"
            type="number"
            min={1980}
            max={2030}
            placeholder="Ej. 2024"
            value={filters.anio || ''}
            onChange={(e) =>
              onFilterChange(
                'anio',
                e.target.value ? parseInt(e.target.value, 10) : undefined
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>
    </aside>
  );
};

