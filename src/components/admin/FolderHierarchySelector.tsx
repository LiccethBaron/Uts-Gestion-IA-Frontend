'use client';

import React, { useMemo, useState } from 'react';
import { FolderItem } from '../../types/document.types';

interface FolderHierarchySelectorProps {
  idPrefix: string;
  folders: FolderItem[];
  isLoading: boolean;
  value: string;
  onChange: (folderId: string) => void;
  label?: string;
  required?: boolean;
  emptyLabel?: string;
  allowRootSelection?: boolean;
  excludedFolderIds?: ReadonlySet<string>;
  error?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface CascadeLevel {
  level: number;
  label: string;
  parentFolder: FolderItem | null;
  options: FolderItem[];
  selectedValue: string;
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatRelativePath(fullPath: string, rootPath?: string): string {
  if (!rootPath) return fullPath;
  const cleanRoot = rootPath.replace(/\/+$/, '');
  if (fullPath.toLowerCase().startsWith(`${cleanRoot.toLowerCase()}/`)) {
    return fullPath.slice(cleanRoot.length);
  }
  return fullPath;
}

export const FolderHierarchySelector: React.FC<FolderHierarchySelectorProps> = ({
  idPrefix,
  folders,
  isLoading,
  value,
  onChange,
  label = 'Carpeta Destino',
  required = false,
  emptyLabel = 'Selecciona una carpeta principal',
  allowRootSelection = false,
  excludedFolderIds,
  error,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    folderById,
    containerRoot,
    selectableFolders,
    cascadeLevels,
    selectedFolder,
    getChildCount,
  } = useMemo(() => {
    const byId = new Map<string, FolderItem>();
    const childrenMap = new Map<string, FolderItem[]>();

    for (const folder of folders) {
      byId.set(folder.id, folder);
    }

    for (const folder of folders) {
      if (excludedFolderIds?.has(folder.id)) {
        continue;
      }
      const parentKey = folder.carpetaPadreId ?? '__ROOT__';
      const list = childrenMap.get(parentKey);
      if (list) {
        list.push(folder);
      } else {
        childrenMap.set(parentKey, [folder]);
      }
    }

    const rootCandidates = childrenMap.get('__ROOT__') ?? [];
    const singleRootCandidate = rootCandidates.length === 1 ? rootCandidates[0] : null;
    const isInstitutionalRoot = Boolean(
      singleRootCandidate &&
        ((childrenMap.get(singleRootCandidate.id)?.length ?? 0) > 0 ||
          (allowRootSelection &&
            singleRootCandidate.rutaCompleta.replace(/\/+$/, '').toLowerCase() ===
              '/base_documental'))
    );
    const rootContainer = isInstitutionalRoot ? singleRootCandidate : null;

    const topLevelFolders = rootContainer
      ? (childrenMap.get(rootContainer.id) ?? [])
      : rootCandidates;

    const nonExcludedFolders = excludedFolderIds
      ? folders.filter((f) => !excludedFolderIds.has(f.id))
      : folders;

    const selectable =
      rootContainer && !allowRootSelection
        ? nonExcludedFolders.filter((f) => f.id !== rootContainer.id)
        : nonExcludedFolders;

    const childCountOf = (folder: FolderItem): number => {
      const localCount = childrenMap.get(folder.id)?.length ?? 0;
      return Math.max(folder.totalSubcarpetas ?? 0, localCount);
    };

    const chain: FolderItem[] = [];
    const visited = new Set<string>();
    let cursor = value ? byId.get(value) : undefined;

    while (cursor && cursor.id !== rootContainer?.id && !visited.has(cursor.id)) {
      visited.add(cursor.id);
      chain.unshift(cursor);
      cursor = cursor.carpetaPadreId ? byId.get(cursor.carpetaPadreId) : undefined;
    }

    const levels: CascadeLevel[] = [
      {
        level: 1,
        label: 'Carpeta Principal',
        parentFolder: null,
        options: topLevelFolders,
        selectedValue: chain[0]?.id ?? '',
      },
    ];

    for (let i = 0; i < chain.length; i++) {
      const node = chain[i];
      const children = childrenMap.get(node.id) ?? [];
      if (children.length > 0) {
        levels.push({
          level: i + 2,
          label: `Subcarpeta (Nivel ${i + 2})`,
          parentFolder: node,
          options: children,
          selectedValue: chain[i + 1]?.id ?? '',
        });
      }
    }

    return {
      folderById: byId,
      containerRoot: rootContainer,
      selectableFolders: selectable,
      cascadeLevels: levels,
      selectedFolder: value ? byId.get(value) : undefined,
      getChildCount: childCountOf,
    };
  }, [folders, value, allowRootSelection, excludedFolderIds]);

  const normalizedQuery = normalizeSearchText(searchTerm);
  const matchingFolders = useMemo(() => {
    if (!normalizedQuery) return [];
    return selectableFolders.filter((folder) => {
      const nameMatch = normalizeSearchText(folder.nombre).includes(normalizedQuery);
      const pathMatch = normalizeSearchText(folder.rutaCompleta).includes(normalizedQuery);
      return nameMatch || pathMatch;
    });
  }, [normalizedQuery, selectableFolders]);

  const visibleMatches = matchingFolders.slice(0, 25);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      {/* Encabezado y botón de recarga */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={`${idPrefix}-folder-search`}
          className="text-xs font-semibold text-slate-700"
        >
          {label} {required && <span className="text-red-600">*</span>}
        </label>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            <svg
              className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar carpetas'}</span>
          </button>
        )}
      </div>

      {/* Buscador rápido de carpetas hijas */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          id={`${idPrefix}-folder-search`}
          type="search"
          value={searchTerm}
          disabled={isLoading}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar carpeta o subcarpeta por nombre o ruta..."
          className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />

        {normalizedQuery && (
          <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {visibleMatches.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-slate-500">
                No se encontraron carpetas que coincidan con &ldquo;{searchTerm.trim()}&rdquo;.
              </p>
            ) : (
              visibleMatches.map((folder) => {
                const subCount = getChildCount(folder);
                const isSelected = folder.id === value;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      onChange(folder.id);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 text-left transition hover:bg-emerald-50 ${
                      isSelected ? 'bg-emerald-50/80' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {folder.nombre}
                      </span>
                      {subCount > 0 && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {subCount} subcarpetas
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-500 truncate">
                      {formatRelativePath(folder.rutaCompleta, containerRoot?.rutaCompleta)}
                    </p>
                  </button>
                );
              })
            )}
            {matchingFolders.length > visibleMatches.length && (
              <p className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50">
                Mostrando {visibleMatches.length} de {matchingFolders.length} coincidencias. Refina
                tu búsqueda para ver más.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selectores jerárquicos en cascada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {cascadeLevels.map((lvl) => {
          const selectId = `${idPrefix}-folder-level-${lvl.level}`;
          return (
            <div key={lvl.level}>
              <label
                htmlFor={selectId}
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                {lvl.label}
              </label>
              <select
                id={selectId}
                value={lvl.selectedValue}
                disabled={isLoading}
                onChange={(e) => {
                  const chosenId = e.target.value;
                  if (chosenId) {
                    onChange(chosenId);
                  } else if (lvl.parentFolder) {
                    onChange(lvl.parentFolder.id);
                  } else if (allowRootSelection && containerRoot) {
                    onChange(containerRoot.id);
                  } else {
                    onChange('');
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 disabled:bg-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">
                  {isLoading
                    ? 'Cargando carpetas...'
                    : lvl.parentFolder
                      ? `Usar «${lvl.parentFolder.nombre}» directamente`
                      : emptyLabel}
                </option>
                {lvl.options.map((folder) => {
                  const childCount = getChildCount(folder);
                  return (
                    <option key={folder.id} value={folder.id}>
                      {folder.nombre}
                      {childCount > 0 ? ` (${childCount} subcarpetas)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>

      {/* Indicador de carpeta seleccionada */}
      {selectedFolder && folderById.has(selectedFolder.id) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[11px]">
          <span className="text-emerald-900 font-mono truncate">
            <strong>Ruta seleccionada:</strong> {selectedFolder.rutaCompleta}
          </span>
          {getChildCount(selectedFolder) > 0 && (
            <span className="text-emerald-700 font-medium shrink-0">
              Tiene {getChildCount(selectedFolder)} subcarpeta(s)
            </span>
          )}
        </div>
      )}

      {!isLoading && folders.length === 0 && (
        <p className="text-[11px] text-amber-700">
          No se encontraron carpetas en el servidor. Verifica la conexión con Dropbox.
        </p>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
};
