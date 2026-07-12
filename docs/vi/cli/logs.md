---
read_when:
    - Bạn cần theo dõi liên tục nhật ký Gateway từ xa (không dùng SSH)
    - Bạn muốn các dòng nhật ký JSON cho công cụ xử lý
summary: Tài liệu tham khảo CLI cho `openclaw logs` (theo dõi nhật ký Gateway qua RPC)
title: Nhật ký
x-i18n:
    generated_at: "2026-07-12T07:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Theo dõi liên tục nhật ký tệp của Gateway qua RPC. Hoạt động ở chế độ từ xa.

## Tùy chọn

- `--limit <n>`: số dòng nhật ký tối đa được trả về (mặc định `200`)
- `--max-bytes <n>`: số byte tối đa được đọc từ tệp nhật ký (mặc định `250000`)
- `--follow`: theo dõi liên tục luồng nhật ký
- `--interval <ms>`: khoảng thời gian thăm dò khi đang theo dõi (mặc định `1000`)
- `--json`: xuất các sự kiện JSON, mỗi sự kiện trên một dòng
- `--plain`: xuất văn bản thuần túy không có định dạng kiểu
- `--no-color`: tắt màu ANSI
- `--local-time`: hiển thị dấu thời gian theo múi giờ cục bộ của bạn (mặc định)
- `--utc`: hiển thị dấu thời gian theo UTC

## Các tùy chọn RPC dùng chung của Gateway

- `--url <url>`: URL WebSocket của Gateway
- `--token <token>`: token của Gateway
- `--timeout <ms>`: thời gian chờ tính bằng mili giây (mặc định `30000`)
- `--expect-final`: chờ phản hồi cuối cùng khi lệnh gọi Gateway được hỗ trợ bởi tác tử

Việc truyền `--url` sẽ bỏ qua thông tin xác thực từ cấu hình được tự động áp dụng; hãy chỉ định rõ `--token` nếu Gateway đích yêu cầu xác thực.

## Ví dụ

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Hành vi dự phòng và khôi phục

- Nếu Gateway local loopback ngầm định yêu cầu ghép nối, đóng kết nối trong khi đang kết nối hoặc hết thời gian chờ trước khi `logs.tail` phản hồi, `openclaw logs` sẽ tự động chuyển sang nhật ký tệp Gateway đã cấu hình. Các đích được chỉ định rõ bằng `--url` không bao giờ sử dụng cơ chế dự phòng này.
- `--follow` không chuyển sang tệp đã cấu hình đó sau khi RPC tới Gateway cục bộ ngầm định gặp lỗi — một tệp song song đã lỗi thời có thể khiến việc theo dõi trực tiếp gây hiểu nhầm. Thay vào đó, trên Linux, lệnh sử dụng nhật ký Gateway user-systemd đang hoạt động theo PID khi có sẵn (và in ra nguồn đã chọn); nếu không, lệnh tiếp tục thử lại với Gateway trực tiếp.
- Trong khi chạy `--follow`, các lần ngắt kết nối tạm thời (WebSocket đóng, hết thời gian chờ, mất kết nối) sẽ kích hoạt tự động kết nối lại với thời gian chờ tăng theo cấp số nhân: tối đa 8 lần thử lại, với khoảng cách giữa các lần thử không quá 30 giây. Một cảnh báo được in ra stderr ở mỗi lần thử lại và thông báo `[logs] gateway reconnected` được in một lần khi thăm dò thành công. Ở chế độ `--json`, cả hai được xuất dưới dạng bản ghi `{"type":"notice"}` trên stderr. Các lỗi không thể khôi phục (xác thực thất bại, cấu hình không hợp lệ) vẫn khiến chương trình thoát ngay lập tức.
- Ở chế độ `--follow --json`, các lần chuyển đổi nguồn nhật ký được xuất dưới dạng bản ghi `{"type":"meta"}`. Hãy theo dõi con trỏ riêng cho từng `sourceKind`: một luồng có thể chuyển từ đầu ra tệp Gateway (`sourceKind: "file"`) sang nguồn dự phòng nhật ký cục bộ (`sourceKind: "journal"`, `localFallback: true`, kèm `service.pid`/`service.unit`), rồi trở lại đầu ra tệp Gateway sau khi khôi phục. Không được giả định rằng toàn bộ phiên chỉ có một nguồn hoặc con trỏ ổn định, đồng thời cần chấp nhận các dòng trùng lặp khi quá trình khôi phục phát lại từ con trỏ tệp Gateway.

## Liên quan

- [Tổng quan về ghi nhật ký](/vi/logging)
- [CLI của Gateway](/vi/cli/gateway)
- [Tài liệu tham khảo CLI](/vi/cli)
- [Ghi nhật ký Gateway](/vi/gateway/logging)
