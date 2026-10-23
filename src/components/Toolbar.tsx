import { Copy, Download, RefreshCw, Trash2 } from 'lucide-react';
import { ALGORITHMS, type Algorithm } from '../types';

interface ToolbarProps {
  algorithm: Algorithm;
  fileCount: number;
  doneCount: number;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  onRehash: () => void;
  onClear: () => void;
  onCopyAll: () => void;
  onDownload: () => void;
}

export function Toolbar({
  algorithm,
  fileCount,
  doneCount,
  onAlgorithmChange,
  onRehash,
  onClear,
  onCopyAll,
  onDownload,
}: ToolbarProps) {
  return (
    <section className="toolbar" aria-label="Tùy chọn tính checksum">
      <label className="select-field">
        <span>Thuật toán</span>
        <select
          value={algorithm}
          onChange={(event) => onAlgorithmChange(event.target.value as Algorithm)}
        >
          {ALGORITHMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="toolbar-actions">
        <button type="button" className="button" onClick={onRehash} disabled={fileCount === 0}>
          <RefreshCw size={16} aria-hidden="true" />
          Tính lại
        </button>
        <button type="button" className="button" onClick={onCopyAll} disabled={doneCount === 0}>
          <Copy size={16} aria-hidden="true" />
          Copy tất cả
        </button>
        <button type="button" className="button" onClick={onDownload} disabled={doneCount === 0}>
          <Download size={16} aria-hidden="true" />
          Tải .txt
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={onClear}
          disabled={fileCount === 0}
        >
          <Trash2 size={16} aria-hidden="true" />
          Xóa tất cả
        </button>
      </div>
    </section>
  );
}
