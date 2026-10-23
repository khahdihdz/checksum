# Kiểm tra Checksum

Webapp tĩnh giúp kiểm tra checksum file ngay trên trình duyệt. File của bạn
không bao giờ được tải lên máy chủ; mọi phép tính diễn ra cục bộ trong Web Worker.

**Demo:** https://khahdihdz.github.io/checksum/

## Tính năng

- Kéo-thả hoặc chọn nhiều file.
- Hỗ trợ MD5, SHA-1, SHA-256, SHA-384, SHA-512 và CRC32.
- Tính streaming theo từng chunk, có tiến trình và nút hủy, phù hợp với file lớn.
- Dán checksum kỳ vọng để so khớp:
  - Tự nhận diện thuật toán theo độ dài.
  - Hỗ trợ output của `md5sum` / `sha256sum` và định dạng `certutil`.
  - Ghép checksum với file theo tên hoặc theo thứ tự.
- Copy từng checksum, copy tất cả hoặc tải file `.txt` theo định dạng chuẩn.
- Giao diện sáng/tối, responsive, không phụ thuộc backend.

## Chạy local

```bash
npm install
npm run dev
```

Các lệnh kiểm tra:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

## Deploy

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) tự động
build và deploy lên GitHub Pages mỗi khi có push lên nhánh `main`, hoặc khi chạy
thủ công từ tab Actions.

Lần đầu sử dụng, vào **Settings → Pages → Source** và chọn **GitHub Actions**
nếu Pages chưa được bật. Workflow cũng cố gắng bật Pages tự động bằng
`actions/configure-pages`.

Sau khi workflow xanh, ứng dụng có tại:

```
https://khahdihdz.github.io/checksum/
```

## Bảo mật

Ứng dụng không có backend, không analytics và không gửi nội dung file đi đâu.
Toàn bộ quá trình đọc file và tính hash diễn ra trong trình duyệt.

## Giấy phép

[MIT](LICENSE)
