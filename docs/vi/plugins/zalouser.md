---
read_when:
    - Bạn muốn hỗ trợ Zalo Personal (không chính thức) trong OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin zalouser
summary: 'Plugin Zalo Personal: đăng nhập bằng QR + nhắn tin qua zca-js gốc (cài đặt Plugin + cấu hình kênh + công cụ)'
title: Plugin cá nhân Zalo
x-i18n:
    generated_at: "2026-05-10T19:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Hỗ trợ Zalo Personal cho OpenClaw thông qua một Plugin, sử dụng `zca-js` gốc để tự động hóa một tài khoản người dùng Zalo thông thường.

<Warning>
Tự động hóa không chính thức có thể dẫn đến việc tài khoản bị đình chỉ hoặc cấm. Hãy tự chịu rủi ro khi sử dụng.
</Warning>

## Cách đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). Chúng tôi giữ `zalo` cho khả năng tích hợp API Zalo chính thức trong tương lai.

## Nơi chạy

Plugin này chạy **bên trong tiến trình Gateway**.

Nếu bạn dùng Gateway từ xa, hãy cài đặt/cấu hình trên **máy đang chạy Gateway**, rồi khởi động lại Gateway.

Không cần tệp nhị phân CLI `zca`/`openzca` bên ngoài.

## Cài đặt

### Tùy chọn A: cài đặt từ npm

```bash
openclaw plugins install @openclaw/zalouser
```

Dùng gói trần để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Sau đó khởi động lại Gateway.

### Tùy chọn B: cài đặt từ thư mục cục bộ (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Sau đó khởi động lại Gateway.

## Cấu hình

Cấu hình kênh nằm dưới `channels.zalouser` (không phải `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Công cụ agent

Tên công cụ: `zalouser`

Hành động: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Các hành động tin nhắn kênh cũng hỗ trợ `react` cho phản ứng với tin nhắn.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [ClawHub](/vi/clawhub)
