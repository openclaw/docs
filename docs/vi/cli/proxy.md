---
read_when:
    - Bạn cần kiểm tra xác nhận việc định tuyến qua máy chủ trung gian do người vận hành quản lý trước khi triển khai
    - Bạn cần ghi lại lưu lượng truyền tải của OpenClaw cục bộ để gỡ lỗi
    - Bạn muốn kiểm tra các phiên trung gian gỡ lỗi, khối dữ liệu hoặc mẫu truy vấn tích hợp sẵn
summary: Tài liệu tham chiếu CLI cho `openclaw proxy`, bao gồm xác thực proxy do người vận hành quản lý và trình kiểm tra bản ghi thu thập proxy gỡ lỗi cục bộ
title: Máy chủ trung gian
x-i18n:
    generated_at: "2026-05-04T07:03:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Xác thực định tuyến proxy do người vận hành quản lý, hoặc chạy proxy gỡ lỗi tường minh cục bộ
và kiểm tra lưu lượng đã ghi lại.

Dùng `validate` để kiểm tra trước một forward proxy do người vận hành quản lý trước khi bật
định tuyến proxy của OpenClaw. Các lệnh khác là công cụ gỡ lỗi để
điều tra ở cấp truyền tải: chúng có thể khởi động proxy cục bộ, chạy một lệnh con
với tính năng ghi lại được bật, liệt kê các phiên ghi lại, truy vấn các mẫu lưu lượng phổ biến, đọc
các blob đã ghi lại, và xóa dữ liệu ghi lại cục bộ.

## Lệnh

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Xác thực

`openclaw proxy validate` kiểm tra URL proxy hiệu dụng do người vận hành quản lý từ
`--proxy-url`, cấu hình, hoặc `OPENCLAW_PROXY_URL`. Lệnh này báo cáo vấn đề cấu hình khi
không có proxy nào được bật và cấu hình; dùng `--proxy-url` để kiểm tra trước một lần
trước khi thay đổi cấu hình. Theo mặc định, lệnh xác minh rằng một đích công khai thành công
thông qua proxy và proxy không thể truy cập một canary loopback tạm thời.
Các đích bị từ chối tùy chỉnh sẽ fail-closed: phản hồi HTTP và lỗi truyền tải
mơ hồ đều thất bại trừ khi bạn có thể xác minh riêng một tín hiệu từ chối
theo từng triển khai.

Tùy chọn:

- `--json`: in JSON máy có thể đọc.
- `--proxy-url <url>`: xác thực URL proxy này thay vì cấu hình hoặc biến môi trường.
- `--allowed-url <url>`: thêm một đích được kỳ vọng sẽ thành công thông qua proxy. Lặp lại để kiểm tra nhiều đích.
- `--denied-url <url>`: thêm một đích được kỳ vọng sẽ bị proxy chặn. Lặp lại để kiểm tra nhiều đích.
- `--timeout-ms <ms>`: thời gian chờ cho mỗi yêu cầu, tính bằng mili giây.

Xem [Network Proxy](/vi/security/network-proxy) để biết hướng dẫn triển khai và ngữ nghĩa
từ chối.

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
- `run` khởi động một proxy gỡ lỗi cục bộ rồi chạy lệnh sau `--`.
- Chuyển tiếp trực tiếp lên upstream của proxy gỡ lỗi mở các socket upstream để chẩn đoán. Khi chế độ proxy do OpenClaw quản lý đang hoạt động, chuyển tiếp trực tiếp cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định; chỉ đặt `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` cho chẩn đoán cục bộ đã được phê duyệt.
- `validate` thoát với mã 1 khi cấu hình proxy hoặc kiểm tra đích thất bại.
- Các bản ghi là dữ liệu gỡ lỗi cục bộ; dùng `openclaw proxy purge` khi hoàn tất.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Network Proxy](/vi/security/network-proxy)
- [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)
