'use client';

import React from 'react';
import { FolderItem } from '../../types/document.types';
import { FolderTreeNode } from '../../utils/folderTree';

interface FolderTreeProps {
  nodes: FolderTreeNode[];
  rootContainer: FolderItem | null;
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectFolder: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

interface TreeNodeRowProps {
  node: FolderTreeNode;
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  onSelectFolder: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
}

const TreeNodeRow: React.FC<TreeNodeRowProps> = ({
  node,
  selectedFolderId,
  expandedIds,
  onSelectFolder,
  onToggleExpand,
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.folder.id);
  const isSelected = selectedFolderId === node.folder.id;

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        style={{ paddingLeft: `${node.depth * 14 + 6}px` }}
        className={`group flex items-center gap-1 rounded-lg pr-2 py-1 text-xs transition ${
          isSelected
            ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-200'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.folder.id)}
            aria-label={
              isExpanded
                ? `Contraer ${node.folder.nombre}`
                : `Expandir ${node.folder.nombre}`
            }
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onSelectFolder(node.folder.id)}
          title={node.folder.nombre}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          <svg
            className={`h-4 w-4 shrink-0 ${
              isSelected
                ? 'text-emerald-700'
                : hasChildren
                  ? 'text-amber-500'
                  : 'text-slate-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          <span className="truncate flex-1">{node.folder.nombre}</span>

          {(node.subfolderCount > 0 || node.aggregateDocumentCount > 0) && (
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                isSelected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={
                node.subfolderCount > 0
                  ? `${node.subfolderCount} subcarpeta(s), ${node.aggregateDocumentCount} documento(s)`
                  : `${node.aggregateDocumentCount} documento(s)`
              }
            >
              {node.subfolderCount > 0
                ? `${node.subfolderCount} sub.`
                : node.aggregateDocumentCount}
            </span>
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul
          role="group"
          className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-3.5"
        >
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.folder.id}
              node={child}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onSelectFolder={onSelectFolder}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  nodes,
  rootContainer,
  selectedFolderId,
  expandedIds,
  searchQuery,
  onSearchChange,
  onSelectFolder,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      {/* Cabecera con acciones rápidas */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Estructura de Carpetas
        </h2>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={onExpandAll}
            className="rounded px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Expandir
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="rounded px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Contraer
          </button>
        </div>
      </div>

      {/* Buscador rápido de carpetas */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          aria-label="Buscar carpeta o subcarpeta"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar carpeta o subcarpeta..."
          className="w-full rounded-lg border border-slate-300 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      {/* Carpeta raíz institucional */}
      {rootContainer && !searchQuery.trim() && (
        <button
          type="button"
          onClick={() => onSelectFolder(rootContainer.id)}
          className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
            selectedFolderId === rootContainer.id
              ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <svg
              className="h-4 w-4 shrink-0 text-emerald-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="truncate">{rootContainer.nombre}</span>
          </span>
          <span className="shrink-0 text-[10px] font-medium text-slate-500">
            {nodes.length} áreas
          </span>
        </button>
      )}

      {/* Árbol jerárquico */}
      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500">
            {searchQuery.trim() ? (
              <>
                No hay carpetas que coincidan con &ldquo;{searchQuery.trim()}&rdquo;.
              </>
            ) : (
              'No hay carpetas disponibles para mostrar.'
            )}
          </p>
        </div>
      ) : (
        <ul
          role="tree"
          aria-label="Árbol de carpetas institucionales"
          className="max-h-[65vh] space-y-0.5 overflow-y-auto pr-1"
        >
          {nodes.map((node) => (
            <TreeNodeRow
              key={node.folder.id}
              node={node}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              onSelectFolder={onSelectFolder}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
