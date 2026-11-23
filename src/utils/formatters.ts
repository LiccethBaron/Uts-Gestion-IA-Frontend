import { DocumentFormat } from '../types/document.types';
import { env } from '../config/env';

/**
 * Convierte un score de similitud coseno (0.0 a 1.0) en formato de porcentaje legible.
 */
export function formatSimilarityScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) return '0%';
  const percentage = Math.max(0, Math.min(100, score * 100));
  return `${percentage.toFixed(1)}%`;
}

/**
 * Devuelve la clasificación cualitativa y clases Tailwind asociadas al umbral de IA.
 * Regla IA-02: score < 0.60 se considera baja afinidad.
 */
export function getSimilarityLevel(score: number): {
  label: string;
  badgeClass: string;
  progressClass: string;
} {
  if (score >= 0.85) {
    return {
      label: 'Alta afinidad',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      progressClass: 'bg-emerald-600',
    };
  }
  if (score >= env.SIMILARITY_THRESHOLD) {
    return {
      label: 'Afinidad moderada',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      progressClass: 'bg-blue-600',
    };
  }
  return {
    label: 'Baja afinidad',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    progressClass: 'bg-slate-400',
  };
}

/**
 * Devuelve colores Tailwind según el formato del documento (RF-09).
 */
export function getFormatBadgeClasses(format: DocumentFormat): string {
  switch (format) {
    case 'pdf':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'docx':
    case 'doc':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'xlsx':
    case 'xls':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

/**
 * Formatea fechas ISO a formato institucional en español.
 */
export function formatLocalizedDate(isoDate?: string): string {
  if (!isoDate) return 'Fecha no registrada';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

