import { useCallback, useEffect, useRef } from 'react';
import type { Algorithm, WorkerRequest, WorkerResponse } from '../types';

export interface HashJob {
  id: string;
  file: File;
  algorithm: Algorithm;
}

interface HashQueueOptions {
  onProgress: (id: string, progress: number) => void;
  onDone: (id: string, hash: string) => void;
  onError: (id: string, message: string) => void;
  onCancelled: (id: string) => void;
}

export function useHashQueue(options: HashQueueOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const workerRef = useRef<Worker | null>(null);
  const queueRef = useRef<HashJob[]>([]);
  const activeRef = useRef<HashJob | null>(null);
  const pumpRef = useRef<() => void>(() => {});

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('./hash.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const active = activeRef.current;
      if (!active || message.jobId !== active.id) return;

      if (message.type === 'progress') {
        optionsRef.current.onProgress(active.id, message.progress);
        return;
      }

      activeRef.current = null;

      if (message.type === 'done') {
        optionsRef.current.onDone(active.id, message.hash);
      } else if (message.type === 'cancelled') {
        optionsRef.current.onCancelled(active.id);
      } else {
        optionsRef.current.onError(active.id, message.message);
      }

      pumpRef.current();
    };

    worker.onerror = (event) => {
      const active = activeRef.current;
      activeRef.current = null;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      if (active) {
        optionsRef.current.onError(active.id, event.message || 'Worker gặp lỗi.');
      }
      pumpRef.current();
    };

    workerRef.current = worker;
    return worker;
  }, []);

  const pump = useCallback(() => {
    if (activeRef.current) return;

    const job = queueRef.current.shift();
    if (!job) return;

    activeRef.current = job;
    ensureWorker().postMessage({
      type: 'hash',
      jobId: job.id,
      file: job.file,
      algorithm: job.algorithm,
    } satisfies WorkerRequest);
  }, [ensureWorker]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueue = useCallback(
    (jobs: HashJob[]) => {
      if (jobs.length === 0) return;
      queueRef.current.push(...jobs);
      pump();
    },
    [pump],
  );

  const cancel = useCallback((id: string) => {
    const wasQueued = queueRef.current.some((job) => job.id === id);
    queueRef.current = queueRef.current.filter((job) => job.id !== id);

    if (activeRef.current?.id === id) {
      workerRef.current?.postMessage({ type: 'cancel', jobId: id } satisfies WorkerRequest);
    } else if (wasQueued) {
      optionsRef.current.onCancelled(id);
    }
  }, []);

  const reset = useCallback(() => {
    queueRef.current = [];
    activeRef.current = null;
    const worker = workerRef.current;
    if (worker) {
      worker.terminate();
      workerRef.current = null;
    }
  }, []);

  useEffect(() => () => reset(), [reset]);

  return { enqueue, cancel, reset };
}
