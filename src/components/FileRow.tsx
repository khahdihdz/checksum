import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { Comparison, ParsedChecksum } from '../lib/checksum';
import { formatBytes } from '../lib/format';
import { algorithmLabel, type Algorithm, type FileItem, type ItemStatus } from '../types';

interface FileRowProps {
  item: FileItem;
  algorithm: Algorithm;
  expected?: ParsedChecksum;
  comparison?: Comparison;
  onCopy: (text: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  queued: 'Đang chờ',
  hashing: 'Đang tính',
  done: 'Đã tính',
  error: 'Lỗi',
  cancelled: 'Đã hủy',
};

function comparisonView(comparison: Comparison | undefined) {
  if (comparison === 'match') {
    return { className: 'result-badge result-badge--ok', label: 'Khớp', Icon: CheckCircle2 };
  }
  if (comparison === 'mismatch') {
    return { className: 'result-badge result-badge--bad', label: 'Không khớp', Icon: XCircle };
  }
  if (comparison === 'algorithm-mismatch') {
    return {
      className: 'result-badge result-badge--warn',
      label: 'Khác thuật toán',
      Icon: AlertCircle,
    };
  }
  return null;
}

export function FileRow({
  item,
  algorithm,
  expected,
  comparison,
  onCopy,
  onRetry,
  onCancel,
  onRemove,
}: FileRowProps) {
  const isWorking = item.status === 'queued' || item.status === 'hashing';
  const result = comparisonView(comparison);
  const { hash } = item;

  return (
    <article className="file-card">
      <div className="file-head">
        <span className="file-icon">
          <FileText size={20} aria-hidden="true" />
        </span>

        <div className="file-meta">
          <div className="file-name" title={item.file.name}>
            {item.file.name}
          </div>
          <div className="file-sub">
            <span>{formatBytes(item.file.size)}</span>
            <span aria-hidden="true">·</span>
            <span className={`status status--${item.status}`}>
              {item.status === 'hashing' && <Loader2 size={13} className="spin" aria-hidden="true" />}
              {STATUS_LABELS[item.status]}
            </span>
            {item.file.size > 2 * 1024 ** 3 && (
              <span className="badge badge--warning">File lớn</span>
            )}
          </div>
        </div>

        <div className="file-actions">
          {isWorking ? (
            <button
              type="button"
              className="icon-button"
              onClick={() => onCancel(item.id)}
              aria-label={`Hủy tính ${item.file.name}`}
            >
              <X size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="icon-button"
              onClick={() => onRetry(item.id)}
              aria-label={`Tính lại ${item.file.name}`}
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="icon-button icon-button--danger"
            onClick={() => onRemove(item.id)}
            aria-label={`Xóa ${item.file.name}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {item.status === 'hashing' && (
        <div className="progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${item.progress}%` }} />
          </div>
          <span className="progress-label">{item.progress}%</span>
        </div>
      )}

      {item.status === 'queued' && <p className="muted">Đang chờ đến lượt…</p>}

      {item.status === 'error' && (
        <p className="file-error">{item.error ?? 'Không thể tính checksum cho file này.'}</p>
      )}

      {item.status === 'cancelled' && (
        <p className="muted">Đã hủy. Bấm nút làm mới để tính lại.</p>
      )}

      {item.status === 'done' && hash && (
        <div className="hash-block">
          <div className="hash-line">
            <span className="hash-algo">{algorithmLabel(algorithm)}</span>
            <code>{hash}</code>
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={() => onCopy(hash)}
              aria-label={`Copy checksum ${algorithmLabel(algorithm)} của ${item.file.name}`}
            >
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>

          {expected && (
            <div className="expected-line">
              <span>Kỳ vọng</span>
              <code>{expected.hash}</code>
              <span className="expected-algo">{algorithmLabel(expected.algorithm)}</span>
            </div>
          )}

          {result && (
            <div className={result.className} role="status">
              <result.Icon size={16} aria-hidden="true" />
              {result.label}
            </div>
          )}

          {comparison === 'algorithm-mismatch' && expected && (
            <p className="hint hint--warning">
              Checksum bạn dán là {algorithmLabel(expected.algorithm)}, trong khi đang tính{' '}
              {algorithmLabel(algorithm)}.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
