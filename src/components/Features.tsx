import { Fingerprint, Gauge, ScanSearch, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: 'Riêng tư tuyệt đối',
    description: 'File chỉ được đọc trong trình duyệt, không upload lên máy chủ.',
  },
  {
    Icon: Fingerprint,
    title: '6 thuật toán',
    description: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512 và CRC32.',
  },
  {
    Icon: Gauge,
    title: 'Tối ưu cho file lớn',
    description: 'Đọc theo chunk 4 MiB trong Web Worker, có tiến trình và nút hủy.',
  },
  {
    Icon: ScanSearch,
    title: 'So khớp thông minh',
    description: 'Tự nhận diện thuật toán, hỗ trợ output md5sum, sha256sum và certutil.',
  },
] as const;

export function Features() {
  return (
    <section className="features" aria-label="Tính năng nổi bật">
      {FEATURES.map(({ Icon, title, description }) => (
        <article className="feature" key={title}>
          <span className="feature-icon">
            <Icon size={18} aria-hidden="true" />
          </span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
