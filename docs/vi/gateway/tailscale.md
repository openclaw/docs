---
read_when:
    - Công khai giao diện điều khiển Gateway ra ngoài localhost
    - Tự động hóa quyền truy cập bảng điều khiển qua tailnet hoặc mạng công cộng
summary: Tích hợp Tailscale Serve/Funnel cho bảng điều khiển Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T08:00:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw có thể tự động cấu hình Tailscale **Serve** (tailnet) hoặc **Funnel** (công khai) cho bảng điều khiển Gateway và cổng WebSocket. Cách này giúp gateway tiếp tục liên kết với local loopback, trong khi Tailscale cung cấp HTTPS, định tuyến và (đối với Serve) các tiêu đề danh tính.

## Chế độ

`gateway.tailscale.mode`:

| Chế độ          | Hoạt động                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------- |
| `serve`         | Serve chỉ dành cho tailnet qua `tailscale serve`. Gateway vẫn hoạt động trên `127.0.0.1`.      |
| `funnel`        | HTTPS công khai qua `tailscale funnel`. Yêu cầu mật khẩu dùng chung.                           |
| `off` (mặc định) | Không tự động hóa Tailscale.                                                                  |

Đầu ra trạng thái và kiểm tra sử dụng **mức phơi bày qua Tailscale** cho chế độ Serve/Funnel này của OpenClaw. `off` có nghĩa là OpenClaw không quản lý Serve hoặc Funnel; điều đó không có nghĩa là trình nền Tailscale cục bộ đã dừng hoặc đăng xuất.

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

Mở: `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` mà bạn đã cấu hình)

Để cung cấp Control UI qua một Tailscale Service được đặt tên thay vì tên máy chủ của thiết bị, hãy đặt `gateway.tailscale.serviceName` thành tên Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Khi đó, lúc khởi động, URL Service sẽ được báo cáo là `https://openclaw.<tailnet-name>.ts.net/` thay vì tên máy chủ của thiết bị. Tailscale Services yêu cầu máy chủ phải là một Node được gắn thẻ và phê duyệt trong tailnet của bạn — hãy cấu hình thẻ và phê duyệt Service trong Tailscale trước khi bật tính năng này, nếu không `tailscale serve --service=...` sẽ thất bại trong quá trình khởi động gateway.

### Chỉ tailnet (liên kết với IP Tailnet)

Dùng cách này để gateway lắng nghe trực tiếp trên IP Tailnet mà không có Serve/Funnel:

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
Khi có địa chỉ IPv4 Tailnet có thể liên kết, Gateway cũng yêu cầu `http://127.0.0.1:18789` cho các máy khách được xác thực trên cùng máy chủ. Nếu không có địa chỉ Tailnet khi khởi động, hệ thống chỉ chuyển về local loopback; hãy khởi động lại sau khi Tailscale khả dụng để thêm quyền truy cập trực tiếp qua Tailnet. Cả hai đường dẫn đều không làm tăng mức phơi bày ra mạng LAN hoặc công khai.
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

Nên dùng `OPENCLAW_GATEWAY_PASSWORD` thay vì lưu mật khẩu vào đĩa cùng mã nguồn.

## Ví dụ CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Xác thực

`gateway.auth.mode` kiểm soát quá trình bắt tay:

| Chế độ                                                 | Trường hợp sử dụng                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `none`                                                 | Chỉ tiếp nhận kết nối riêng tư                                                            |
| `token` (mặc định khi đặt `OPENCLAW_GATEWAY_TOKEN`)    | Mã thông báo dùng chung                                                                    |
| `password`                                             | Thông tin bí mật dùng chung qua `OPENCLAW_GATEWAY_PASSWORD` hoặc cấu hình                  |
| `trusted-proxy`                                        | Proxy ngược nhận biết danh tính; xem [Xác thực bằng proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) |

### Tiêu đề danh tính Tailscale (chỉ Serve)

Khi `tailscale.mode: "serve"` và `gateway.auth.allowTailscale` là `true`, quá trình xác thực Control UI/WebSocket có thể dùng các tiêu đề danh tính Tailscale (`tailscale-user-login`) thay cho mã thông báo/mật khẩu. Trước khi chấp nhận, OpenClaw xác minh tiêu đề bằng cách phân giải địa chỉ `x-forwarded-for` của yêu cầu qua trình nền Tailscale cục bộ (`tailscale whois`) và đối chiếu với thông tin đăng nhập trong tiêu đề. Một yêu cầu chỉ đủ điều kiện sử dụng đường dẫn này khi đến từ local loopback và mang các tiêu đề `x-forwarded-for`, `x-forwarded-proto` và `x-forwarded-host` của Tailscale.

Luồng không dùng mã thông báo này giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên cùng máy chủ, hãy đặt `gateway.auth.allowTailscale: false` và yêu cầu xác thực bằng mã thông báo/mật khẩu.

Phạm vi bỏ qua:

- Chỉ áp dụng cho bề mặt xác thực WebSocket của Control UI. Các điểm cuối API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`, v.v.) không bao giờ dùng xác thực bằng tiêu đề danh tính Tailscale; chúng luôn tuân theo chế độ xác thực HTTP thông thường của gateway.
- Đối với các phiên vận hành Control UI đã mang danh tính thiết bị trình duyệt, danh tính Tailscale đã xác minh sẽ bỏ qua vòng ghép nối bằng mã thông báo khởi tạo/mã QR.
- Điều này không bỏ qua chính danh tính thiết bị: các máy khách không có danh tính thiết bị vẫn bị từ chối và các kết nối theo vai trò Node vẫn phải trải qua quy trình ghép nối và kiểm tra xác thực thông thường.

## Lưu ý

- Tailscale Serve/Funnel yêu cầu CLI `tailscale` đã được cài đặt và đăng nhập.
- `tailscale.mode: "funnel"` từ chối khởi động nếu chế độ xác thực không phải là `password`, nhằm tránh phơi bày công khai.
- `gateway.tailscale.serviceName` chỉ áp dụng cho chế độ Serve và được truyền đến `tailscale serve --service=<name>`. Giá trị phải sử dụng định dạng `svc:<dns-label>` của Tailscale, ví dụ `svc:openclaw`. Tailscale yêu cầu máy chủ Service phải là Node được gắn thẻ và Service có thể cần được phê duyệt trong bảng điều khiển quản trị trước khi Serve có thể công bố Service.
- `gateway.tailscale.resetOnExit` hoàn tác cấu hình `tailscale serve`/`tailscale funnel` khi tắt.
- `gateway.tailscale.preserveFunnel: true` duy trì hoạt động của tuyến `tailscale funnel` được cấu hình bên ngoài qua các lần khởi động lại gateway. Với `mode: "serve"`, OpenClaw kiểm tra `tailscale funnel status` trước khi áp dụng lại Serve và bỏ qua thao tác đó khi một tuyến Funnel đã bao phủ cổng gateway. Chính sách chỉ dùng mật khẩu cho Funnel do OpenClaw quản lý vẫn không thay đổi.
- `gateway.bind: "tailnet"` sử dụng liên kết trực tiếp với Tailnet (không HTTPS, không Serve/Funnel), đồng thời yêu cầu địa chỉ cục bộ `127.0.0.1` khi có IPv4 Tailnet; nếu không, hệ thống chỉ chuyển về local loopback.
- `gateway.bind: "auto"` ưu tiên local loopback; dùng `tailnet` để giới hạn mức phơi bày mạng trong Tailnet trong khi vẫn giữ quyền truy cập local loopback trên cùng máy chủ.
- Serve/Funnel chỉ cung cấp **Control UI + WS của Gateway**. Các Node kết nối qua cùng điểm cuối WS của Gateway, vì vậy Serve cũng hỗ trợ quyền truy cập Node.

### Điều kiện tiên quyết và giới hạn của Tailscale

- Serve yêu cầu bật HTTPS cho tailnet của bạn; CLI sẽ nhắc nếu chưa bật.
- Serve chèn các tiêu đề danh tính Tailscale; Funnel thì không.
- Funnel yêu cầu Tailscale v1.38.3 trở lên, MagicDNS, HTTPS đã bật và thuộc tính Node Funnel.
- Funnel chỉ hỗ trợ các cổng `443`, `8443` và `10000` qua TLS.
- Funnel trên macOS yêu cầu biến thể ứng dụng Tailscale mã nguồn mở.

## Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)

Để chạy Gateway trên một máy nhưng điều khiển trình duyệt trên máy khác, hãy chạy một **máy chủ Node** trên máy có trình duyệt và giữ cả hai trong cùng một tailnet. Gateway chuyển tiếp các thao tác trình duyệt đến Node; không cần máy chủ điều khiển riêng hoặc URL Serve.

Tránh dùng Funnel để điều khiển trình duyệt; hãy xem việc ghép nối Node tương tự như quyền truy cập của người vận hành.

## Tìm hiểu thêm

- Tổng quan về Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Lệnh `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tổng quan về Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Lệnh `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Khám phá](/vi/gateway/discovery)
- [Xác thực](/vi/gateway/authentication)
