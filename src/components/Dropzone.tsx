import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  compact: boolean;
}

export function Dropzone({ onFiles, compact }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  }

  return (
    <section
      className={`dropzone${compact ? ' dropzone--compact' : ''}${isOver ? ' is-over' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Chọn file để tính checksum"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
        onClick={(event) => event.stopPropagation()}
      />
      <span className="dropzone-icon">
        <UploadCloud size={compact ? 20 : 30} aria-hidden="true" />
      </span>
      <span className="dropzone-text">
        <strong>{compact ? 'Thêm file khác' : 'Kéo thả file vào đây'}</strong>
        <span>
          {compact
            ? 'hoặc bấm để chọn từ thiết bị'
            : 'hoặc bấm để chọn. Hỗ trợ nhiều file cùng lúc.'}
        </span>
      </span>
    </section>
  );
}
