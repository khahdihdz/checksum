import { describe, expect, it } from 'vitest';
import {
  algorithmFromLength,
  compareHash,
  findExpectedForFile,
  normalizeHash,
  parseChecksumText,
  type ParsedChecksum,
} from './checksum';
import { createHasher } from './hasher';
import type { Algorithm } from '../types';

async function hashText(algorithm: Algorithm, text: string): Promise<string> {
  const hasher = await createHasher(algorithm);
  hasher.init();
  hasher.update(new TextEncoder().encode(text));
  return hasher.digest('hex');
}

describe('checksum parsing', () => {
  it('detects algorithms by hash length', () => {
    expect(algorithmFromLength(8)).toBe('crc32');
    expect(algorithmFromLength(32)).toBe('md5');
    expect(algorithmFromLength(40)).toBe('sha1');
    expect(algorithmFromLength(64)).toBe('sha256');
    expect(algorithmFromLength(96)).toBe('sha384');
    expect(algorithmFromLength(128)).toBe('sha512');
    expect(algorithmFromLength(12)).toBeNull();
  });

  it('normalizes separators and casing', () => {
    expect(normalizeHash('  AA:BB-CC_DD  ')).toBe('aabbccdd');
    expect(normalizeHash('0xABCD')).toBe('abcd');
  });

  it('parses md5sum style output', () => {
    const hash = 'a'.repeat(64);
    const parsed = parseChecksumText(`${hash}  file name.txt`);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.entries[0]).toMatchObject({
      hash,
      algorithm: 'sha256',
      filename: 'file name.txt',
    });
  });

  it('parses binary marker and certutil style output', () => {
    const hash = 'b'.repeat(64);
    const binary = parseChecksumText(`${hash} *archive.zip`);
    expect(binary.entries[0].filename).toBe('archive.zip');

    const certutil = parseChecksumText(`SHA256 (archive.zip) = ${hash}`);
    expect(certutil.entries[0].filename).toBe('archive.zip');
  });

  it('reports invalid lines without dropping valid ones', () => {
    const hash = 'c'.repeat(64);
    const parsed = parseChecksumText(`không phải checksum\n${hash}`);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].filename).toBeUndefined();
  });

  it('maps named and unnamed checksums to files', () => {
    const first = 'a'.repeat(64);
    const second = 'b'.repeat(64);
    const entries = parseChecksumText(`${first}  one.txt\n${second}  two.txt`).entries;

    expect(findExpectedForFile('one.txt', entries, 2, 0)?.hash).toBe(first);
    expect(findExpectedForFile('two.txt', entries, 2, 1)?.hash).toBe(second);
    expect(findExpectedForFile('missing.txt', entries, 2, 0)).toBeUndefined();

    const unnamed = parseChecksumText(`${first}\n${second}`).entries;
    expect(findExpectedForFile('x.bin', unnamed, 2, 1)?.hash).toBe(second);
  });

  it('compares hashes and flags algorithm mismatches', () => {
    const expected: ParsedChecksum = {
      hash: 'a'.repeat(64),
      algorithm: 'sha256',
      raw: '',
    };
    expect(compareHash('a'.repeat(64), expected, 'sha256')).toBe('match');
    expect(compareHash('b'.repeat(64), expected, 'sha256')).toBe('mismatch');
    expect(compareHash('a'.repeat(64), expected, 'sha512')).toBe('algorithm-mismatch');
    expect(compareHash('a'.repeat(64), undefined, 'sha256')).toBe('unknown');
  });
});

describe('hash implementations', () => {
  it('matches standard vectors for "abc"', async () => {
    expect(await hashText('md5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(await hashText('sha1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await hashText('sha256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(await hashText('sha384', 'abc')).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    );
    expect(await hashText('sha512', 'abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
    expect(await hashText('crc32', 'abc')).toBe('352441c2');
  });

  it('handles empty input', async () => {
    expect(await hashText('sha256', '')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
