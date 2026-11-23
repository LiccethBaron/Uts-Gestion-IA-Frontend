'use client';

import { useState, useEffect } from 'react';
import { env } from '../config/env';

/**
 * Hook para retrasar la emisión de valores de alta frecuencia (como búsquedas en tiempo real).
 * @param value Valor reactivo
 * @param delay Retraso en milisegundos (por defecto el valor configurado en env.SEARCH_DEBOUNCE_MS)
 */
export function useDebounce<T>(value: T, delay: number = env.SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

