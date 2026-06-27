---
read_when:
    - Bạn cần theo dõi nhật ký Gateway từ xa (không cần SSH)
    - Bạn muốn các dòng nhật ký JSON cho công cụ
summary: Tham chiếu CLI cho `openclaw logs` (theo dõi nhật ký Gateway qua RPC)
title: Nhật ký
x-i18n:
    generated_at: "2026-06-27T17:18:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Theo dõi log tệp Gateway qua RPC (hoạt động ở chế độ từ xa).

Liên quan:

- Tổng quan về ghi log: [Ghi log](/vi/logging)
- Gateway CLI: [gateway](/vi/cli/gateway)

## Tùy chọn

- `--limit <n>`: số dòng log tối đa cần trả về (mặc định `200`)
- `--max-bytes <n>`: số byte tối đa cần đọc từ tệp log (mặc định `250000`)
- `--follow`: theo dõi luồng log
- `--interval <ms>`: khoảng thời gian thăm dò khi đang theo dõi (mặc định `1000`)
- `--json`: phát các sự kiện JSON phân tách theo dòng
- `--plain`: đầu ra văn bản thuần không có định dạng tạo kiểu
- `--no-color`: tắt màu ANSI
- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn (mặc định)
- `--utc`: hiển thị dấu thời gian theo UTC

## Tùy chọn RPC Gateway dùng chung

`openclaw logs` cũng chấp nhận các cờ máy khách Gateway tiêu chuẩn:

- `--url <url>`: URL WebSocket của Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: thời gian chờ tính bằng ms (mặc định `30000`)
- `--expect-final`: chờ phản hồi cuối cùng khi lệnh gọi Gateway được agent hỗ trợ

Khi bạn truyền `--url`, CLI không tự động áp dụng thông tin xác thực từ cấu hình hoặc môi trường. Hãy thêm `--token` rõ ràng nếu Gateway đích yêu cầu xác thực.

## Ví dụ

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Ghi chú

- Theo mặc định, dấu thời gian hiển thị theo múi giờ cục bộ của bạn. Dùng `--utc` để xuất theo UTC.
- Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong khi kết nối, hoặc hết thời gian chờ trước khi `logs.tail` phản hồi, `openclaw logs` sẽ tự động chuyển sang log tệp Gateway đã cấu hình. Các đích `--url` rõ ràng không dùng cơ chế dự phòng này.
- `openclaw logs --follow` không theo dõi các cơ chế dự phòng tệp đã cấu hình sau lỗi RPC Gateway cục bộ ngầm định. Trên Linux, lệnh này dùng nhật ký Gateway user-systemd đang hoạt động theo PID khi có sẵn và in nguồn log đã chọn; nếu không, nó tiếp tục thử lại Gateway trực tiếp thay vì tail một tệp đặt cạnh có thể đã cũ.
- Khi dùng `--follow`, các lần ngắt kết nối gateway tạm thời (WebSocket đóng, hết thời gian chờ, mất kết nối) sẽ kích hoạt tự động kết nối lại với backoff lũy thừa (tối đa 8 lần thử lại, giới hạn 30 giây giữa các lần thử). Mỗi lần thử lại sẽ in cảnh báo ra stderr, và thông báo `[logs] gateway reconnected` sẽ được in sau khi một lần thăm dò thành công. Ở chế độ `--json`, cả cảnh báo thử lại và chuyển tiếp kết nối lại đều được phát dưới dạng bản ghi `{"type":"notice"}` trên stderr. Các lỗi không thể khôi phục (xác thực thất bại, cấu hình sai) vẫn thoát ngay lập tức.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghi log Gateway](/vi/gateway/logging)
