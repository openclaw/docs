---
read_when:
    - Thiết lập môi trường phát triển macOS
summary: Hướng dẫn thiết lập dành cho nhà phát triển làm việc trên ứng dụng OpenClaw dành cho macOS
title: Thiết lập môi trường phát triển trên macOS
x-i18n:
    generated_at: "2026-07-16T14:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập môi trường phát triển macOS

Biên dịch và chạy ứng dụng OpenClaw cho macOS từ mã nguồn.

## Điều kiện tiên quyết

- **Xcode 26.2+** (bộ công cụ Swift 6.2), trên phiên bản macOS mới nhất có trong
  Software Update.
- **Node.js 24.15+ & pnpm** cho Gateway, CLI và các tập lệnh đóng gói. Node
  22.22.3+ cũng hoạt động.

## 1. Cài đặt các phần phụ thuộc

```bash
pnpm install
```

## 2. Biên dịch và đóng gói ứng dụng

```bash
./scripts/package-mac-app.sh
```

Xuất ra `dist/OpenClaw.app`. Nếu không có chứng chỉ Apple Developer ID, tập lệnh
sẽ chuyển sang ký ad-hoc.

Để biết các chế độ chạy khi phát triển, cờ ký và cách khắc phục sự cố Team ID, hãy xem
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Vòng lặp phát triển nhanh từ thư mục gốc của kho lưu trữ: `scripts/restart-mac.sh` (thêm `--no-sign` để
ký ad-hoc; quyền TCC không được duy trì với `--no-sign`).

<Note>
Các ứng dụng được ký ad-hoc có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng gặp sự cố
ngay lập tức với "Abort trap 6", hãy xem [Khắc phục sự cố](#troubleshooting).
</Note>

## 3. Cài đặt CLI và Gateway

Ứng dụng đã đóng gói nhúng trình cài đặt `scripts/install-cli.sh` chính thức. Trên một
hồ sơ mới, hãy chọn **This Mac** trong quá trình thiết lập ban đầu; ứng dụng sẽ cài đặt
CLI và môi trường chạy trong không gian người dùng tương ứng trước khi khởi động trình hướng dẫn Gateway.

Để khôi phục môi trường phát triển theo cách thủ công, hãy tự cài đặt CLI tương ứng:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` và `bun add -g openclaw@<version>` cũng
hoạt động. Node vẫn là môi trường chạy được khuyến nghị cho chính Gateway.

## Khắc phục sự cố

### Biên dịch thất bại: bộ công cụ hoặc SDK không khớp

Quá trình biên dịch ứng dụng macOS yêu cầu SDK macOS mới nhất và bộ công cụ Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Nếu các phiên bản không khớp, hãy cập nhật macOS/Xcode rồi chạy lại quá trình biên dịch.

### Ứng dụng gặp sự cố khi cấp quyền

Nếu ứng dụng gặp sự cố khi bạn cố cho phép quyền truy cập **Speech Recognition** hoặc
**Microphone**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không khớp.

1. Đặt lại quyền TCC cho mã định danh gói gỡ lỗi:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó không thành công, hãy tạm thời thay đổi `BUNDLE_ID` trong
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   để buộc macOS tạo lại trạng thái sạch.

### Gateway hiển thị "Starting..." vô thời hạn

Kiểm tra xem có tiến trình zombie nào đang chiếm cổng hay không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu bạn không sử dụng LaunchAgent (chế độ phát triển / chạy thủ công), hãy tìm trình lắng nghe:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một phiên chạy thủ công đang chiếm cổng, hãy dừng phiên đó (Ctrl+C), hoặc buộc dừng PID tìm thấy ở trên
như biện pháp cuối cùng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan cài đặt](/vi/install)
