---
read_when:
    - Thiết lập môi trường phát triển trên macOS
summary: Hướng dẫn thiết lập cho các nhà phát triển làm việc trên ứng dụng macOS OpenClaw
title: Thiết lập phát triển trên macOS
x-i18n:
    generated_at: "2026-05-07T13:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập nhà phát triển macOS

Biên dịch và chạy ứng dụng OpenClaw macOS từ mã nguồn.

## Điều kiện tiên quyết

Trước khi biên dịch ứng dụng, hãy đảm bảo bạn đã cài đặt những phần sau:

1. **Xcode 26.2+**: Bắt buộc cho phát triển Swift.
2. **Node.js 24 & pnpm**: Được khuyến nghị cho gateway, CLI và các script đóng gói. Node 22 LTS, hiện là `22.16+`, vẫn được hỗ trợ để bảo đảm khả năng tương thích.

## 1. Cài đặt phần phụ thuộc

Cài đặt các phần phụ thuộc dùng chung toàn dự án:

```bash
pnpm install
```

## 2. Biên dịch và đóng gói ứng dụng

Để biên dịch ứng dụng macOS và đóng gói vào `dist/OpenClaw.app`, hãy chạy:

```bash
./scripts/package-mac-app.sh
```

Nếu bạn không có chứng chỉ Apple Developer ID, script sẽ tự động dùng **ký ad-hoc** (`-`).

Để biết các chế độ chạy phát triển, cờ ký và cách khắc phục sự cố Team ID, xem README của ứng dụng macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: Các ứng dụng được ký ad-hoc có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng bị sập ngay lập tức với thông báo "Abort trap 6", hãy xem phần [Khắc phục sự cố](#troubleshooting).

## 3. Cài đặt CLI

Ứng dụng macOS cần một bản cài đặt CLI `openclaw` toàn cục để quản lý các tác vụ nền.

**Để cài đặt CLI (khuyến nghị):**

1. Mở ứng dụng OpenClaw.
2. Vào thẻ cài đặt **General**.
3. Nhấp vào **"Install CLI"**.

Hoặc cài đặt thủ công:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` và `bun add -g openclaw@<version>` cũng hoạt động.
Đối với runtime Gateway, Node vẫn là đường dẫn được khuyến nghị.

## Khắc phục sự cố

### Biên dịch thất bại: không khớp toolchain hoặc SDK

Bản biên dịch ứng dụng macOS yêu cầu macOS SDK mới nhất và toolchain Swift 6.2.

**Phần phụ thuộc hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có trong Software Update** (bắt buộc bởi SDK của Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu các phiên bản không khớp, hãy cập nhật macOS/Xcode rồi chạy lại bản biên dịch.

### Ứng dụng bị sập khi cấp quyền

Nếu ứng dụng bị sập khi bạn cố cho phép truy cập **Speech Recognition** hoặc **Microphone**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không khớp.

**Cách khắc phục:**

1. Đặt lại quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó thất bại, hãy tạm thời thay đổi `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để buộc macOS dùng một "trạng thái sạch".

### Gateway "Starting..." vô thời hạn

Nếu trạng thái gateway vẫn ở "Starting...", hãy kiểm tra xem có tiến trình zombie nào đang giữ cổng hay không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu bạn không dùng LaunchAgent (chế độ phát triển / chạy thủ công), tìm listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một lần chạy thủ công đang giữ cổng, hãy dừng tiến trình đó (Ctrl+C). Biện pháp cuối cùng là kill PID bạn đã tìm thấy ở trên.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan cài đặt](/vi/install)
