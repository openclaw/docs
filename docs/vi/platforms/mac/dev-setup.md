---
read_when:
    - Thiết lập môi trường phát triển macOS
summary: Hướng dẫn thiết lập cho nhà phát triển làm việc trên ứng dụng OpenClaw macOS
title: Thiết lập môi trường phát triển macOS
x-i18n:
    generated_at: "2026-07-04T06:39:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Thiết lập nhà phát triển macOS

Xây dựng và chạy ứng dụng OpenClaw macOS từ mã nguồn.

## Điều kiện tiên quyết

Trước khi xây dựng ứng dụng, hãy bảo đảm bạn đã cài đặt các mục sau:

1. **Xcode 26.2+**: Bắt buộc cho phát triển Swift.
2. **Node.js 24 & pnpm**: Khuyến nghị cho Gateway, CLI và các script đóng gói. Node 22 LTS, hiện là `22.19+`, vẫn được hỗ trợ để tương thích.

## 1. Cài đặt phần phụ thuộc

Cài đặt các phần phụ thuộc trên toàn dự án:

```bash
pnpm install
```

## 2. Xây dựng và đóng gói ứng dụng

Để xây dựng ứng dụng macOS và đóng gói vào `dist/OpenClaw.app`, hãy chạy:

```bash
./scripts/package-mac-app.sh
```

Nếu bạn không có chứng chỉ Apple Developer ID, script sẽ tự động dùng **ký ad-hoc** (`-`).

Để biết các chế độ chạy phát triển, cờ ký và cách khắc phục sự cố Team ID, hãy xem README của ứng dụng macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Lưu ý**: Ứng dụng được ký ad-hoc có thể kích hoạt lời nhắc bảo mật. Nếu ứng dụng sập ngay lập tức với "Abort trap 6", hãy xem phần [Khắc phục sự cố](#troubleshooting).

## 3. Cài đặt CLI và Gateway

Ứng dụng đã đóng gói nhúng trình cài đặt chuẩn `scripts/install-cli.sh`. Trên một hồ sơ mới, chọn **Máy Mac này** trong quá trình onboarding; ứng dụng sẽ cài đặt CLI và runtime tương ứng trong không gian người dùng trước khi khởi động trình hướng dẫn Gateway.

Để khôi phục phát triển thủ công, hãy tự cài đặt CLI tương ứng:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` và `bun add -g openclaw@<version>` cũng hoạt động.
Đối với runtime Gateway, Node vẫn là cách được khuyến nghị.

## Khắc phục sự cố

### Xây dựng thất bại: toolchain hoặc SDK không khớp

Quá trình xây dựng ứng dụng macOS yêu cầu SDK macOS mới nhất và toolchain Swift 6.2.

**Phần phụ thuộc hệ thống (bắt buộc):**

- **Phiên bản macOS mới nhất có trong Software Update** (được các SDK Xcode 26.2 yêu cầu)
- **Xcode 26.2** (toolchain Swift 6.2)

**Kiểm tra:**

```bash
xcodebuild -version
xcrun swift --version
```

Nếu phiên bản không khớp, hãy cập nhật macOS/Xcode và chạy lại quá trình xây dựng.

### Ứng dụng sập khi cấp quyền

Nếu ứng dụng sập khi bạn cố cho phép quyền truy cập **Speech Recognition** hoặc **Microphone**, nguyên nhân có thể là bộ nhớ đệm TCC bị hỏng hoặc chữ ký không khớp.

**Cách khắc phục:**

1. Đặt lại quyền TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Nếu cách đó thất bại, hãy tạm thời thay đổi `BUNDLE_ID` trong [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) để buộc macOS bắt đầu với một "trạng thái sạch".

### Gateway "Đang khởi động..." vô thời hạn

Nếu trạng thái gateway vẫn ở "Đang khởi động...", hãy kiểm tra xem có tiến trình zombie nào đang giữ cổng không:

```bash
openclaw gateway status
openclaw gateway stop

# Nếu bạn không dùng LaunchAgent (chế độ phát triển / chạy thủ công), hãy tìm listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Nếu một lần chạy thủ công đang giữ cổng, hãy dừng tiến trình đó (Ctrl+C). Phương án cuối cùng là kill PID bạn đã tìm thấy ở trên.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [Tổng quan cài đặt](/vi/install)
