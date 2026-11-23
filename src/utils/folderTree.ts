import { FolderItem } from '../types/document.types';

export interface FolderTreeNode {
  folder: FolderItem;
  children: FolderTreeNode[];
  depth: number;
  directDocumentCount: number;
  aggregateDocumentCount: number;
  subfolderCount: number;
}

export interface FolderTreeData {
  rootContainer: FolderItem | null;
  topLevelNodes: FolderTreeNode[];
  nodeById: Map<string, FolderTreeNode>;
  folderById: Map<string, FolderItem>;
  allExpandableIds: string[];
}

export function normalizeFolderText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compareFoldersNaturally(a: FolderItem, b: FolderItem): number {
  return a.nombre.localeCompare(b.nombre, 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function buildFolderTree(folders: FolderItem[]): FolderTreeData {
  const folderById = new Map<string, FolderItem>();
  const childrenByParentId = new Map<string, FolderItem[]>();
  const nodeById = new Map<string, FolderTreeNode>();
  const allExpandableIds: string[] = [];

  for (const folder of folders) {
    folderById.set(folder.id, folder);
    const parentKey = folder.carpetaPadreId ?? '__ROOT__';
    const siblings = childrenByParentId.get(parentKey);
    if (siblings) {
      siblings.push(folder);
    } else {
      childrenByParentId.set(parentKey, [folder]);
    }
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(compareFoldersNaturally);
  }

  const rootCandidates = childrenByParentId.get('__ROOT__') ?? [];
  const rootContainer =
    rootCandidates.length === 1 &&
    (childrenByParentId.get(rootCandidates[0].id)?.length ?? 0) > 0
      ? rootCandidates[0]
      : null;

  const topLevelItems = rootContainer
    ? (childrenByParentId.get(rootContainer.id) ?? [])
    : rootCandidates;

  const visited = new Set<string>();

  const buildNode = (folder: FolderItem, depth: number): FolderTreeNode => {
    visited.add(folder.id);
    const rawChildren = childrenByParentId.get(folder.id) ?? [];
    const children: FolderTreeNode[] = [];

    for (const child of rawChildren) {
      if (!visited.has(child.id)) {
        children.push(buildNode(child, depth + 1));
      }
    }

    const directDocumentCount = folder.totalDocumentos ?? 0;
    const descendantsDocuments = children.reduce(
      (sum, child) => sum + child.aggregateDocumentCount,
      0
    );
    const subfolderCount = Math.max(folder.totalSubcarpetas ?? 0, children.length);

    if (children.length > 0) {
      allExpandableIds.push(folder.id);
    }

    const node: FolderTreeNode = {
      folder,
      children,
      depth,
      directDocumentCount,
      aggregateDocumentCount: directDocumentCount + descendantsDocuments,
      subfolderCount,
    };

    nodeById.set(folder.id, node);
    return node;
  };

  const topLevelNodes = topLevelItems
    .filter((item) => !visited.has(item.id))
    .map((item) => buildNode(item, 0));

  if (rootContainer) {
    const rootDirectDocs = rootContainer.totalDocumentos ?? 0;
    const rootDescendantsDocs = topLevelNodes.reduce(
      (sum, node) => sum + node.aggregateDocumentCount,
      0
    );
    const rootNode: FolderTreeNode = {
      folder: rootContainer,
      children: topLevelNodes,
      depth: -1,
      directDocumentCount: rootDirectDocs,
      aggregateDocumentCount: rootDirectDocs + rootDescendantsDocs,
      subfolderCount: Math.max(rootContainer.totalSubcarpetas ?? 0, topLevelNodes.length),
    };
    nodeById.set(rootContainer.id, rootNode);
  }

  return {
    rootContainer,
    topLevelNodes,
    nodeById,
    folderById,
    allExpandableIds,
  };
}

export function getFolderBreadcrumbs(
  folderId: string,
  folderById: Map<string, FolderItem>
): FolderItem[] {
  const trail: FolderItem[] = [];
  const visited = new Set<string>();
  let cursor = folderById.get(folderId);

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    trail.unshift(cursor);
    cursor = cursor.carpetaPadreId ? folderById.get(cursor.carpetaPadreId) : undefined;
  }

  return trail;
}

export function filterFolderTree(
  nodes: FolderTreeNode[],
  rawQuery: string
): { nodes: FolderTreeNode[]; autoExpandIds: Set<string> } {
  const normalizedQuery = normalizeFolderText(rawQuery);
  const autoExpandIds = new Set<string>();

  if (!normalizedQuery) {
    return { nodes, autoExpandIds };
  }

  const walk = (list: FolderTreeNode[]): FolderTreeNode[] => {
    const filtered: FolderTreeNode[] = [];

    for (const node of list) {
      const selfMatches =
        normalizeFolderText(node.folder.nombre).includes(normalizedQuery) ||
        normalizeFolderText(node.folder.rutaCompleta).includes(normalizedQuery);
      const matchedChildren = walk(node.children);

      if (matchedChildren.length > 0) {
        autoExpandIds.add(node.folder.id);
        filtered.push({
          ...node,
          children: matchedChildren,
        });
      } else if (selfMatches) {
        filtered.push({
          ...node,
          children: node.children,
        });
      }
    }

    return filtered;
  };

  return {
    nodes: walk(nodes),
    autoExpandIds,
  };
}

export function isRootFolder(
  folder: FolderItem,
  rootContainer: FolderItem | null
): boolean {
  if (rootContainer) {
    return folder.id === rootContainer.id;
  }
  const cleanPath = folder.rutaCompleta.replace(/\/+$/, '').toLowerCase();
  return folder.carpetaPadreId == null && cleanPath === '/base_documental';
}

export function getDescendantFolderIds(
  folderId: string,
  nodeById: Map<string, FolderTreeNode>
): Set<string> {
  const result = new Set<string>();

  const collect = (id: string) => {
    if (result.has(id)) return;
    result.add(id);
    const node = nodeById.get(id);
    if (!node) return;
    for (const child of node.children) {
      collect(child.folder.id);
    }
  };

  collect(folderId);
  return result;
}
