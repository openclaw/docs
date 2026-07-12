---
read_when:
    - Bạn muốn OpenClaw hỗ trợ Zalo Cá nhân (không chính thức)
    - Bạn đang cấu hình hoặc phát triển plugin zalouser
summary: 'Plugin Zalo Personal: đăng nhập bằng mã QR + nhắn tin qua zca-js gốc (cài đặt plugin + cấu hình kênh + công cụ)'
title: Plugin Zalo cá nhân
x-i18n:
    generated_at: "2026-07-12T08:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Hỗ trợ Zalo Cá nhân cho OpenClaw thông qua một Plugin sử dụng `zca-js` nguyên bản để
tự động hóa tài khoản người dùng Zalo thông thường. Không yêu cầu tệp nhị phân CLI
`zca`/`openzca` bên ngoài.

<Warning>
Việc tự động hóa không chính thức có thể khiến tài khoản bị đình chỉ hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Cách đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản
người dùng Zalo cá nhân** (không chính thức). ID kênh `zalo` riêng biệt là tích hợp
Zalo Bot/Webhook chính thức được đóng gói sẵn — xem [Zalo](/vi/channels/zalo).

## Nơi chạy

Plugin này chạy **bên trong tiến trình Gateway**. Đối với Gateway từ xa,
hãy cài đặt/cấu hình Plugin trên máy chủ đó, sau đó khởi động lại Gateway.

## Cài đặt

### Từ npm

```bash
openclaw plugins install @openclaw/zalouser
```

Sử dụng tên gói trần để theo thẻ phát hành chính thức hiện tại; chỉ ghim một
phiên bản chính xác khi bạn cần quá trình cài đặt có thể tái lập. Sau đó, hãy
khởi động lại Gateway.

### Từ thư mục cục bộ (phát triển)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Sau đó, hãy khởi động lại Gateway.

## Cấu hình

Cấu hình kênh nằm trong `channels.zalouser` (không phải `plugins.entries.*`):

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

Xem [Cấu hình kênh Zalo cá nhân](/vi/channels/zalouser) để biết về kiểm soát truy cập
tin nhắn trực tiếp/nhóm, thiết lập nhiều tài khoản, biến môi trường và khắc phục sự cố.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Công cụ tác tử

Tên công cụ: `zalouser`

Hành động: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Các hành động tin nhắn của kênh (không phải công cụ tác tử) cũng hỗ trợ `react`
để bày tỏ cảm xúc với tin nhắn.

## Liên quan

- [Cấu hình kênh Zalo cá nhân](/vi/channels/zalouser)
- [Zalo (kênh Bot/Webhook chính thức)](/vi/channels/zalo)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [ClawHub](/clawhub)
