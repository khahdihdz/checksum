import type { WorkerRequest, WorkerResponse } from '../types';
import { createHasher } from './hasher';

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
};

const CHUNK_SIZE = 4 * 1024 * 1024;

let activeJobId: string | null = null;
let cancelRequested = false;

ctx.onmessage = async (event) => {
  const message = event.data;

  if (message.type === 'cancel') {
    if (activeJobId === message.jobId) cancelRequested = true;
    return;
  }

  const { jobId, file, algorithm } = message;
  activeJobId = jobId;
  cancelRequested = false;

  try {
    const hasher = await createHasher(algorithm);
    hasher.init();

    if (file.size === 0) {
      ctx.postMessage({ type: 'progress', jobId, progress: 100 });
    }

    let offset = 0;
    while (offset < file.size) {
      if (cancelRequested) {
        ctx.postMessage({ type: 'cancelled', jobId });
        return;
      }

      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const buffer = await file.slice(offset, end).arrayBuffer();

      if (cancelRequested) {
        ctx.postMessage({ type: 'cancelled', jobId });
        return;
      }

      hasher.update(new Uint8Array(buffer));
      offset = end;
      ctx.postMessage({
        type: 'progress',
        jobId,
        progress: Math.min(100, Math.round((offset / file.size) * 100)),
      });
    }

    if (cancelRequested) {
      ctx.postMessage({ type: 'cancelled', jobId });
      return;
    }

    ctx.postMessage({ type: 'done', jobId, hash: hasher.digest('hex') });
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      jobId,
      message: error instanceof Error ? error.message : 'Không thể tính checksum.',
    });
  } finally {
    if (activeJobId === jobId) activeJobId = null;
  }
};
