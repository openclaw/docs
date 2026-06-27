---
read_when:
    - Thêm hoặc sửa đổi hành vi thực thi nền
    - Gỡ lỗi các tác vụ exec chạy lâu
summary: Thực thi exec nền và quản lý tiến trình
title: Công cụ thực thi nền và quy trình
x-i18n:
    generated_at: "2026-06-27T17:27:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw chạy lệnh shell thông qua công cụ `exec` và giữ các tác vụ chạy lâu trong bộ nhớ. Công cụ `process` quản lý các phiên chạy nền đó.

## Công cụ exec

Tham số chính:

- `command` (bắt buộc)
- `yieldMs` (mặc định 10000): tự động chuyển sang nền sau độ trễ này
- `background` (bool): chuyển sang nền ngay lập tức
- `timeout` (giây, mặc định `tools.exec.timeoutSec`): kết thúc tiến trình sau thời gian chờ này; chỉ đặt `timeout: 0` để tắt thời gian chờ của tiến trình exec cho lệnh gọi đó
- `elevated` (bool): chạy bên ngoài môi trường cô lập nếu chế độ nâng quyền được bật/cho phép (`gateway` theo mặc định, hoặc `node` khi đích exec là `node`)
- Cần TTY thật? Đặt `pty: true`.
- `workdir`, `env`

Hành vi:

- Các lần chạy ở tiền cảnh trả về đầu ra trực tiếp.
- Khi được chuyển sang nền (rõ ràng hoặc do hết thời gian chờ), công cụ trả về `status: "running"` + `sessionId` và một đoạn cuối ngắn.
- Các lần chạy nền và `yieldMs` kế thừa `tools.exec.timeoutSec` trừ khi lệnh gọi cung cấp `timeout` rõ ràng.
- Đầu ra được giữ trong bộ nhớ cho đến khi phiên được thăm dò hoặc xóa.
- Nếu công cụ `process` không được cho phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
- Các lệnh exec được sinh ra nhận `OPENCLAW_SHELL=exec` cho các quy tắc shell/profile nhận biết ngữ cảnh.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế đánh thức hoàn tất tự động khi cơ chế đó được bật và lệnh phát sinh đầu ra hoặc thất bại.
- Nếu không có cơ chế đánh thức hoàn tất tự động, hoặc bạn cần xác nhận lệnh đã thoát sạch mà không có đầu ra, hãy dùng `process` để xác nhận hoàn tất.
- Không mô phỏng lời nhắc hoặc lượt theo dõi trễ bằng vòng lặp `sleep` hoặc thăm dò lặp lại; hãy dùng cron cho công việc trong tương lai.

## Cầu nối tiến trình con

Khi sinh các tiến trình con chạy lâu bên ngoài công cụ exec/process (ví dụ: CLI tự khởi động lại hoặc trình trợ giúp Gateway), hãy gắn trình trợ giúp cầu nối tiến trình con để tín hiệu kết thúc được chuyển tiếp và listener được tách ra khi thoát/lỗi. Điều này tránh các tiến trình mồ côi trên systemd và giữ hành vi tắt nhất quán trên các nền tảng.

Ghi đè môi trường:

- `OPENCLAW_BASH_YIELD_MS`: yield mặc định (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: giới hạn đầu ra trong bộ nhớ (ký tự)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: giới hạn stdout/stderr đang chờ cho mỗi luồng (ký tự)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL cho các phiên đã hoàn tất (ms, giới hạn trong 1m-3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: ngưỡng đầu ra nhàn rỗi trước khi các phiên nền có thể ghi được đánh dấu là có khả năng đang chờ đầu vào (mặc định 15000 ms)

Cấu hình (ưu tiên):

- `tools.exec.backgroundMs` (mặc định 10000)
- `tools.exec.timeoutSec` (mặc định 1800)
- `tools.exec.cleanupMs` (mặc định 1800000)
- `tools.exec.notifyOnExit` (mặc định true): đưa một sự kiện hệ thống vào hàng đợi + yêu cầu Heartbeat khi một exec chạy nền thoát.
- `tools.exec.notifyOnExitEmptySuccess` (mặc định false): khi là true, cũng đưa sự kiện hoàn tất vào hàng đợi cho các lần chạy nền thành công nhưng không tạo đầu ra.

## Công cụ process

Hành động:

- `list`: các phiên đang chạy + đã hoàn tất
- `poll`: rút đầu ra mới cho một phiên (cũng báo cáo trạng thái thoát)
- `log`: đọc đầu ra tổng hợp và hiển thị gợi ý khôi phục đầu vào (hỗ trợ `offset` + `limit`)
- `write`: gửi stdin (`data`, `eof` tùy chọn)
- `send-keys`: gửi token phím hoặc byte rõ ràng đến một phiên dựa trên PTY
- `submit`: gửi Enter / carriage return đến một phiên dựa trên PTY
- `paste`: gửi văn bản nguyên văn, tùy chọn bọc trong chế độ dán có ngoặc
- `kill`: kết thúc một phiên nền
- `clear`: xóa một phiên đã hoàn tất khỏi bộ nhớ
- `remove`: kết thúc nếu đang chạy, nếu không thì xóa nếu đã hoàn tất

Ghi chú:

- Chỉ các phiên chạy nền mới được liệt kê/duy trì trong bộ nhớ.
- Phiên sẽ mất khi tiến trình khởi động lại (không lưu bền trên đĩa).
- Nhật ký phiên chỉ được lưu vào lịch sử trò chuyện nếu bạn chạy `process poll/log` và kết quả công cụ được ghi lại.
- `process` được giới hạn theo từng agent; nó chỉ thấy các phiên do agent đó khởi động.
- Dùng `poll` / `log` cho trạng thái, nhật ký, xác nhận lệnh thành công nhưng không có đầu ra, hoặc xác nhận hoàn tất khi không có cơ chế đánh thức hoàn tất tự động.
- Dùng `log` trước khi khôi phục CLI tương tác để transcript hiện tại, trạng thái stdin và gợi ý chờ đầu vào hiển thị cùng nhau.
- Dùng `write` / `send-keys` / `submit` / `paste` / `kill` khi bạn cần nhập liệu hoặc can thiệp.
- `process list` bao gồm một `name` suy ra (động từ lệnh + đích) để quét nhanh.
- `process list`, `poll` và `log` chỉ báo cáo `waitingForInput` khi phiên vẫn có stdin có thể ghi và đã nhàn rỗi lâu hơn ngưỡng chờ đầu vào.
- `process log` dùng `offset`/`limit` dựa trên dòng.
- Khi cả `offset` và `limit` đều bị bỏ qua, nó trả về 200 dòng cuối và bao gồm gợi ý phân trang.
- Khi `offset` được cung cấp và `limit` bị bỏ qua, nó trả về từ `offset` đến cuối (không bị giới hạn ở 200).
- Thăm dò dùng cho trạng thái theo yêu cầu, không dùng để lập lịch vòng lặp chờ. Nếu công việc cần diễn ra sau, hãy dùng cron thay thế.

## Ví dụ

Chạy một tác vụ dài và thăm dò sau:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Kiểm tra một phiên tương tác trước khi gửi đầu vào:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Bắt đầu ngay ở nền:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Gửi stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Gửi phím PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Gửi dòng hiện tại:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Dán văn bản nguyên văn:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Liên quan

- [Công cụ Exec](/vi/tools/exec)
- [Phê duyệt Exec](/vi/tools/exec-approvals)
