---
read_when:
    - Công khai giao diện điều khiển Gateway bên ngoài localhost
    - Tự động hóa quyền truy cập tailnet hoặc bảng điều khiển công khai
summary: Tích hợp Tailscale Serve/Funnel cho bảng điều khiển Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-29T22:46:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (công khai) cho bảng điều khiển Gateway và cổng WebSocket. Điều này giữ Gateway được bind vào loopback trong khi Tailscale cung cấp HTTPS, định tuyến và (đối với Serve) các header nhận dạng.

## Chế độ

- `serve`: Serve chỉ dành cho tailnet qua `tailscale serve`. Gateway vẫn ở `127.0.0.1`.
- `funnel`: HTTPS công khai qua `tailscale funnel`. OpenClaw yêu cầu một mật khẩu dùng chung.
- `off`: Mặc định (không có tự động hóa Tailscale).

Đầu ra trạng thái và kiểm toán dùng **phơi bày Tailscale** cho chế độ Serve/Funnel này của OpenClaw. `off` nghĩa là OpenClaw không quản lý Serve hoặc Funnel; nó không có nghĩa là daemon Tailscale cục bộ đã dừng hoặc đã đăng xuất.

## Xác thực

Đặt `gateway.auth.mode` để kiểm soát handshake:

- `none` (chỉ ingress riêng tư)
- `token` (mặc định khi `OPENCLAW_GATEWAY_TOKEN` được đặt)
- `password` (bí mật dùng chung qua `OPENCLAW_GATEWAY_PASSWORD` hoặc cấu hình)
- `trusted-proxy` (reverse proxy nhận biết danh tính; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth))

Khi `tailscale.mode = "serve"` và `gateway.auth.allowTailscale` là `true`, xác thực Control UI/WebSocket có thể dùng các header nhận dạng Tailscale (`tailscale-user-login`) mà không cần cung cấp token/mật khẩu. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` qua daemon Tailscale cục bộ (`tailscale whois`) và khớp nó với header trước khi chấp nhận. OpenClaw chỉ coi một yêu cầu là Serve khi yêu cầu đó đến từ loopback với các header `x-forwarded-for`, `x-forwarded-proto` và `x-forwarded-host` của Tailscale.
Đối với các phiên operator Control UI có bao gồm danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị. Nó không bỏ qua danh tính thiết bị trình duyệt: các client không có thiết bị vẫn bị từ chối, và các kết nối WebSocket vai trò node hoặc không phải Control UI vẫn đi theo quy trình ghép cặp và kiểm tra xác thực thông thường.
Các endpoint HTTP API (ví dụ `/v1/*`, `/tools/invoke` và `/api/channels/*`) **không** dùng xác thực bằng header nhận dạng Tailscale. Chúng vẫn đi theo chế độ xác thực HTTP thông thường của gateway: xác thực bằng bí mật dùng chung theo mặc định, hoặc một thiết lập trusted-proxy / private-ingress `none` được cấu hình có chủ ý.
Luồng không token này giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên cùng máy chủ, hãy tắt `gateway.auth.allowTailscale` và yêu cầu xác thực bằng token/mật khẩu thay thế.
Để yêu cầu thông tin xác thực bí mật dùng chung rõ ràng, đặt `gateway.auth.allowTailscale: false` và dùng `gateway.auth.mode: "token"` hoặc `"password"`.

## Ví dụ cấu hình

### Chỉ tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Mở: `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

### Chỉ tailnet (bind vào IP Tailnet)

Dùng tùy chọn này khi bạn muốn Gateway lắng nghe trực tiếp trên IP Tailnet (không Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Kết nối từ một thiết bị Tailnet khác:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) sẽ **không** hoạt động trong chế độ này.
</Note>

### Internet công khai (Funnel + mật khẩu dùng chung)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Ưu tiên `OPENCLAW_GATEWAY_PASSWORD` thay vì commit mật khẩu vào ổ đĩa.

## Ví dụ CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Ghi chú

- Tailscale Serve/Funnel yêu cầu CLI `tailscale` đã được cài đặt và đăng nhập.
- `tailscale.mode: "funnel"` từ chối khởi động trừ khi chế độ xác thực là `password` để tránh phơi bày công khai.
- Đặt `gateway.tailscale.resetOnExit` nếu bạn muốn OpenClaw hoàn tác cấu hình `tailscale serve` hoặc `tailscale funnel` khi tắt.
- `gateway.bind: "tailnet"` là bind Tailnet trực tiếp (không HTTPS, không Serve/Funnel).
- `gateway.bind: "auto"` ưu tiên loopback; dùng `tailnet` nếu bạn chỉ muốn Tailnet.
- Serve/Funnel chỉ phơi bày **Control UI + WS của Gateway**. Các node kết nối qua cùng endpoint WS của Gateway, nên Serve có thể hoạt động cho quyền truy cập node.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)

Nếu bạn chạy Gateway trên một máy nhưng muốn điều khiển trình duyệt trên máy khác, hãy chạy một **máy chủ node** trên máy có trình duyệt và giữ cả hai trên cùng một tailnet.
Gateway sẽ proxy các thao tác trình duyệt tới node; không cần máy chủ điều khiển riêng hoặc URL Serve riêng.

Tránh Funnel cho điều khiển trình duyệt; xử lý ghép cặp node giống như quyền truy cập operator.

## Điều kiện tiên quyết + giới hạn của Tailscale

- Serve yêu cầu HTTPS đã bật cho tailnet của bạn; CLI sẽ nhắc nếu thiếu.
- Serve chèn các header nhận dạng Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3+, MagicDNS, HTTPS đã bật và thuộc tính node funnel.
- Funnel chỉ hỗ trợ các cổng `443`, `8443` và `10000` qua TLS.
- Funnel trên macOS yêu cầu biến thể ứng dụng Tailscale nguồn mở.

## Tìm hiểu thêm

- Tổng quan về Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Lệnh `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tổng quan về Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Lệnh `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Khám phá](/vi/gateway/discovery)
- [Xác thực](/vi/gateway/authentication)
