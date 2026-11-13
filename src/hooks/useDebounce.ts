'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la emisión de valores de alta frecuencia (como búsquedas en tiempo real).
 * @param value Valor reactivo
 * @param delay Retraso en milisegundos (por defecto 350ms)
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
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

