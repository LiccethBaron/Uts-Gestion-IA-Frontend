'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { documentService } from '../../services/documentService';
import { DocumentItem, FolderItem } from '../../types/document.types';
import { CreateDocumentModal } from './CreateDocumentModal';
import { EditDocumentModal } from './EditDocumentModal';

const INITIAL_SAMPLE_DOCS: DocumentItem[] = [
  {
    id: 'doc-1',
    codigo: 'REG-EST-001',
    nombre: 'Reglamento Estudiantil Institucional UTS',
    descripcion: 'Lineamientos de derechos, deberes y normativas académicas de estudiantes.',
    formato: 'pdf',
    tipo: 'Reglamento',
    anio: 2023,
    rutaCompleta: '/UTS/02. PROCESOS ACADEMICOS/REG-EST-001.pdf',
    carpetaMadre: '02. PROCESOS ACADÉMICOS',
    estaExcluido: false,
    esVigente: true,
    scoreSimilitud: 1.0,
  },
  {
    id: 'doc-2',
    codigo: 'MAN-SGC-002',
    nombre: 'Manual de Procesos del Sistema de Gestión de Calidad',
    descripcion: 'Estructura metodológica de auditorías internas y aseguramiento institucional.',
    formato: 'pdf',
    tipo: 'Manual',
    anio: 2024,
    rutaCompleta: '/UTS/01. GESTION DIRECTIVA/MAN-SGC-002.pdf',
    carpetaMadre: '01. GESTIÓN DIRECTIVA Y CALIDAD',
    estaExcluido: false,
    esVigente: true,
    scoreSimilitud: 1.0,
  },
  {
    id: 'doc-3',
    codigo: 'FOR-INV-015',
    nombre: 'Formato de Presentación de Proyectos de Grado',
    descripcion: 'Plantilla normalizada para propuestas de anteproyecto en ingeniería.',
    formato: 'docx',
    tipo: 'Formato',
    anio: 2022,
    rutaCompleta: '/UTS/03. INVESTIGACION/FOR-INV-015.docx',
    carpetaMadre: '03. INVESTIGACIÓN E INNOVACIÓN',
    estaExcluido: true,
    esVigente: false,
    scoreSimilitud: 1.0,
  },
];

export function AdminDocumentsClient() {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_SAMPLE_DOCS);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(true);
  const [isRefreshingFolders, setIsRefreshingFolders] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFolders = async () => {
      try {
        const tree = await documentService.getFolderTree();
        if (!cancelled) {
          setFolders(tree);
          setIsLoadingFolders(false);
        }
      } catch {
        if (!cancelled) {
          setFolders([]);
          setIsLoadingFolders(false);
        }
      }
    };

    void loadFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefreshFolders = async () => {
    setIsRefreshingFolders(true);
    try {
      const tree = await documentService.getFolderTree({ refresh: true });
      setFolders(tree);
      setFeedback({
        type: 'success',
        message: `Carpetas sincronizadas desde Dropbox (${tree.length} carpetas disponibles).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No fue posible sincronizar las carpetas desde Dropbox.',
      });
    } finally {
      setIsRefreshingFolders(false);
    }
  };

  const toggleExclusion = (id: string) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, estaExcluido: !doc.estaExcluido } : doc
      )
    );
  };

  const handleDocumentCreated = (createdDoc: DocumentItem) => {
    setDocs((prev) => [createdDoc, ...prev]);
    setFeedback({
      type: 'success',
      message: `Documento "${createdDoc.nombre}" creado y vinculado correctamente en Dropbox.`,
    });
  };

  const handleDocumentUpdated = (updatedDoc: DocumentItem) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === updatedDoc.id
          ? {
              ...updatedDoc,
              estaExcluido: doc.estaExcluido,
              esVigente: doc.esVigente,
            }
          : doc
      )
    );
    setFeedback({
      type: 'success',
      message: `Metadatos de "${updatedDoc.nombre}" actualizados correctamente.`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestión Documental y Metadatos (RF-07, RF-15, RF-16)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Administra los códigos únicos, la vigencia, los archivos en Dropbox y la exclusión lógica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/explorer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span>Gestionar carpetas</span>
          </Link>

          <button
            type="button"
            disabled={isLoadingFolders || isRefreshingFolders}
            onClick={() => void handleRefreshFolders()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <svg
              className={`w-4 h-4 ${isRefreshingFolders ? 'animate-spin' : ''}`}
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
            <span>
              {isRefreshingFolders ? 'Sincronizando carpetas...' : 'Sincronizar con Dropbox'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
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
            <span>Nuevo Documento</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Código / Nombre</th>
                <th className="py-3 px-4">Formato / Tipo</th>
                <th className="py-3 px-4">Carpeta Madre</th>
                <th className="py-3 px-4">Año</th>
                <th className="py-3 px-4">Estado (RF-13)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-emerald-800">
                      {doc.codigo}
                    </span>
                    <p className="text-slate-900 font-semibold mt-0.5">{doc.nombre}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.formato}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{doc.tipo}</span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-700">{doc.carpetaMadre}</td>
                  <td className="py-3 px-4 text-[11px] font-medium">{doc.anio}</td>
                  <td className="py-3 px-4">
                    {doc.estaExcluido ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Excluido de búsqueda
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Visible al público
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDoc(doc)}
                        className="px-2.5 py-1 rounded text-[11px] font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExclusion(doc.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition ${
                          doc.estaExcluido
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        {doc.estaExcluido ? 'Restaurar' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          folders={folders}
          isLoadingFolders={isLoadingFolders}
          isRefreshingFolders={isRefreshingFolders}
          onRefreshFolders={() => void handleRefreshFolders()}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleDocumentCreated}
        />
      )}

      {editingDoc && (
        <EditDocumentModal
          key={editingDoc.id}
          document={editingDoc}
          folders={folders}
          isLoadingFolders={isLoadingFolders}
          isRefreshingFolders={isRefreshingFolders}
          onRefreshFolders={() => void handleRefreshFolders()}
          onClose={() => setEditingDoc(null)}
          onUpdated={handleDocumentUpdated}
        />
      )}
    </div>
  );
}
