---
read_when:
    - Bạn muốn đưa một sự kiện hệ thống vào hàng đợi mà không tạo tác vụ Cron
    - Bạn cần bật hoặc tắt Heartbeat
    - Bạn muốn kiểm tra các mục hiện diện của hệ thống
summary: Tham chiếu CLI cho `openclaw system` (sự kiện hệ thống, Heartbeat, trạng thái hiện diện)
title: Hệ thống
x-i18n:
    generated_at: "2026-05-11T20:27:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

Trình trợ giúp cấp hệ thống cho Gateway: đưa sự kiện hệ thống vào hàng đợi, điều khiển Heartbeat,
và xem trạng thái hiện diện.

Tất cả lệnh con `system` dùng Gateway RPC và chấp nhận các cờ máy khách dùng chung:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Lệnh phổ biến

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Theo mặc định, đưa một sự kiện hệ thống vào hàng đợi trên phiên **main**. Heartbeat tiếp theo
sẽ chèn nó dưới dạng một dòng `System:` trong prompt. Dùng `--mode now` để kích hoạt
Heartbeat ngay lập tức; `next-heartbeat` chờ tick đã lên lịch tiếp theo.

Truyền `--session-key` để nhắm tới một phiên cụ thể (ví dụ để chuyển tiếp việc hoàn tất
tác vụ bất đồng bộ trở lại kênh đã khởi động tác vụ đó).

> **Ngoại lệ về thời điểm với `--session-key`:** khi cung cấp `--session-key`,
> `--mode next-heartbeat` sẽ rút gọn thành một lần đánh thức có nhắm mục tiêu ngay lập tức thay vì
> chờ tick đã lên lịch tiếp theo. Các lần đánh thức có nhắm mục tiêu dùng ý định Heartbeat
> `immediate`, nên chúng bỏ qua cổng chưa đến hạn của runner, vốn nếu không sẽ
> trì hoãn (và thực tế là loại bỏ) một lần đánh thức có ý định `event`. Nếu bạn muốn gửi
> có độ trễ, hãy bỏ qua `--session-key` để sự kiện được đưa vào phiên chính và
> đi theo Heartbeat định kỳ tiếp theo.

Cờ:

- `--text <text>`: văn bản sự kiện hệ thống bắt buộc.
- `--mode <mode>`: `now` hoặc `next-heartbeat` (mặc định).
- `--session-key <sessionKey>`: tùy chọn; nhắm tới một phiên tác nhân cụ thể
  thay vì phiên chính của tác nhân. Các khóa không thuộc về tác nhân
  đã phân giải sẽ quay về phiên chính của tác nhân.
- `--json`: đầu ra máy đọc được.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## `system heartbeat last|enable|disable`

Điều khiển Heartbeat:

- `last`: hiển thị sự kiện Heartbeat gần nhất.
- `enable`: bật lại Heartbeat (dùng tùy chọn này nếu chúng đã bị tắt).
- `disable`: tạm dừng Heartbeat.

Cờ:

- `--json`: đầu ra máy đọc được.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## `system presence`

Liệt kê các mục hiện diện hệ thống hiện tại mà Gateway biết (nút,
phiên bản, và các dòng trạng thái tương tự).

Cờ:

- `--json`: đầu ra máy đọc được.
- `--url`, `--token`, `--timeout`, `--expect-final`: các cờ Gateway RPC dùng chung.

## Ghi chú

- Yêu cầu một Gateway đang chạy và có thể truy cập bằng cấu hình hiện tại của bạn (cục bộ hoặc từ xa).
- Sự kiện hệ thống là tạm thời và không được duy trì qua các lần khởi động lại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
