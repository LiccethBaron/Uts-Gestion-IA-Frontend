/**
 * Sanitización de consultas en lenguaje natural (Regla IA-03 / RF-14 / Ética UTS).
 * Anonimiza datos sensibles antes de enviarlos al servicio de embeddings o auditoría.
 */

export function sanitizeSearchQuery(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // 1. Anonimizar correos electrónicos personales o institucionales
  sanitized = sanitized.replace(
    /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi,
    '[CORREO_ANONIMIZADO]'
  );

  // 2. Anonimizar secuencias de números de identificación (C.C. / T.I. colombianas: 7 a 10 dígitos)
  sanitized = sanitized.replace(/\b\d{7,10}\b/g, '[DOC_ANONIMIZADO]');

  // 3. Anonimizar números celulares/telefónicos (+57 o 10 dígitos iniciando en 3)
  sanitized = sanitized.replace(/(\+?57)?\s?3\d{2}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[TEL_ANONIMIZADO]');

  // 4. Limpiar caracteres de control o inyecciones simples
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '').trim();

  return sanitized;
}

