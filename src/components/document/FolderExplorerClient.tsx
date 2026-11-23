'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { documentService } from '../../services/documentService';
import { FolderItem } from '../../types/document.types';
import {
  buildFolderTree,
  filterFolderTree,
  FolderTreeData,
  FolderTreeNode,
  getDescendantFolderIds,
  getFolderBreadcrumbs,
  isRootFolder,
} from '../../utils/folderTree';
import { CreateFolderModal } from '../admin/CreateFolderModal';
import { DeleteFolderModal } from '../admin/DeleteFolderModal';
import { EditFolderModal } from '../admin/EditFolderModal';
import { FolderDetailPanel } from './FolderDetailPanel';
import { FolderTree } from './FolderTree';

export function FolderExplorerClient() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [createModalState, setCreateModalState] = useState<{
    open: boolean;
    parentId: string;
    key: number;
  }>({ open: false, parentId: '', key: 0 });
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [deletingNode, setDeletingNode] = useState<FolderTreeNode | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFolders = async () => {
      try {
        const tree = await documentService.getFolderTree();
        if (!cancelled) {
          setFolders(tree);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No fue posible cargar la estructura de carpetas institucionales.'
          );
          setIsLoading(false);
        }
      }
    };

    void loadFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchLatestTree = useCallback(
    async (forceRefresh = false): Promise<FolderTreeData> => {
      const tree = await documentService.getFolderTree(
        forceRefresh ? { refresh: true } : undefined
      );
      setFolders(tree);
      return buildFolderTree(tree);
    },
    []
  );

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchLatestTree(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar la estructura de carpetas institucionales.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDropbox = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextTree = await fetchLatestTree(true);
      setFeedback({
        type: 'success',
        message: `Estructura sincronizada con Dropbox (${nextTree.folderById.size} directorios disponibles).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No fue posible sincronizar las carpetas con Dropbox.',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchLatestTree]);

  const treeData = useMemo(() => buildFolderTree(folders), [folders]);

  const effectiveSelectedId =
    selectedFolderId && treeData.nodeById.has(selectedFolderId)
      ? selectedFolderId
      : (treeData.rootContainer?.id ?? treeData.topLevelNodes[0]?.folder.id ?? null);

  const selectedNode = effectiveSelectedId
    ? (treeData.nodeById.get(effectiveSelectedId) ?? null)
    : null;

  const isRootSelected = selectedNode
    ? isRootFolder(selectedNode.folder, treeData.rootContainer)
    : false;

  const breadcrumbs = useMemo(() => {
    if (!effectiveSelectedId) return [];
    return getFolderBreadcrumbs(effectiveSelectedId, treeData.folderById);
  }, [effectiveSelectedId, treeData.folderById]);

  const filteredTree = useMemo(
    () => filterFolderTree(treeData.topLevelNodes, searchQuery),
    [treeData.topLevelNodes, searchQuery]
  );

  const effectiveExpandedIds = useMemo(() => {
    if (!searchQuery.trim()) return expandedIds;
    const merged = new Set(expandedIds);
    filteredTree.autoExpandIds.forEach((id) => merged.add(id));
    return merged;
  }, [expandedIds, filteredTree.autoExpandIds, searchQuery]);

  const expandAncestorsForFolder = useCallback(
    (folderId: string, folderById: Map<string, FolderItem>) => {
      const trail = getFolderBreadcrumbs(folderId, folderById);
      if (trail.length > 1) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          trail.slice(0, -1).forEach((item) => next.add(item.id));
          return next;
        });
      }
    },
    []
  );

  const handleSelectFromTree = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
  }, []);

  const handleSelectFromDetail = useCallback(
    (folderId: string) => {
      setSelectedFolderId(folderId);
      expandAncestorsForFolder(folderId, treeData.folderById);
    },
    [expandAncestorsForFolder, treeData.folderById]
  );

  const handleToggleExpand = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(treeData.allExpandableIds));
  }, [treeData.allExpandableIds]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const openCreateModal = useCallback((parentId: string) => {
    setCreateModalState((prev) => ({
      open: true,
      parentId,
      key: prev.key + 1,
    }));
  }, []);

  const handleFolderCreated = useCallback(
    async (created: FolderItem) => {
      setFeedback({
        type: 'success',
        message: `Carpeta «${created.nombre}» creada en Dropbox y registrada correctamente.`,
      });
      setSelectedFolderId(created.id);

      try {
        const nextTree = await fetchLatestTree(false);
        expandAncestorsForFolder(created.id, nextTree.folderById);
      } catch {
        setFolders((prev) => [...prev, created]);
      }
    },
    [expandAncestorsForFolder, fetchLatestTree]
  );

  const handleFolderUpdated = useCallback(
    async (updated: FolderItem) => {
      setFeedback({
        type: 'success',
        message: `Carpeta «${updated.nombre}» actualizada y sincronizada correctamente.`,
      });
      setSelectedFolderId(updated.id);

      try {
        const nextTree = await fetchLatestTree(false);
        expandAncestorsForFolder(updated.id, nextTree.folderById);
      } catch {
        setFolders((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      }
    },
    [expandAncestorsForFolder, fetchLatestTree]
  );

  const handleFolderDeleted = useCallback(
    async (deleted: FolderItem) => {
      const fallbackId = deleted.carpetaPadreId ?? treeData.rootContainer?.id ?? null;
      setFeedback({
        type: 'success',
        message: `Carpeta «${deleted.nombre}» eliminada de Dropbox y de la base de datos.`,
      });

      try {
        const nextTree = await fetchLatestTree(false);
        const resolvedFallback =
          fallbackId && nextTree.nodeById.has(fallbackId)
            ? fallbackId
            : (nextTree.rootContainer?.id ?? nextTree.topLevelNodes[0]?.folder.id ?? null);
        setSelectedFolderId(resolvedFallback);
      } catch {
        setSelectedFolderId(fallbackId);
        setFolders((prev) => prev.filter((item) => item.id !== deleted.id));
      }
    },
    [fetchLatestTree, treeData.rootContainer?.id]
  );

  const excludedIdsForEdit = useMemo(() => {
    if (!editingFolder) return new Set<string>();
    return getDescendantFolderIds(editingFolder.id, treeData.nodeById);
  }, [editingFolder, treeData.nodeById]);

  const descendantCountForDelete = useMemo(() => {
    if (!deletingNode) return 0;
    const ids = getDescendantFolderIds(deletingNode.folder.id, treeData.nodeById);
    return Math.max(0, ids.size - 1);
  }, [deletingNode, treeData.nodeById]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-8 w-full rounded-lg bg-slate-100" />
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-8 w-full rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="h-4 w-64 rounded bg-slate-100" />
          <div className="h-7 w-72 rounded bg-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3"
      >
        <p className="text-sm font-semibold text-red-800">
          Error al cargar el árbol de carpetas
        </p>
        <p className="text-xs text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void handleRetry()}
          className="inline-flex items-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra superior de acciones del módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <p className="text-xs text-slate-600">
          <strong className="font-semibold text-slate-900">{folders.length}</strong>{' '}
          directorios registrados en el árbol institucional
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void handleSyncDropbox()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
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
            <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar con Dropbox'}</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal(treeData.rootContainer?.id ?? '')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Nueva carpeta</span>
          </button>
        </div>
      </div>

      {/* Banner de retroalimentación */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-semibold hover:underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Árbol izquierdo + Panel derecho */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <FolderTree
            nodes={filteredTree.nodes}
            rootContainer={treeData.rootContainer}
            selectedFolderId={effectiveSelectedId}
            expandedIds={effectiveExpandedIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectFolder={handleSelectFromTree}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </div>

        <div className="lg:col-span-7">
          <FolderDetailPanel
            selectedNode={selectedNode}
            breadcrumbs={breadcrumbs}
            onSelectFolder={handleSelectFromDetail}
            isRootSelected={isRootSelected}
            onCreateSubfolder={(parentFolder) => openCreateModal(parentFolder.id)}
            onEditFolder={(folder) => setEditingFolder(folder)}
            onDeleteFolder={(node) => setDeletingNode(node)}
          />
        </div>
      </div>

      {/* Modal: Crear Carpeta */}
      {createModalState.open && (
        <CreateFolderModal
          key={`create-folder-${createModalState.key}`}
          folders={folders}
          initialParentId={createModalState.parentId}
          rootContainer={treeData.rootContainer}
          isRefreshingFolders={isRefreshing}
          onRefreshFolders={() => void handleSyncDropbox()}
          onClose={() =>
            setCreateModalState((prev) => ({ ...prev, open: false }))
          }
          onCreated={(created) => void handleFolderCreated(created)}
        />
      )}

      {/* Modal: Renombrar / Mover Carpeta */}
      {editingFolder && (
        <EditFolderModal
          key={`edit-folder-${editingFolder.id}`}
          folder={editingFolder}
          folders={folders}
          rootContainer={treeData.rootContainer}
          excludedFolderIds={excludedIdsForEdit}
          isRefreshingFolders={isRefreshing}
          onRefreshFolders={() => void handleSyncDropbox()}
          onClose={() => setEditingFolder(null)}
          onUpdated={(updated) => void handleFolderUpdated(updated)}
        />
      )}

      {/* Modal: Eliminar Carpeta */}
      {deletingNode && (
        <DeleteFolderModal
          key={`delete-folder-${deletingNode.folder.id}`}
          node={deletingNode}
          totalDescendantFolders={descendantCountForDelete}
          onClose={() => setDeletingNode(null)}
          onDeleted={(deleted) => void handleFolderDeleted(deleted)}
        />
      )}
    </div>
  );
}
