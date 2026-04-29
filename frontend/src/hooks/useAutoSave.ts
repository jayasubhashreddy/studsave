import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { ContentBlock } from '../utils/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useAutoSave = (unitId: string) => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const save = useCallback((content: ContentBlock[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    // Show pending state only after a short delay so rapid typing doesn't flicker
    setStatus('saving');

    timerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/units/${unitId}/content`, { content });
        if (!mountedRef.current) return;
        setStatus('saved');
        resetTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setStatus('idle');
        }, 2000);
      } catch {
        if (!mountedRef.current) return;
        setStatus('error');
        resetTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setStatus('idle');
        }, 3000);
      }
    }, 800);
  }, [unitId]);

  return { save, status };
};
