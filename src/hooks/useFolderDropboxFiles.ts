'use client';

import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { DropboxFolderFileItem } from '../types/document.types';

interface FolderFilesState {
  resolvedKey: string;
  files: DropboxFolderFileItem[];
  error: string | null;
}

const INITIAL_STATE: FolderFilesState = {
  resolvedKey: '',
  files: [],
  error: null,
};

export function useFolderDropboxFiles(
  folderId: string,
  enabled: boolean,
  recursive: boolean = false
) {
  const [state, setState] = useState<FolderFilesState>(INITIAL_STATE);
  const activeFolderId = enabled && folderId ? folderId : '';
  const requestKey = activeFolderId ? `${activeFolderId}:${recursive ? '1' : '0'}` : '';

  useEffect(() => {
    if (!activeFolderId || !requestKey) return;

    let cancelled = false;

    const loadFiles = async () => {
      try {
        const files = await documentService.getFolderDropboxFiles(
          activeFolderId,
          recursive
        );
        if (!cancelled) {
          setState({
            resolvedKey: requestKey,
            files,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            resolvedKey: requestKey,
            files: [],
            error:
              err instanceof Error
                ? err.message
                : 'No se pudieron consultar los archivos de Dropbox en esta carpeta.',
          });
        }
      }
    };

    void loadFiles();

    return () => {
      cancelled = true;
    };
  }, [activeFolderId, recursive, requestKey]);

  const isLoading = Boolean(requestKey) && state.resolvedKey !== requestKey;
  const isResolved = Boolean(requestKey) && state.resolvedKey === requestKey;

  return {
    files: isResolved ? state.files : [],
    isLoading,
    error: isResolved ? state.error : null,
  };
}
