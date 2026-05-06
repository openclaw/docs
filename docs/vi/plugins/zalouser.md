---
read_when:
    - Bạn muốn hỗ trợ Zalo Personal (không chính thức) trong OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin zalouser
summary: 'Plugin Zalo Personal: đăng nhập bằng QR + nhắn tin qua zca-js gốc (cài đặt Plugin + cấu hình kênh + công cụ)'
title: Plugin Zalo cá nhân
x-i18n:
    generated_at: "2026-05-06T17:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Hỗ trợ Zalo Personal cho OpenClaw thông qua Plugin, sử dụng `zca-js` gốc để tự động hóa một tài khoản người dùng Zalo thông thường.

<Warning>
Tự động hóa không chính thức có thể dẫn đến việc tài khoản bị đình chỉ hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Đặt tên

Id kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). Chúng tôi giữ `zalo` dành riêng cho một tích hợp API Zalo chính thức có thể có trong tương lai.

## Chạy ở đâu

Plugin này chạy **bên trong tiến trình Gateway**.

Nếu bạn dùng Gateway từ xa, hãy cài đặt/cấu hình trên **máy đang chạy Gateway**, sau đó khởi động lại Gateway.

Không cần binary CLI `zca`/`openzca` bên ngoài.

## Cài đặt

### Tùy chọn A: cài đặt từ npm

```bash
openclaw plugins install @openclaw/zalouser
```

Dùng gói nguyên bản để theo dõi thẻ bản phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Khởi động lại Gateway sau đó.

### Tùy chọn B: cài đặt từ thư mục cục bộ (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Khởi động lại Gateway sau đó.

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

## Công cụ Agent

Tên công cụ: `zalouser`

Hành động: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Các hành động tin nhắn kênh cũng hỗ trợ `react` cho phản ứng với tin nhắn.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin cộng đồng](/vi/plugins/community)
