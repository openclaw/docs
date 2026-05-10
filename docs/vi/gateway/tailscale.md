---
read_when:
    - Công khai giao diện điều khiển Gateway ra ngoài localhost
    - Tự động hóa quyền truy cập tailnet hoặc bảng điều khiển công khai
summary: Tích hợp Tailscale Serve/Funnel cho bảng điều khiển Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:36:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (công khai) cho bảng điều khiển Gateway và cổng WebSocket. Việc này giữ Gateway được ràng buộc với loopback trong khi Tailscale cung cấp HTTPS, định tuyến và (đối với Serve) các tiêu đề danh tính.

## Chế độ

- `serve`: Serve chỉ dành cho tailnet qua `tailscale serve`. Gateway vẫn ở `127.0.0.1`.
- `funnel`: HTTPS công khai qua `tailscale funnel`. OpenClaw yêu cầu mật khẩu dùng chung.
- `off`: Mặc định (không tự động hóa Tailscale).

Đầu ra trạng thái và kiểm toán sử dụng **phơi bày Tailscale** cho chế độ Serve/Funnel này của OpenClaw. `off` nghĩa là OpenClaw không quản lý Serve hoặc Funnel; điều đó không có nghĩa là daemon Tailscale cục bộ đã dừng hoặc đã đăng xuất.

## Xác thực

Đặt `gateway.auth.mode` để kiểm soát quá trình bắt tay:

- `none` (chỉ ingress riêng tư)
- `token` (mặc định khi `OPENCLAW_GATEWAY_TOKEN` được đặt)
- `password` (bí mật dùng chung qua `OPENCLAW_GATEWAY_PASSWORD` hoặc cấu hình)
- `trusted-proxy` (reverse proxy nhận biết danh tính; xem [Xác thực Proxy Tin cậy](/vi/gateway/trusted-proxy-auth))

Khi `tailscale.mode = "serve"` và `gateway.auth.allowTailscale` là `true`,
xác thực Control UI/WebSocket có thể sử dụng các tiêu đề danh tính Tailscale
(`tailscale-user-login`) mà không cần cung cấp token/mật khẩu. OpenClaw xác minh
danh tính bằng cách phân giải địa chỉ `x-forwarded-for` qua daemon Tailscale cục bộ
(`tailscale whois`) và khớp địa chỉ đó với tiêu đề trước khi chấp nhận.
OpenClaw chỉ xem một yêu cầu là Serve khi yêu cầu đó đến từ loopback với các tiêu đề
`x-forwarded-for`, `x-forwarded-proto` và `x-forwarded-host` của Tailscale.
Đối với phiên toán tử Control UI có bao gồm danh tính thiết bị trình duyệt, đường dẫn
Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị. Nó không bỏ qua danh tính
thiết bị trình duyệt: các máy khách không có thiết bị vẫn bị từ chối, và các kết nối
WebSocket vai trò node hoặc không phải Control UI vẫn tuân theo các kiểm tra ghép cặp
và xác thực thông thường.
Các endpoint HTTP API (ví dụ `/v1/*`, `/tools/invoke` và `/api/channels/*`)
**không** sử dụng xác thực bằng tiêu đề danh tính Tailscale. Chúng vẫn tuân theo
chế độ xác thực HTTP thông thường của gateway: xác thực bằng bí mật dùng chung theo
mặc định, hoặc một thiết lập trusted-proxy / ingress riêng tư `none` được cấu hình
có chủ đích.
Luồng không dùng token này giả định rằng máy chủ gateway là đáng tin cậy. Nếu mã cục bộ
không đáng tin có thể chạy trên cùng máy chủ, hãy tắt `gateway.auth.allowTailscale` và
yêu cầu xác thực bằng token/mật khẩu thay thế.
Để yêu cầu thông tin xác thực bí mật dùng chung rõ ràng, đặt `gateway.auth.allowTailscale: false`
và dùng `gateway.auth.mode: "token"` hoặc `"password"`.

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

Mở: `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

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

Ưu tiên `OPENCLAW_GATEWAY_PASSWORD` thay vì commit mật khẩu vào đĩa.

## Ví dụ CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Ghi chú

- Tailscale Serve/Funnel yêu cầu CLI `tailscale` đã được cài đặt và đã đăng nhập.
- `tailscale.mode: "funnel"` từ chối khởi động trừ khi chế độ xác thực là `password` để tránh phơi bày công khai.
- Đặt `gateway.tailscale.resetOnExit` nếu bạn muốn OpenClaw hoàn tác cấu hình `tailscale serve`
  hoặc `tailscale funnel` khi tắt.
- Đặt `gateway.tailscale.preserveFunnel: true` để giữ một tuyến `tailscale funnel`
  được cấu hình bên ngoài tiếp tục hoạt động qua các lần khởi động lại gateway. Khi bật và
  gateway chạy ở `mode: "serve"`, OpenClaw kiểm tra `tailscale funnel status`
  trước khi áp dụng lại Serve và bỏ qua bước đó khi một tuyến Funnel đã bao phủ
  cổng gateway. Chính sách chỉ dùng mật khẩu cho Funnel do OpenClaw quản lý không đổi.
- `gateway.bind: "tailnet"` là ràng buộc trực tiếp với Tailnet (không HTTPS, không Serve/Funnel).
- `gateway.bind: "auto"` ưu tiên loopback; dùng `tailnet` nếu bạn muốn chỉ Tailnet.
- Serve/Funnel chỉ phơi bày **Control UI + WS của Gateway**. Các node kết nối qua
  cùng endpoint Gateway WS, vì vậy Serve có thể hoạt động cho truy cập node.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)

Nếu bạn chạy Gateway trên một máy nhưng muốn điều khiển trình duyệt trên một máy khác,
hãy chạy một **máy chủ node** trên máy có trình duyệt và giữ cả hai trong cùng một tailnet.
Gateway sẽ proxy các thao tác trình duyệt đến node; không cần máy chủ điều khiển riêng hoặc URL Serve riêng.

Tránh Funnel cho điều khiển trình duyệt; xử lý ghép cặp node như quyền truy cập toán tử.

## Điều kiện tiên quyết + giới hạn của Tailscale

- Serve yêu cầu HTTPS đã được bật cho tailnet của bạn; CLI sẽ nhắc nếu thiếu.
- Serve chèn các tiêu đề danh tính Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3+, MagicDNS, HTTPS đã bật và một thuộc tính node funnel.
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
