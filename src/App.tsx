import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Moon, ShieldCheck, Sun, UploadCloud } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { ExpectedInput } from './components/ExpectedInput';
import { Features } from './components/Features';
import { FileRow } from './components/FileRow';
import { Toast } from './components/Toast';
import { Toolbar } from './components/Toolbar';
import {
  compareHash,
  findExpectedForFile,
  parseChecksumText,
  type Comparison,
  type ParsedChecksum,
} from './lib/checksum';
import { useHashQueue } from './lib/useHashQueue';
import {
  algorithmLabel,
  type Algorithm,
  type FileItem,
} from './types';

type Theme = 'light' | 'dark';

const THEME_KEY = 'checksum-theme';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage có thể bị chặn.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('sha256');
  const [expectedText, setExpectedText] = useState('');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { enqueue, cancel, reset } = useHashQueue({
    onProgress: (id, progress) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'hashing', progress } : item,
        ),
      );
    },
    onDone: (id, hash) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'done', progress: 100, hash, error: undefined }
            : item,
        ),
      );
    },
    onError: (id, message) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'error', progress: 0, error: message }
            : item,
        ),
      );
    },
    onCancelled: (id) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'cancelled', progress: 0 } : item,
        ),
      );
    },
  });

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const newItems: FileItem[] = files.map((file) => ({
        id: createId(),
        file,
        status: 'queued',
        progress: 0,
      }));
      setItems((prev) => [...prev, ...newItems]);
      enqueue(
        newItems.map((item) => ({
          id: item.id,
          file: item.file,
          algorithm,
        })),
      );
    },
    [algorithm, enqueue],
  );

  const restartAll = useCallback(
    (nextAlgorithm: Algorithm) => {
      if (items.length === 0) return;
      const queued: FileItem[] = items.map((item) => ({
        ...item,
        status: 'queued',
        progress: 0,
        hash: undefined,
        error: undefined,
      }));
      setItems(queued);
      reset();
      enqueue(
        queued.map((item) => ({
          id: item.id,
          file: item.file,
          algorithm: nextAlgorithm,
        })),
      );
    },
    [items, enqueue, reset],
  );

  function handleAlgorithmChange(next: Algorithm) {
    if (next === algorithm) return;
    setAlgorithm(next);
    restartAll(next);
  }

  function retryItem(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.status === 'hashing' || item.status === 'queued') return;

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: 'queued',
              progress: 0,
              hash: undefined,
              error: undefined,
            }
          : entry,
      ),
    );
    enqueue([{ id: item.id, file: item.file, algorithm }]);
  }

  function removeItem(id: string) {
    cancel(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearAll() {
    reset();
    setItems([]);
    setExpectedText('');
  }

  async function handleCopy(text: string) {
    const ok = await copyText(text);
    setToast(ok ? 'Đã copy checksum.' : 'Không thể copy. Hãy chọn và copy thủ công.');
  }

  async function handleCopyAll() {
    const lines = items
      .filter((item) => item.status === 'done' && item.hash)
      .map((item) => `${item.hash}  ${item.file.name}`);
    if (lines.length === 0) return;

    const ok = await copyText(lines.join('\n'));
    setToast(ok ? `Đã copy ${lines.length} checksum.` : 'Không thể copy.');
  }

  function handleDownload() {
    const lines = items
      .filter((item) => item.status === 'done' && item.hash)
      .map((item) => `${item.hash}  ${item.file.name}`);
    if (lines.length === 0) return;

    downloadText(`checksum-${algorithm}.txt`, `${lines.join('\n')}\n`);
    setToast('Đã tải file checksum.');
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Bỏ qua nếu localStorage bị chặn.
    }
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const parsed = useMemo(() => parseChecksumText(expectedText), [expectedText]);

  const expectedByItem = useMemo(() => {
    const map = new Map<string, ParsedChecksum>();
    items.forEach((item, index) => {
      const expected = findExpectedForFile(
        item.file.name,
        parsed.entries,
        items.length,
        index,
      );
      if (expected) map.set(item.id, expected);
    });
    return map;
  }, [items, parsed.entries]);

  const comparisons = useMemo(() => {
    const map = new Map<string, Comparison>();
    for (const item of items) {
      if (item.status !== 'done' || !item.hash) continue;
      map.set(item.id, compareHash(item.hash, expectedByItem.get(item.id), algorithm));
    }
    return map;
  }, [items, expectedByItem, algorithm]);

  const summary = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').length;
    const match = items.filter(
      (item) => item.status === 'done' && comparisons.get(item.id) === 'match',
    ).length;
    const mismatch = items.filter((item) => {
      const result = comparisons.get(item.id);
      return (
        item.status === 'done' &&
        (result === 'mismatch' || result === 'algorithm-mismatch')
      );
    }).length;
    return { done, match, mismatch };
  }, [items, comparisons]);

  const suggestedAlgorithm = useMemo(() => {
    if (parsed.entries.length === 0) return null;
    const first = parsed.entries[0].algorithm;
    const allSame = parsed.entries.every((entry) => entry.algorithm === first);
    return allSame && first !== algorithm ? first : null;
  }, [parsed.entries, algorithm]);

  const unmatchedCount = useMemo(() => {
    if (items.length === 0) return 0;
    const used = new Set(expectedByItem.values());
    return parsed.entries.filter((entry) => !used.has(entry)).length;
  }, [expectedByItem, parsed.entries, items.length]);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;

    const handleDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setIsDragging(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragging(false);
    };

    const handleDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      const alreadyHandled = event.defaultPrevented;
      event.preventDefault();
      depth = 0;
      setIsDragging(false);
      if (!alreadyHandled && event.dataTransfer?.files.length) {
        addFiles(Array.from(event.dataTransfer.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addFiles]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <h1>Kiểm tra Checksum</h1>
            <p>Xác minh tính toàn vẹn file ngay trên trình duyệt.</p>
          </div>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
      </header>

      <main className="app-main">
        <Dropzone onFiles={addFiles} compact={items.length > 0} />

        {items.length === 0 && <Features />}

        <Toolbar
          algorithm={algorithm}
          fileCount={items.length}
          doneCount={summary.done}
          onAlgorithmChange={handleAlgorithmChange}
          onRehash={() => restartAll(algorithm)}
          onClear={clearAll}
          onCopyAll={() => void handleCopyAll()}
          onDownload={handleDownload}
        />

        {suggestedAlgorithm && (
          <div className="banner">
            <AlertCircle size={18} aria-hidden="true" />
            <span>
              Checksum bạn dán là {algorithmLabel(suggestedAlgorithm)}. Chuyển sang thuật toán này để
              so khớp chính xác.
            </span>
            <button
              type="button"
              className="button button--small"
              onClick={() => handleAlgorithmChange(suggestedAlgorithm)}
            >
              Dùng {algorithmLabel(suggestedAlgorithm)}
            </button>
          </div>
        )}

        <ExpectedInput
          value={expectedText}
          onChange={setExpectedText}
          parsed={parsed}
          fileCount={items.length}
          unmatchedCount={unmatchedCount}
        />

        {items.length > 0 && (
          <section className="panel file-panel" aria-label="Danh sách file">
            <div className="section-heading">
              <div>
                <h2>File đã chọn</h2>
                <p>{items.length} file trong hàng đợi.</p>
              </div>
              <div className="summary" aria-live="polite">
                <span>
                  {summary.done}/{items.length} đã tính
                </span>
                {parsed.entries.length > 0 && (
                  <>
                    <span className="summary-ok">{summary.match} khớp</span>
                    {summary.mismatch > 0 && (
                      <span className="summary-bad">{summary.mismatch} không khớp</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="file-list">
              {items.map((item) => (
                <FileRow
                  key={item.id}
                  item={item}
                  algorithm={algorithm}
                  expected={expectedByItem.get(item.id)}
                  comparison={comparisons.get(item.id)}
                  onCopy={(text) => void handleCopy(text)}
                  onRetry={retryItem}
                  onCancel={cancel}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>File chỉ được xử lý trong trình duyệt của bạn, không tải lên máy chủ.</p>
        <a href="https://github.com/khahdihdz/checksum" target="_blank" rel="noreferrer">
          Mã nguồn trên GitHub
        </a>
      </footer>

      {isDragging && (
        <div className="drop-overlay" aria-hidden="true">
          <UploadCloud size={44} />
          <p>Thả file để kiểm tra checksum</p>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
