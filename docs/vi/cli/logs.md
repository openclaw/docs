---
read_when:
    - Bạn cần theo dõi nhật ký Gateway từ xa (không cần SSH)
    - Bạn muốn các dòng nhật ký JSON cho công cụ
summary: Tài liệu tham khảo CLI cho `openclaw logs` (theo dõi nhật ký Gateway qua RPC)
title: Nhật ký
x-i18n:
    generated_at: "2026-04-29T22:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Theo dõi phần cuối nhật ký tệp Gateway qua RPC (hoạt động ở chế độ từ xa).

Liên quan:

- Tổng quan ghi nhật ký: [Ghi nhật ký](/vi/logging)
- CLI Gateway: [gateway](/vi/cli/gateway)

## Tùy chọn

- `--limit <n>`: số dòng nhật ký tối đa cần trả về (mặc định `200`)
- `--max-bytes <n>`: số byte tối đa cần đọc từ tệp nhật ký (mặc định `250000`)
- `--follow`: theo dõi luồng nhật ký
- `--interval <ms>`: khoảng thời gian thăm dò khi đang theo dõi (mặc định `1000`)
- `--json`: xuất các sự kiện JSON được phân tách theo dòng
- `--plain`: đầu ra văn bản thuần túy không có định dạng tạo kiểu
- `--no-color`: tắt màu ANSI
- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn

## Tùy chọn RPC Gateway dùng chung

`openclaw logs` cũng chấp nhận các cờ máy khách Gateway tiêu chuẩn:

- `--url <url>`: URL WebSocket của Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: thời gian chờ tính bằng mili giây (mặc định `30000`)
- `--expect-final`: chờ phản hồi cuối cùng khi lệnh gọi Gateway được tác nhân hỗ trợ

Khi bạn truyền `--url`, CLI không tự động áp dụng cấu hình hoặc thông tin xác thực môi trường. Hãy thêm `--token` rõ ràng nếu Gateway đích yêu cầu xác thực.

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Ghi chú

- Sử dụng `--local-time` để hiển thị dấu thời gian theo múi giờ cục bộ của bạn.
- Nếu Gateway local loopback ngầm định yêu cầu ghép đôi, đóng trong khi kết nối hoặc hết thời gian chờ trước khi `logs.tail` trả lời, `openclaw logs` sẽ tự động chuyển sang nhật ký tệp Gateway đã cấu hình. Các đích `--url` rõ ràng không sử dụng cơ chế dự phòng này.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Ghi nhật ký Gateway](/vi/gateway/logging)
