---
read_when:
    - Bạn muốn hỗ trợ Zalo Personal (không chính thức) trong OpenClaw
    - Bạn đang cấu hình hoặc phát triển Plugin zalouser
summary: 'Plugin Zalo Personal: đăng nhập bằng QR + nhắn tin qua zca-js gốc (cài đặt Plugin + cấu hình kênh + công cụ)'
title: Plugin Zalo cá nhân
x-i18n:
    generated_at: "2026-04-29T23:04:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo cá nhân (Plugin)

Hỗ trợ Zalo cá nhân cho OpenClaw thông qua một Plugin, sử dụng `zca-js` gốc để tự động hóa một tài khoản người dùng Zalo thông thường.

<Warning>
Tự động hóa không chính thức có thể dẫn đến việc tài khoản bị đình chỉ hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). Chúng tôi giữ `zalo` cho khả năng tích hợp API Zalo chính thức trong tương lai.

## Nơi chạy

Plugin này chạy **bên trong tiến trình Gateway**.

Nếu bạn sử dụng Gateway từ xa, hãy cài đặt/cấu hình Plugin trên **máy đang chạy Gateway**, sau đó khởi động lại Gateway.

Không cần binary CLI `zca`/`openzca` bên ngoài.

## Cài đặt

### Tùy chọn A: cài đặt từ npm

```bash
openclaw plugins install @openclaw/zalouser
```

Nếu npm báo gói do OpenClaw sở hữu là đã ngừng dùng, phiên bản gói đó là từ
một luồng gói bên ngoài cũ hơn; hãy dùng bản dựng OpenClaw đã đóng gói hiện tại hoặc
đường dẫn thư mục cục bộ cho đến khi một gói npm mới hơn được phát hành.

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

Các hành động tin nhắn kênh cũng hỗ trợ `react` cho phản ứng tin nhắn.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Plugin cộng đồng](/vi/plugins/community)
