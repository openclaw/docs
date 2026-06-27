---
read_when:
    - Bạn muốn truy cập Gateway qua Tailscale
    - Bạn muốn Giao diện điều khiển trên trình duyệt và chỉnh sửa cấu hình
summary: 'Bề mặt web của Gateway: Control UI, chế độ bind và bảo mật'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:20:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway phục vụ một **Giao diện điều khiển trên trình duyệt** nhỏ (Vite + Lit) từ cùng cổng với Gateway WebSocket:

- mặc định: `http://<host>:18789/`
- với `gateway.tls.enabled: true`: `https://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Các khả năng nằm trong [Giao diện điều khiển](/vi/web/control-ui). Phần còn lại của trang này tập trung vào các chế độ bind, bảo mật và các bề mặt hướng web.

## Webhook

Khi `hooks.enabled=true`, Gateway cũng để lộ một endpoint webhook nhỏ trên cùng máy chủ HTTP.
Xem [Cấu hình Gateway](/vi/gateway/configuration) → `hooks` để biết xác thực + payload.

## Admin HTTP RPC

Admin HTTP RPC để lộ các phương thức control-plane Gateway được chọn tại `POST /api/v1/admin/rpc`.
Tính năng này tắt theo mặc định và chỉ được đăng ký khi plugin `admin-http-rpc` được bật.
Xem [Admin HTTP RPC](/vi/plugins/admin-http-rpc) để biết mô hình xác thực, các phương thức được phép và so sánh với WebSocket.

## Cấu hình (bật mặc định)

Giao diện điều khiển được **bật theo mặc định** khi có tài nguyên (`dist/control-ui`).
Bạn có thể điều khiển nó qua cấu hình:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Truy cập Tailscale

### Serve tích hợp (khuyến nghị)

Giữ Gateway trên loopback và để Tailscale Serve proxy nó:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Sau đó khởi động gateway:

```bash
openclaw gateway
```

Mở:

- `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

### Bind Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Sau đó khởi động gateway (ví dụ không dùng loopback này sử dụng xác thực token
shared-secret):

```bash
openclaw gateway
```

Mở:

- `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

### Internet công khai (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Ghi chú bảo mật

- Xác thực Gateway là bắt buộc theo mặc định (token, mật khẩu, trusted-proxy, hoặc header danh tính Tailscale Serve khi được bật).
- Các bind không phải loopback vẫn **yêu cầu** xác thực gateway. Trên thực tế, điều đó có nghĩa là xác thực token/mật khẩu hoặc một reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Trình hướng dẫn tạo xác thực shared-secret theo mặc định và thường tạo một
  gateway token (ngay cả trên loopback).
- Ở chế độ shared-secret, UI gửi `connect.params.auth.token` hoặc
  `connect.params.auth.password`.
- Khi `gateway.tls.enabled: true`, dashboard cục bộ và các helper trạng thái hiển thị
  URL dashboard `https://` và URL WebSocket `wss://`.
- Trong các chế độ mang danh tính như Tailscale Serve hoặc `trusted-proxy`, kiểm tra xác thực
  WebSocket thay vào đó được thỏa mãn từ header yêu cầu.
- Với các triển khai Giao diện điều khiển công khai không dùng loopback, hãy đặt `gateway.controlUi.allowedOrigins`
  một cách rõ ràng (origin đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng origin được chấp nhận cho loopback,
  RFC1918/link-local, `.local`, `.ts.net`, và host Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật
  chế độ fallback origin theo Host-header, nhưng đây là một hạ cấp bảo mật nguy hiểm.
- Với Serve, header danh tính Tailscale có thể thỏa mãn xác thực Giao diện điều khiển/WebSocket
  khi `gateway.auth.allowTailscale` là `true` (không cần token/mật khẩu).
  Các endpoint HTTP API không dùng các header danh tính Tailscale đó; thay vào đó chúng tuân theo
  chế độ xác thực HTTP bình thường của gateway. Đặt
  `gateway.auth.allowTailscale: false` để yêu cầu thông tin xác thực rõ ràng. Xem
  [Tailscale](/vi/gateway/tailscale) và [Bảo mật](/vi/gateway/security). Luồng không token này giả định host gateway là đáng tin cậy.
- `gateway.tailscale.mode: "funnel"` yêu cầu `gateway.auth.mode: "password"` (mật khẩu dùng chung).

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```
