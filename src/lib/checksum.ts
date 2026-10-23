import { ALGORITHMS, type Algorithm } from '../types';

export interface ParsedChecksum {
  hash: string;
  algorithm: Algorithm;
  filename?: string;
  raw: string;
}

export interface ParseResult {
  entries: ParsedChecksum[];
  errors: string[];
}

export type Comparison = 'match' | 'mismatch' | 'algorithm-mismatch' | 'unknown';

const LINE_HASH = /(?:^|\s)([0-9a-f]{8,128})(?=\s|$)/i;

export function normalizeHash(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, '').replace(/[\s:_-]/g, '');
}

export function algorithmFromLength(length: number): Algorithm | null {
  const found = ALGORITHMS.find((item) => item.hexLength === length);
  return found ? found.id : null;
}

function baseName(value: string): string {
  return value.split(/[\\/]/).pop()?.trim().toLowerCase() ?? '';
}

export function parseChecksumText(text: string): ParseResult {
  const entries: ParsedChecksum[] = [];
  const errors: string[] = [];

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const match = LINE_HASH.exec(line);
    if (!match) {
      errors.push(`Dòng ${index + 1}: không tìm thấy checksum hợp lệ.`);
      return;
    }

    const hash = normalizeHash(match[1]);
    const algorithm = algorithmFromLength(hash.length);
    if (!algorithm) {
      errors.push(`Dòng ${index + 1}: độ dài checksum không được hỗ trợ.`);
      return;
    }

    const before = line.slice(0, match.index).trim();
    const after = line.slice(match.index + match[0].length).trim();
    let filename: string | undefined;

    if (after) {
      filename = after.replace(/^\*/, '').trim() || undefined;
    } else {
      const certutilStyle = before.match(/\(([^)]+)\)\s*=\s*$/);
      if (certutilStyle) filename = certutilStyle[1].trim() || undefined;
    }

    entries.push({ hash, algorithm, filename, raw: line });
  });

  return { entries, errors };
}

export function findExpectedForFile(
  filename: string,
  entries: ParsedChecksum[],
  totalFiles: number,
  index: number,
): ParsedChecksum | undefined {
  const target = baseName(filename);
  const named = entries.find(
    (entry) => entry.filename !== undefined && baseName(entry.filename) === target,
  );
  if (named) return named;

  const unnamed = entries.filter((entry) => entry.filename === undefined);
  if (unnamed.length === 0) return undefined;

  const allUnnamed = entries.every((entry) => entry.filename === undefined);
  if (allUnnamed) return unnamed[index];
  if (unnamed.length === totalFiles) return unnamed[index];
  if (totalFiles === 1 && unnamed.length === 1) return unnamed[0];

  return undefined;
}

export function compareHash(
  actual: string,
  expected: ParsedChecksum | undefined,
  algorithm: Algorithm,
): Comparison {
  if (!expected) return 'unknown';
  if (expected.algorithm !== algorithm) return 'algorithm-mismatch';
  return normalizeHash(actual) === expected.hash ? 'match' : 'mismatch';
}
