---
read_when:
    - Thiết lập môi trường phát triển macOS
summary: Hướng dẫn thiết lập cho nhà phát triển làm việc trên ứng dụng macOS của OpenClaw
title: Thiết lập phát triển trên macOS
x-i18n:
    generated_at: "2026-06-27T17:41:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập nhà phát triển macOS

Xây dựng và chạy ứng dụng macOS OpenClaw từ mã nguồn.

## Điều kiện tiên quyết

Trước khi xây dựng ứng dụng, hãy đảm bảo bạn đã cài đặt các thành phần sau:

1. **Xcode 26.2+**: Bắt buộc cho phát triển Swift.
2. **Node.js 24 & pnpm**: Được khuyến nghị cho Gateway, CLI và các tập lệnh đóng gói. Node 22 LTS, hiện là `22.19+`, vẫn được hỗ trợ để tương thích.

## 1. Cài đặt phần phụ thuộc

Cài đặt các phần phụ thuộc cho toàn dự án:

```bash
pnpm install
```

## 2. Xây dựng và đóng gói ứng dụng

Để xây dựng ứng dụng macOS và đóng gói thành `dist/OpenClaw.app`, hãy chạy:

```bash
./scripts/package-mac-app.sh
```

Nếu bạn không có chứng chỉ Apple Developer ID, tập lệnh sẽ tự động dùng **ký ad-hoc** (`-`).

Để xem các chế độ chạy phát triển, cờ ký và cách khắc phục sự cố Team ID, hãy xem README ứng dụng macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: Các ứng dụng được ký ad-hoc có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng sập ngay lập tức với "Abort trap 6", hãy xem phần [Khắc phục sự cố](#troubleshooting).

## 3. Cài đặt CLI

Ứng dụng macOS yêu cầu một bản cài đặt CLI `openclaw` toàn cục để quản lý các tác vụ nền.

**Để cài đặt (được khuyến nghị):**

1. Mở ứng dụng OpenClaw.
2. Đi tới tab cài đặt **Chung**.
3. Nhấp vào **"Cài đặt CLI"**.

Hoặc cài đặt thủ công:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` và `bun add -g openclaw@<version>` cũng hoạt động.
Đối với runtime Gateway, Node vẫn là hướng được khuyến nghị.

## Khắc phục sự cố

### Xây dựng thất bại: toolchain hoặc SDK không khớp

Bản dựng ứng dụng macOS yêu cầu SDK macOS mới nhất và toolchain Swift 6.2.

**Phần phụ thuộc hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có trong Cập nhật phần mềm** (được yêu cầu bởi SDK của Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu phiên bản không khớp, hãy cập nhật macOS/Xcode và chạy lại bản dựng.

### Ứng dụng sập khi cấp quyền

Nếu ứng dụng sập khi bạn cố cho phép quyền truy cập **Nhận dạng giọng nói** hoặc **Micrô**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không khớp.

**Cách khắc phục:**

1. Đặt lại quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó không thành công, hãy tạm thời thay đổi `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để buộc macOS bắt đầu từ "trạng thái sạch".

### Gateway "Đang khởi động..." vô thời hạn

Nếu trạng thái Gateway vẫn ở "Đang khởi động...", hãy kiểm tra xem có tiến trình zombie nào đang giữ cổng hay không:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một lần chạy thủ công đang giữ cổng, hãy dừng tiến trình đó (Ctrl+C). Phương án cuối cùng là kill PID bạn đã tìm thấy ở trên.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan cài đặt](/vi/install)
