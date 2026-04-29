---
read_when:
    - Bạn cần ghi lại lưu lượng truyền tải OpenClaw cục bộ để gỡ lỗi
    - Bạn muốn kiểm tra các phiên proxy gỡ lỗi, khối dữ liệu nhị phân hoặc các mẫu truy vấn tích hợp sẵn
summary: Tài liệu tham khảo CLI cho `openclaw proxy`, proxy gỡ lỗi cục bộ và trình kiểm tra dữ liệu thu thập
title: Máy chủ ủy nhiệm
x-i18n:
    generated_at: "2026-04-29T22:33:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Chạy proxy gỡ lỗi tường minh cục bộ và kiểm tra lưu lượng đã ghi lại.

Đây là lệnh gỡ lỗi dành cho việc điều tra ở cấp truyền tải. Lệnh này có thể khởi động một
proxy cục bộ, chạy một lệnh con với tính năng ghi lại được bật, liệt kê các phiên ghi lại,
truy vấn các mẫu lưu lượng phổ biến, đọc các blob đã ghi lại, và xóa sạch dữ liệu ghi lại
cục bộ.

## Lệnh

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Các mẫu truy vấn có sẵn

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
- Các bản ghi là dữ liệu gỡ lỗi cục bộ; dùng `openclaw proxy purge` khi hoàn tất.

## Liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)
