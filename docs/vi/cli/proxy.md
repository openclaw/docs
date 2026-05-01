---
read_when:
    - Bạn cần xác thực việc định tuyến qua máy chủ ủy quyền do người vận hành quản lý trước khi triển khai
    - Bạn cần ghi lại lưu lượng truyền tải OpenClaw cục bộ để gỡ lỗi
    - Bạn muốn kiểm tra các phiên proxy gỡ lỗi, khối dữ liệu nhị phân hoặc các mẫu truy vấn tích hợp sẵn
summary: Tham khảo CLI cho `openclaw proxy`, bao gồm xác thực proxy do người vận hành quản lý và trình kiểm tra bản ghi proxy gỡ lỗi cục bộ
title: Máy chủ trung gian
x-i18n:
    generated_at: "2026-05-01T10:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Xác thực định tuyến proxy do người vận hành quản lý, hoặc chạy proxy gỡ lỗi tường minh cục bộ
và kiểm tra lưu lượng đã thu thập.

Dùng `validate` để kiểm tra sơ bộ proxy chuyển tiếp do người vận hành quản lý trước khi bật
định tuyến proxy của OpenClaw. Các lệnh khác là công cụ gỡ lỗi cho
việc điều tra ở cấp truyền tải: chúng có thể khởi động một proxy cục bộ, chạy một lệnh con
với chế độ thu thập được bật, liệt kê các phiên thu thập, truy vấn các mẫu lưu lượng phổ biến, đọc
các blob đã thu thập và xóa dữ liệu thu thập cục bộ.

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

`openclaw proxy validate` kiểm tra URL proxy hiệu lực do người vận hành quản lý từ
`--proxy-url`, cấu hình hoặc `OPENCLAW_PROXY_URL`. Lệnh này báo cáo sự cố cấu hình khi
không có proxy nào được bật và cấu hình; dùng `--proxy-url` để kiểm tra sơ bộ một lần
trước khi thay đổi cấu hình. Theo mặc định, lệnh xác minh rằng một đích công khai truy cập thành công
qua proxy và proxy không thể truy cập một canary loopback tạm thời.
Các đích bị từ chối tùy chỉnh sẽ đóng khi lỗi: phản hồi HTTP và các lỗi
truyền tải mơ hồ đều khiến kiểm tra thất bại, trừ khi bạn có thể xác minh riêng một tín hiệu từ chối
đặc thù của triển khai.

Tùy chọn:

- `--json`: in JSON có thể đọc bằng máy.
- `--proxy-url <url>`: xác thực URL proxy này thay vì cấu hình hoặc biến môi trường.
- `--allowed-url <url>`: thêm một đích được kỳ vọng là truy cập thành công qua proxy. Lặp lại để kiểm tra nhiều đích.
- `--denied-url <url>`: thêm một đích được kỳ vọng là bị proxy chặn. Lặp lại để kiểm tra nhiều đích.
- `--timeout-ms <ms>`: thời gian chờ cho mỗi yêu cầu, tính bằng mili giây.

Xem [Proxy mạng](/vi/security/network-proxy) để biết hướng dẫn triển khai và ngữ nghĩa
từ chối.

## Thiết lập sẵn truy vấn

`openclaw proxy query --preset <name>` chấp nhận:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Ghi chú

- `start` mặc định dùng `127.0.0.1` trừ khi đặt `--host`.
- `run` khởi động proxy gỡ lỗi cục bộ rồi chạy lệnh sau `--`.
- `validate` thoát với mã 1 khi cấu hình proxy hoặc kiểm tra đích thất bại.
- Dữ liệu thu thập là dữ liệu gỡ lỗi cục bộ; dùng `openclaw proxy purge` khi hoàn tất.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Proxy mạng](/vi/security/network-proxy)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)
