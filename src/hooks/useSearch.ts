'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchService } from '../services/searchService';
import {
  DocumentItem,
  DocumentFormat,
  SearchMode,
  SearchQueryDTO,
} from '../types/document.types';
import { useDebounce } from './useDebounce';

export interface UseSearchFilters {
  tipo?: string;
  formato?: DocumentFormat;
  anio?: number;
  carpetaId?: string;
  modo: SearchMode;
}

interface SearchState {
  resolvedKey: string;
  results: DocumentItem[];
  totalCount: number;
  error: string | null;
}

const INITIAL_SEARCH_STATE: SearchState = {
  resolvedKey: '',
  results: [],
  totalCount: 0,
  error: null,
};

export function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<UseSearchFilters>({
    modo: 'semantico',
  });
  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const debouncedQuery = useDebounce(query, 350);
  const trimmedQuery = debouncedQuery.trim();

  const hasSearchCriteria = Boolean(
    trimmedQuery || filters.tipo || filters.formato || filters.anio || filters.carpetaId
  );

  const searchKey = hasSearchCriteria
    ? JSON.stringify({
        q: trimmedQuery,
        tipo: filters.tipo,
        formato: filters.formato,
        anio: filters.anio,
        carpetaId: filters.carpetaId,
        modo: filters.modo,
        page,
      })
    : '';

  useEffect(() => {
    if (!hasSearchCriteria || !searchKey) {
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      try {
        const offset = (page - 1) * pageSize;
        const params: SearchQueryDTO = {
          q: trimmedQuery,
          tipo: filters.tipo,
          formato: filters.formato,
          anio: filters.anio,
          carpetaId: filters.carpetaId,
          modo: filters.modo,
          limit: pageSize,
          offset,
        };

        const response = await searchService.searchDocuments(params);
        if (!cancelled) {
          setSearchState({
            resolvedKey: searchKey,
            results: response.data || [],
            totalCount:
              response.total ??
              response.count ??
              (response.data ? response.data.length : 0),
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setSearchState({
            resolvedKey: searchKey,
            results: [],
            totalCount: 0,
            error:
              err instanceof Error
                ? err.message
                : 'Ocurrió un error al ejecutar la búsqueda semántica',
          });
        }
      }
    };

    void fetchResults();

    return () => {
      cancelled = true;
    };
  }, [hasSearchCriteria, searchKey, trimmedQuery, filters, page, pageSize]);

  const updateFilter = useCallback(
    <K extends keyof UseSearchFilters>(key: K, value: UseSearchFilters[K]) => {
      setFilters((prev: UseSearchFilters) => ({ ...prev, [key]: value }));
      setPage(1); // Reiniciar paginación al cambiar filtros
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({ modo: 'semantico' });
    setPage(1);
  }, []);

  const isLoading = hasSearchCriteria && searchState.resolvedKey !== searchKey;
  const isResolvedForCurrentKey = hasSearchCriteria && searchState.resolvedKey === searchKey;

  return {
    query,
    setQuery,
    filters,
    updateFilter,
    resetFilters,
    results: isResolvedForCurrentKey ? searchState.results : [],
    totalCount: isResolvedForCurrentKey ? searchState.totalCount : 0,
    isLoading,
    error: isResolvedForCurrentKey ? searchState.error : null,
    page,
    setPage,
    pageSize,
  };
}
