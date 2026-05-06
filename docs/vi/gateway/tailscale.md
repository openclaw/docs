---
read_when:
    - Cho phép truy cập UI điều khiển Gateway từ bên ngoài localhost
    - Tự động hóa quyền truy cập tailnet hoặc bảng điều khiển công khai
summary: Tích hợp Tailscale Serve/Funnel cho bảng điều khiển Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:55:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (công khai) cho bảng điều khiển Gateway và cổng WebSocket. Điều này giữ Gateway được ràng buộc với loopback trong khi Tailscale cung cấp HTTPS, định tuyến và (đối với Serve) các tiêu đề định danh.

## Chế độ

- `serve`: Serve chỉ dành cho tailnet qua `tailscale serve`. Gateway vẫn ở `127.0.0.1`.
- `funnel`: HTTPS công khai qua `tailscale funnel`. OpenClaw yêu cầu một mật khẩu dùng chung.
- `off`: Mặc định (không tự động hóa Tailscale).

Kết quả trạng thái và kiểm toán dùng **phơi bày Tailscale** cho chế độ Serve/Funnel này của OpenClaw. `off` có nghĩa là OpenClaw không quản lý Serve hoặc Funnel; điều đó không có nghĩa là daemon Tailscale cục bộ đã dừng hoặc đã đăng xuất.

## Xác thực

Đặt `gateway.auth.mode` để kiểm soát bước bắt tay:

- `none` (chỉ ingress riêng tư)
- `token` (mặc định khi `OPENCLAW_GATEWAY_TOKEN` được đặt)
- `password` (bí mật dùng chung qua `OPENCLAW_GATEWAY_PASSWORD` hoặc cấu hình)
- `trusted-proxy` (reverse proxy nhận biết danh tính; xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth))

Khi `tailscale.mode = "serve"` và `gateway.auth.allowTailscale` là `true`, xác thực Giao diện điều khiển/WebSocket có thể dùng các tiêu đề định danh Tailscale (`tailscale-user-login`) mà không cần cung cấp token/mật khẩu. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` qua daemon Tailscale cục bộ (`tailscale whois`) và khớp địa chỉ đó với tiêu đề trước khi chấp nhận. OpenClaw chỉ xem một yêu cầu là Serve khi yêu cầu đó đến từ loopback với các tiêu đề `x-forwarded-for`, `x-forwarded-proto` và `x-forwarded-host` của Tailscale.
Đối với các phiên vận hành Giao diện điều khiển có bao gồm danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị. Điều đó không bỏ qua danh tính thiết bị trình duyệt: các client không có thiết bị vẫn bị từ chối, và các kết nối WebSocket theo vai trò node hoặc không thuộc Giao diện điều khiển vẫn tuân theo các bước kiểm tra ghép cặp và xác thực thông thường.
Các endpoint HTTP API (ví dụ `/v1/*`, `/tools/invoke` và `/api/channels/*`) **không** dùng xác thực bằng tiêu đề định danh Tailscale. Chúng vẫn tuân theo chế độ xác thực HTTP thông thường của gateway: xác thực bằng bí mật dùng chung theo mặc định, hoặc một thiết lập trusted-proxy / private-ingress `none` được cấu hình có chủ đích.
Luồng không cần token này giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên cùng máy chủ, hãy tắt `gateway.auth.allowTailscale` và yêu cầu xác thực bằng token/mật khẩu thay thế.
Để yêu cầu thông tin xác thực bí mật dùng chung một cách rõ ràng, đặt `gateway.auth.allowTailscale: false` và dùng `gateway.auth.mode: "token"` hoặc `"password"`.

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

### Chỉ tailnet (ràng buộc với IP Tailnet)

Dùng cách này khi bạn muốn Gateway lắng nghe trực tiếp trên IP Tailnet (không Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Kết nối từ một thiết bị Tailnet khác:

- Giao diện điều khiển: `http://<tailscale-ip>:18789/`
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
- `gateway.bind: "tailnet"` là ràng buộc Tailnet trực tiếp (không HTTPS, không Serve/Funnel).
- `gateway.bind: "auto"` ưu tiên loopback; dùng `tailnet` nếu bạn chỉ muốn Tailnet.
- Serve/Funnel chỉ phơi bày **Giao diện điều khiển Gateway + WS**. Các node kết nối qua cùng endpoint Gateway WS, nên Serve có thể hoạt động cho truy cập node.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)

Nếu bạn chạy Gateway trên một máy nhưng muốn điều khiển trình duyệt trên máy khác, hãy chạy một **máy chủ node** trên máy trình duyệt và giữ cả hai trong cùng một tailnet.
Gateway sẽ proxy các hành động trình duyệt tới node; không cần máy chủ điều khiển riêng hoặc URL Serve riêng.

Tránh Funnel cho điều khiển trình duyệt; xử lý ghép cặp node giống như quyền truy cập của người vận hành.

## Điều kiện tiên quyết + giới hạn của Tailscale

- Serve yêu cầu HTTPS được bật cho tailnet của bạn; CLI sẽ nhắc nếu còn thiếu.
- Serve chèn các tiêu đề định danh Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3+, MagicDNS, HTTPS được bật và thuộc tính node funnel.
- Funnel chỉ hỗ trợ các cổng `443`, `8443` và `10000` qua TLS.
- Funnel trên macOS yêu cầu biến thể ứng dụng Tailscale mã nguồn mở.

## Tìm hiểu thêm

- Tổng quan Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Lệnh `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tổng quan Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Lệnh `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Khám phá](/vi/gateway/discovery)
- [Xác thực](/vi/gateway/authentication)
