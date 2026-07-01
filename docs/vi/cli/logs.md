---
read_when:
    - Bạn cần theo dõi log Gateway từ xa (không cần SSH)
    - Bạn muốn các dòng nhật ký JSON cho công cụ
summary: Tham chiếu CLI cho `openclaw logs` (theo dõi nhật ký gateway qua RPC)
title: Nhật ký
x-i18n:
    generated_at: "2026-07-01T15:27:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Theo dõi phần cuối nhật ký tệp Gateway qua RPC (hoạt động ở chế độ từ xa).

Liên quan:

- Tổng quan về ghi nhật ký: [Ghi nhật ký](/vi/logging)
- CLI Gateway: [gateway](/vi/cli/gateway)

## Tùy chọn

- `--limit <n>`: số dòng nhật ký tối đa cần trả về (mặc định `200`)
- `--max-bytes <n>`: số byte tối đa cần đọc từ tệp nhật ký (mặc định `250000`)
- `--follow`: theo dõi luồng nhật ký
- `--interval <ms>`: khoảng thời gian thăm dò khi đang theo dõi (mặc định `1000`)
- `--json`: xuất các sự kiện JSON phân tách theo dòng
- `--plain`: đầu ra văn bản thuần không có định dạng kiểu cách
- `--no-color`: tắt màu ANSI
- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn (mặc định)
- `--utc`: hiển thị dấu thời gian theo UTC

## Tùy chọn RPC Gateway dùng chung

`openclaw logs` cũng chấp nhận các cờ máy khách Gateway tiêu chuẩn:

- `--url <url>`: URL WebSocket của Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: thời gian chờ tính bằng ms (mặc định `30000`)
- `--expect-final`: chờ phản hồi cuối cùng khi lệnh gọi Gateway được tác tử hỗ trợ

Khi bạn truyền `--url`, CLI không tự động áp dụng cấu hình hoặc thông tin xác thực từ môi trường. Hãy bao gồm `--token` rõ ràng nếu Gateway đích yêu cầu xác thực.

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

- Dấu thời gian mặc định hiển thị theo múi giờ cục bộ của bạn. Dùng `--utc` để xuất theo UTC.
- Nếu Gateway local loopback ngầm định yêu cầu ghép nối, đóng trong khi kết nối, hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` sẽ tự động chuyển về nhật ký tệp Gateway đã cấu hình. Các đích `--url` rõ ràng không dùng cơ chế dự phòng này.
- `openclaw logs --follow` không theo dõi các dự phòng tệp đã cấu hình sau lỗi RPC Gateway cục bộ ngầm định. Trên Linux, lệnh này dùng journal Gateway user-systemd đang hoạt động theo PID khi có sẵn và in nguồn nhật ký đã chọn; nếu không, lệnh tiếp tục thử lại Gateway trực tiếp thay vì theo dõi một tệp đặt cạnh có thể đã cũ.
- Khi dùng `--follow`, các lần ngắt kết nối Gateway tạm thời (đóng WebSocket, hết thời gian chờ, rớt kết nối) sẽ kích hoạt tự động kết nối lại với backoff lũy thừa (tối đa 8 lần thử lại, giới hạn 30 giây giữa các lần thử). Một cảnh báo được in ra stderr ở mỗi lần thử lại, và thông báo `[logs] gateway reconnected` được in sau khi một lần thăm dò thành công. Ở chế độ `--json`, cả cảnh báo thử lại và chuyển trạng thái kết nối lại đều được phát ra dưới dạng bản ghi `{"type":"notice"}` trên stderr. Các lỗi không thể khôi phục (lỗi xác thực, cấu hình sai) vẫn thoát ngay lập tức.
- Ở chế độ `--follow --json`, các chuyển đổi nguồn nhật ký được phát ra dưới dạng bản ghi `{"type":"meta"}`. Thành phần tiêu thụ nên theo dõi con trỏ theo từng `sourceKind`: một luồng có thể chuyển từ đầu ra tệp Gateway (`sourceKind: "file"`) sang dự phòng journal cục bộ (`sourceKind: "journal"`, `localFallback: true`, cùng với `service.pid`/`service.unit`) rồi quay lại đầu ra tệp Gateway sau khi khôi phục. Đừng giả định một nguồn hoặc con trỏ ổn định duy nhất cho toàn bộ phiên theo dõi, và hãy chấp nhận các dòng trùng lặp khi quá trình khôi phục phát lại con trỏ tệp Gateway.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghi nhật ký Gateway](/vi/gateway/logging)
