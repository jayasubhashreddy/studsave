import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useAutoSave = (fileId: string) => {
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

  const save = useCallback((content: any[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setStatus('saving');

    timerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/files/${fileId}/content`, { content });
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
  }, [fileId]);

  return { save, status };
};
