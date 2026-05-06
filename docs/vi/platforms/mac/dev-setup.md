---
read_when:
    - Thiết lập môi trường phát triển trên macOS
summary: Hướng dẫn thiết lập cho nhà phát triển làm việc trên ứng dụng OpenClaw macOS
title: Thiết lập môi trường phát triển macOS
x-i18n:
    generated_at: "2026-05-06T09:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập môi trường phát triển macOS

Biên dịch và chạy ứng dụng OpenClaw macOS từ mã nguồn.

## Điều kiện tiên quyết

Trước khi biên dịch ứng dụng, hãy đảm bảo bạn đã cài đặt các thành phần sau:

1. **Xcode 26.2+**: Bắt buộc cho phát triển Swift.
2. **Node.js 24 & pnpm**: Được khuyến nghị cho gateway, CLI và các script đóng gói. Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ để tương thích.

## 1. Cài đặt phụ thuộc

Cài đặt các phụ thuộc dùng cho toàn dự án:

```bash
pnpm install
```

## 2. Biên dịch và đóng gói ứng dụng

Để biên dịch ứng dụng macOS và đóng gói thành `dist/OpenClaw.app`, hãy chạy:

```bash
./scripts/package-mac-app.sh
```

Nếu bạn không có chứng chỉ Apple Developer ID, script sẽ tự động dùng **ký ad-hoc** (`-`).

Để xem các chế độ chạy khi phát triển, cờ ký và cách khắc phục sự cố Team ID, hãy xem README của ứng dụng macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: Các ứng dụng được ký ad-hoc có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng bị sập ngay lập tức với "Abort trap 6", hãy xem phần [Khắc phục sự cố](#troubleshooting).

## 3. Cài đặt CLI

Ứng dụng macOS yêu cầu cài đặt CLI `openclaw` toàn cục để quản lý các tác vụ nền.

**Để cài đặt CLI (khuyến nghị):**

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

### Biên dịch thất bại: toolchain hoặc SDK không khớp

Bản biên dịch ứng dụng macOS yêu cầu macOS SDK mới nhất và toolchain Swift 6.2.

**Phụ thuộc hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có trong Cập nhật phần mềm** (bắt buộc bởi các SDK của Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu các phiên bản không khớp, hãy cập nhật macOS/Xcode và chạy lại bản biên dịch.

### Ứng dụng bị sập khi cấp quyền

Nếu ứng dụng bị sập khi bạn cố cho phép quyền truy cập **Nhận dạng giọng nói** hoặc **Micrô**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không khớp.

**Cách khắc phục:**

1. Đặt lại quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó thất bại, hãy tạm thời thay đổi `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để buộc macOS bắt đầu với một trạng thái sạch.

### Gateway "Đang khởi động..." vô thời hạn

Nếu trạng thái gateway vẫn ở "Đang khởi động...", hãy kiểm tra xem một tiến trình zombie có đang giữ cổng hay không:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một lần chạy thủ công đang giữ cổng, hãy dừng tiến trình đó (Ctrl+C). Biện pháp cuối cùng là kill PID bạn đã tìm thấy ở trên.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan cài đặt](/vi/install)
