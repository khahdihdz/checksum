export const ALGORITHMS = [
  { id: 'md5', label: 'MD5', hexLength: 32 },
  { id: 'sha1', label: 'SHA-1', hexLength: 40 },
  { id: 'sha256', label: 'SHA-256', hexLength: 64 },
  { id: 'sha384', label: 'SHA-384', hexLength: 96 },
  { id: 'sha512', label: 'SHA-512', hexLength: 128 },
  { id: 'crc32', label: 'CRC32', hexLength: 8 },
] as const;

export type Algorithm = (typeof ALGORITHMS)[number]['id'];

export function algorithmLabel(algorithm: Algorithm): string {
  return ALGORITHMS.find((item) => item.id === algorithm)?.label ?? algorithm.toUpperCase();
}

export type ItemStatus = 'queued' | 'hashing' | 'done' | 'error' | 'cancelled';

export interface FileItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  hash?: string;
  error?: string;
}

export interface WorkerHashRequest {
  type: 'hash';
  jobId: string;
  file: File;
  algorithm: Algorithm;
}

export interface WorkerCancelRequest {
  type: 'cancel';
  jobId: string;
}

export type WorkerRequest = WorkerHashRequest | WorkerCancelRequest;

export type WorkerResponse =
  | { type: 'progress'; jobId: string; progress: number }
  | { type: 'done'; jobId: string; hash: string }
  | { type: 'error'; jobId: string; message: string }
  | { type: 'cancelled'; jobId: string };
