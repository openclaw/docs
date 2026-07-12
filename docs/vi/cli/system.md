---
read_when:
    - Bạn muốn đưa một sự kiện hệ thống vào hàng đợi mà không tạo tác vụ Cron
    - Bạn cần bật hoặc tắt heartbeat
    - Bạn muốn kiểm tra các mục trạng thái hiện diện của hệ thống
summary: Tài liệu tham khảo CLI cho `openclaw system` (sự kiện hệ thống, Heartbeat, trạng thái hiện diện)
title: Hệ thống
x-i18n:
    generated_at: "2026-07-12T07:46:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Các trình hỗ trợ cấp hệ thống cho Gateway: đưa sự kiện hệ thống vào hàng đợi, điều khiển
Heartbeat và xem trạng thái hiện diện.

Tất cả lệnh con `system` đều sử dụng RPC của Gateway và chấp nhận các cờ máy khách dùng chung:

| Cờ                | Mặc định                             | Mô tả                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` khi được cấu hình | URL WebSocket của Gateway.                                                                                                                                                                            |
| `--token <token>` | không có                             | Token của Gateway (nếu được yêu cầu).                                                                                                                                                                 |
| `--timeout <ms>`  | `30000`                              | Thời gian chờ RPC tính bằng mili giây.                                                                                                                                                                |
| `--expect-final`  | tắt                                  | Chờ phản hồi cuối cùng (tác tử).                                                                                                                                                                      |
| `--json`          | tắt                                  | Xuất JSON. `heartbeat last/enable/disable` và `system presence` luôn in tải trọng JSON RPC thô bất kể cờ này; `system event` dùng cờ này để chuyển đổi giữa JSON và một dòng `ok` thuần túy. |

## Các lệnh thường dùng

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Theo mặc định, đưa một sự kiện hệ thống vào hàng đợi trên phiên **chính**. Heartbeat
tiếp theo sẽ chèn sự kiện đó dưới dạng một dòng `System:` trong lời nhắc. Dùng `--mode now` để
kích hoạt Heartbeat ngay lập tức; `next-heartbeat` (mặc định) sẽ chờ đến
nhịp được lên lịch tiếp theo.

Truyền `--session-key` để nhắm đến một phiên cụ thể, chẳng hạn nhằm chuyển tiếp thông báo
hoàn tất tác vụ bất đồng bộ trở lại kênh đã khởi chạy tác vụ đó.

<Note>
**Ngoại lệ về thời điểm với `--session-key`:** khi cung cấp `--session-key`,
`--mode next-heartbeat` được rút gọn thành thao tác đánh thức có mục tiêu ngay lập tức thay vì
chờ đến nhịp được lên lịch tiếp theo. Thao tác đánh thức có mục tiêu sử dụng ý định Heartbeat
`immediate`, nhờ đó bỏ qua cổng kiểm tra chưa đến hạn của trình chạy, vốn nếu không sẽ
trì hoãn (và trên thực tế là loại bỏ) thao tác đánh thức có ý định `event`. Nếu muốn phân phối
trễ, hãy bỏ `--session-key` để sự kiện được đưa vào phiên chính và
được chuyển đi trong Heartbeat thông thường tiếp theo.
</Note>

Các cờ:

- `--text <text>`: văn bản sự kiện hệ thống bắt buộc.
- `--mode <mode>`: `now` hoặc `next-heartbeat` (mặc định).
- `--session-key <sessionKey>`: tùy chọn; nhắm đến một phiên tác tử cụ thể
  thay vì phiên chính của tác tử. Các khóa không thuộc về tác tử
  đã được phân giải sẽ dùng phiên chính của tác tử làm phương án dự phòng.

## `system heartbeat last|enable|disable`

- `last`: hiển thị sự kiện Heartbeat gần nhất.
- `enable`: bật lại Heartbeat (dùng tùy chọn này nếu Heartbeat đã bị tắt).
- `disable`: tạm dừng Heartbeat.

## `system presence`

Liệt kê các mục hiện diện hệ thống hiện tại mà Gateway biết đến (các Node,
phiên bản và các dòng trạng thái tương tự).

## Ghi chú

- Yêu cầu một Gateway đang chạy và có thể truy cập được bằng cấu hình hiện tại của bạn (cục bộ hoặc
  từ xa).
- Các sự kiện hệ thống chỉ tồn tại tạm thời và không được duy trì qua các lần khởi động lại.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
