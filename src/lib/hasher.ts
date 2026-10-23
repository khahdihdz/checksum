import {
  createCRC32,
  createMD5,
  createSHA1,
  createSHA256,
  createSHA384,
  createSHA512,
} from 'hash-wasm';
import type { Algorithm } from '../types';

export interface Hasher {
  init(): void;
  update(data: Uint8Array): void;
  digest(encoding: 'hex'): string;
}

export function createHasher(algorithm: Algorithm): Promise<Hasher> {
  switch (algorithm) {
    case 'md5':
      return createMD5();
    case 'sha1':
      return createSHA1();
    case 'sha256':
      return createSHA256();
    case 'sha384':
      return createSHA384();
    case 'sha512':
      return createSHA512();
    case 'crc32':
      return createCRC32();
  }
}
