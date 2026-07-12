---
read_when:
    - Thiết lập môi trường phát triển macOS
summary: Hướng dẫn thiết lập dành cho nhà phát triển làm việc trên ứng dụng OpenClaw cho macOS
title: Thiết lập môi trường phát triển trên macOS
x-i18n:
    generated_at: "2026-07-12T08:04:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập môi trường phát triển macOS

Biên dịch và chạy ứng dụng OpenClaw dành cho macOS từ mã nguồn.

## Điều kiện tiên quyết

- **Xcode 26.2+** (bộ công cụ Swift 6.2), trên phiên bản macOS mới nhất có trong
  Software Update.
- **Node.js 24 và pnpm** cho Gateway, CLI và các tập lệnh đóng gói. Node
  22.19+ cũng hoạt động.

## 1. Cài đặt các phần phụ thuộc

```bash
pnpm install
```

## 2. Biên dịch và đóng gói ứng dụng

```bash
./scripts/package-mac-app.sh
```

Tạo ra `dist/OpenClaw.app`. Nếu không có chứng chỉ Apple Developer ID, tập lệnh
sẽ chuyển sang ký tùy ứng.

Để biết các chế độ chạy phát triển, cờ ký và cách khắc phục sự cố Team ID, hãy xem
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Vòng lặp phát triển nhanh từ thư mục gốc của kho mã: `scripts/restart-mac.sh` (thêm `--no-sign` để
ký tùy ứng; quyền TCC không được duy trì khi dùng `--no-sign`).

<Note>
Các ứng dụng được ký tùy ứng có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng gặp sự cố
ngay lập tức với thông báo "Abort trap 6", hãy xem [Khắc phục sự cố](#troubleshooting).
</Note>

## 3. Cài đặt CLI và Gateway

Ứng dụng đã đóng gói nhúng trình cài đặt chính thức `scripts/install-cli.sh`. Trên một
hồ sơ mới, hãy chọn **This Mac** trong quá trình thiết lập ban đầu; ứng dụng sẽ cài đặt
CLI không gian người dùng và môi trường chạy tương ứng trước khi khởi động trình hướng dẫn Gateway.

Để khôi phục môi trường phát triển theo cách thủ công, hãy tự cài đặt CLI tương ứng:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` và `bun add -g openclaw@<version>` cũng
hoạt động. Node vẫn là môi trường chạy được khuyến nghị cho chính Gateway.

## Khắc phục sự cố

### Biên dịch thất bại: bộ công cụ hoặc SDK không tương thích

Quá trình biên dịch ứng dụng macOS yêu cầu SDK macOS mới nhất và bộ công cụ Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Nếu các phiên bản không tương thích, hãy cập nhật macOS/Xcode rồi chạy lại quá trình biên dịch.

### Ứng dụng gặp sự cố khi cấp quyền

Nếu ứng dụng gặp sự cố khi bạn cố gắng cho phép quyền truy cập **Speech Recognition** hoặc
**Microphone**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không tương thích.

1. Đặt lại quyền TCC cho mã định danh gói gỡ lỗi:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó không hiệu quả, hãy tạm thời thay đổi `BUNDLE_ID` trong
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   để buộc macOS tạo trạng thái hoàn toàn mới.

### Gateway hiển thị "Starting..." vô thời hạn

Kiểm tra xem có tiến trình zombie nào đang chiếm cổng hay không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu bạn không sử dụng LaunchAgent (chế độ phát triển / chạy thủ công), hãy tìm tiến trình đang lắng nghe:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một phiên chạy thủ công đang chiếm cổng, hãy dừng phiên đó (Ctrl+C), hoặc hủy PID tìm thấy ở trên
như biện pháp cuối cùng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan về cài đặt](/vi/install)
