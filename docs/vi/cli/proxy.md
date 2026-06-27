---
read_when:
    - Bạn cần xác thực định tuyến proxy do người vận hành quản lý trước khi triển khai
    - Bạn cần thu thập lưu lượng truyền tải OpenClaw cục bộ để gỡ lỗi
    - Bạn muốn kiểm tra các phiên proxy gỡ lỗi, blob hoặc các mẫu truy vấn đặt sẵn tích hợp
summary: Tham chiếu CLI cho `openclaw proxy`, bao gồm xác thực proxy do người vận hành quản lý và trình kiểm tra bản ghi proxy gỡ lỗi cục bộ
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Xác thực định tuyến proxy do người vận hành quản lý, hoặc chạy proxy gỡ lỗi tường minh cục bộ
và kiểm tra lưu lượng đã ghi lại.

Dùng `validate` để kiểm tra trước proxy chuyển tiếp do người vận hành quản lý trước khi bật
định tuyến proxy của OpenClaw. Các lệnh còn lại là công cụ gỡ lỗi để
điều tra ở tầng truyền tải: chúng có thể khởi động proxy cục bộ, chạy lệnh con
với chế độ ghi lại được bật, liệt kê các phiên ghi lại, truy vấn các mẫu lưu lượng phổ biến, đọc
các blob đã ghi lại, và xóa dữ liệu ghi lại cục bộ.

## Lệnh

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Xác thực

`openclaw proxy validate` kiểm tra URL proxy do người vận hành quản lý đang có hiệu lực từ
`--proxy-url`, cấu hình, hoặc `OPENCLAW_PROXY_URL`. URL proxy được quản lý có thể dùng
`http://` cho trình nghe proxy chuyển tiếp thuần hoặc `https://` khi OpenClaw phải
mở TLS tới endpoint proxy trước khi gửi yêu cầu proxy. Lệnh này báo cáo
sự cố cấu hình khi chưa bật và cấu hình proxy; dùng `--proxy-url` để
kiểm tra trước một lần trước khi thay đổi cấu hình. Thêm `--proxy-ca-file` để tin cậy một
CA riêng cho kết nối TLS tới endpoint proxy HTTPS. Theo mặc định, lệnh này
xác minh rằng một đích công khai thành công qua proxy và proxy
không thể truy cập một canary loopback tạm thời. Các đích bị từ chối tùy chỉnh sẽ
fail-closed: phản hồi HTTP và lỗi truyền tải mơ hồ đều thất bại trừ khi
bạn có thể xác minh riêng một tín hiệu từ chối riêng cho triển khai. Thêm
`--apns-reachable` để cũng mở một đường hầm APNs HTTP/2 CONNECT qua proxy
và xác nhận APNs sandbox phản hồi; phép thăm dò dùng một provider token cố ý không hợp lệ,
vì vậy phản hồi APNs `403 InvalidProviderToken` là tín hiệu khả năng truy cập thành công.

Tùy chọn:

- `--json`: in JSON có thể đọc bằng máy.
- `--proxy-url <url>`: xác thực URL proxy `http://` hoặc `https://` này thay vì cấu hình hoặc env.
- `--proxy-ca-file <path>`: tin cậy tệp CA PEM này để xác minh TLS của endpoint proxy HTTPS.
- `--allowed-url <url>`: thêm một đích được kỳ vọng sẽ thành công qua proxy. Lặp lại để kiểm tra nhiều đích.
- `--denied-url <url>`: thêm một đích được kỳ vọng sẽ bị proxy chặn. Lặp lại để kiểm tra nhiều đích.
- `--apns-reachable`: cũng xác minh APNs HTTP/2 sandbox có thể truy cập qua proxy.
- `--apns-authority <url>`: authority APNs để thăm dò với `--apns-reachable` (mặc định là `https://api.sandbox.push.apple.com`; production là `https://api.push.apple.com`).
- `--timeout-ms <ms>`: thời gian chờ cho mỗi yêu cầu tính bằng mili giây.

Xem [Network Proxy](/vi/security/network-proxy) để biết hướng dẫn triển khai và ngữ nghĩa từ chối.

## Preset truy vấn

`openclaw proxy query --preset <name>` chấp nhận:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Ghi chú

- `start` mặc định là `127.0.0.1` trừ khi đặt `--host`.
- `run` khởi động proxy gỡ lỗi cục bộ rồi chạy lệnh sau `--`.
- Việc chuyển tiếp trực tiếp lên upstream của proxy gỡ lỗi sẽ mở socket upstream để chẩn đoán. Khi chế độ proxy được quản lý của OpenClaw đang hoạt động, chuyển tiếp trực tiếp cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định; chỉ đặt `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` cho chẩn đoán cục bộ đã được phê duyệt.
- `validate` thoát với mã 1 khi cấu hình proxy hoặc kiểm tra đích thất bại.
- Dữ liệu ghi lại là dữ liệu gỡ lỗi cục bộ; dùng `openclaw proxy purge` khi hoàn tất.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Network Proxy](/vi/security/network-proxy)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)
