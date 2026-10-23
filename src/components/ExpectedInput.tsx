import type { ParseResult } from '../lib/checksum';
import { algorithmLabel } from '../types';

interface ExpectedInputProps {
  value: string;
  onChange: (value: string) => void;
  parsed: ParseResult;
  fileCount: number;
  unmatchedCount: number;
}

export function ExpectedInput({
  value,
  onChange,
  parsed,
  fileCount,
  unmatchedCount,
}: ExpectedInputProps) {
  const detected = Array.from(
    new Set(parsed.entries.map((entry) => algorithmLabel(entry.algorithm))),
  );

  return (
    <section className="panel expected-panel">
      <div className="section-heading">
        <div>
          <h2>Checksum kỳ vọng</h2>
          <p>
            Dán checksum hoặc output của <code>md5sum</code> / <code>sha256sum</code>. Có thể dán
            nhiều dòng.
          </p>
        </div>
        {parsed.entries.length > 0 && (
          <span className="count-pill">{parsed.entries.length} checksum</span>
        )}
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        spellCheck={false}
        placeholder={'ba7816bf...  ten-file.txt\nhoặc chỉ dán một checksum'}
        aria-label="Checksum kỳ vọng"
      />

      {parsed.entries.length > 0 && detected.length > 0 && (
        <p className="hint">Đã nhận diện: {detected.join(', ')}.</p>
      )}

      {parsed.errors.length > 0 && (
        <ul className="parse-errors">
          {parsed.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {fileCount > 0 && unmatchedCount > 0 && (
        <p className="hint hint--warning">
          {unmatchedCount} checksum không khớp với file nào. Kiểm tra lại tên file hoặc số dòng.
        </p>
      )}
    </section>
  );
}
