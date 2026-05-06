---
read_when:
    - Thêm hoặc sửa đổi hành vi thực thi nền
    - Gỡ lỗi các tác vụ exec chạy lâu
summary: Thực thi exec trong nền và quản lý tiến trình
title: Công cụ exec chạy nền và tiến trình
x-i18n:
    generated_at: "2026-05-06T09:11:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw chạy các lệnh shell thông qua công cụ `exec` và giữ các tác vụ chạy dài trong bộ nhớ. Công cụ `process` quản lý các phiên nền đó.

## Công cụ exec

Tham số chính:

- `command` (bắt buộc)
- `yieldMs` (mặc định 10000): tự động chuyển sang nền sau độ trễ này
- `background` (bool): chuyển sang nền ngay lập tức
- `timeout` (giây, mặc định `tools.exec.timeoutSec`): kết thúc tiến trình sau thời gian chờ này; chỉ đặt `timeout: 0` để tắt thời gian chờ của tiến trình exec cho lệnh gọi đó
- `elevated` (bool): chạy bên ngoài sandbox nếu chế độ nâng quyền được bật/cho phép (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`)
- Cần TTY thật? Đặt `pty: true`.
- `workdir`, `env`

Hành vi:

- Các lần chạy tiền cảnh trả về đầu ra trực tiếp.
- Khi được chuyển sang nền (rõ ràng hoặc do hết thời gian), công cụ trả về `status: "running"` + `sessionId` và một phần đuôi ngắn.
- Các lần chạy nền và `yieldMs` kế thừa `tools.exec.timeoutSec` trừ khi lệnh gọi cung cấp `timeout` rõ ràng.
- Đầu ra được giữ trong bộ nhớ cho đến khi phiên được thăm dò hoặc xóa.
- Nếu công cụ `process` không được cho phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
- Các lệnh exec được sinh ra nhận `OPENCLAW_SHELL=exec` cho các quy tắc shell/profile nhận biết ngữ cảnh.
- Với công việc chạy dài bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế đánh thức khi hoàn tất tự động
  khi cơ chế này được bật và lệnh phát ra đầu ra hoặc thất bại.
- Nếu cơ chế đánh thức khi hoàn tất tự động không khả dụng, hoặc bạn cần xác nhận
  thành công im lặng cho một lệnh đã thoát sạch mà không có đầu ra, hãy dùng `process`
  để xác nhận hoàn tất.
- Không mô phỏng nhắc nhở hoặc theo dõi trễ bằng vòng lặp `sleep` hay thăm dò lặp lại;
  hãy dùng cron cho công việc trong tương lai.

## Bắc cầu tiến trình con

Khi sinh các tiến trình con chạy dài bên ngoài công cụ exec/process (ví dụ: CLI tái sinh hoặc trình trợ giúp Gateway), hãy gắn trình trợ giúp cầu nối tiến trình con để tín hiệu kết thúc được chuyển tiếp và các listener được gỡ khi thoát/lỗi. Điều này tránh các tiến trình mồ côi trên systemd và giữ hành vi tắt nhất quán giữa các nền tảng.

Ghi đè môi trường:

- `PI_BASH_YIELD_MS`: yield mặc định (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: giới hạn đầu ra trong bộ nhớ (ký tự)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: giới hạn stdout/stderr đang chờ cho mỗi luồng (ký tự)
- `PI_BASH_JOB_TTL_MS`: TTL cho các phiên đã hoàn tất (ms, bị giới hạn trong 1m–3h)

Cấu hình (ưu tiên):

- `tools.exec.backgroundMs` (mặc định 10000)
- `tools.exec.timeoutSec` (mặc định 1800)
- `tools.exec.cleanupMs` (mặc định 1800000)
- `tools.exec.notifyOnExit` (mặc định true): đưa một sự kiện hệ thống vào hàng đợi + yêu cầu heartbeat khi một exec chạy nền thoát.
- `tools.exec.notifyOnExitEmptySuccess` (mặc định false): khi true, cũng đưa sự kiện hoàn tất vào hàng đợi cho các lần chạy nền thành công nhưng không tạo đầu ra.

## Công cụ process

Hành động:

- `list`: các phiên đang chạy + đã hoàn tất
- `poll`: rút đầu ra mới cho một phiên (đồng thời báo cáo trạng thái thoát)
- `log`: đọc đầu ra tổng hợp (hỗ trợ `offset` + `limit`)
- `write`: gửi stdin (`data`, tùy chọn `eof`)
- `send-keys`: gửi token phím rõ ràng hoặc byte đến phiên có PTY hỗ trợ
- `submit`: gửi Enter / carriage return đến phiên có PTY hỗ trợ
- `paste`: gửi văn bản nguyên văn, tùy chọn bọc trong chế độ dán có ngoặc
- `kill`: kết thúc một phiên nền
- `clear`: xóa một phiên đã hoàn tất khỏi bộ nhớ
- `remove`: kill nếu đang chạy, nếu không thì clear nếu đã hoàn tất

Ghi chú:

- Chỉ các phiên được chuyển sang nền mới được liệt kê/duy trì trong bộ nhớ.
- Các phiên sẽ mất khi tiến trình khởi động lại (không có duy trì trên đĩa).
- Nhật ký phiên chỉ được lưu vào lịch sử chat nếu bạn chạy `process poll/log` và kết quả công cụ được ghi lại.
- `process` được giới hạn theo từng tác tử; nó chỉ thấy các phiên do tác tử đó khởi động.
- Dùng `poll` / `log` cho trạng thái, nhật ký, xác nhận thành công im lặng, hoặc
  xác nhận hoàn tất khi cơ chế đánh thức khi hoàn tất tự động không khả dụng.
- Dùng `write` / `send-keys` / `submit` / `paste` / `kill` khi bạn cần nhập liệu
  hoặc can thiệp.
- `process list` bao gồm `name` suy ra (động từ lệnh + mục tiêu) để quét nhanh.
- `process log` dùng `offset`/`limit` dựa trên dòng.
- Khi cả `offset` và `limit` đều bị bỏ qua, nó trả về 200 dòng cuối và bao gồm gợi ý phân trang.
- Khi cung cấp `offset` và bỏ qua `limit`, nó trả về từ `offset` đến cuối (không bị giới hạn ở 200).
- Thăm dò dùng cho trạng thái theo yêu cầu, không phải lập lịch vòng lặp chờ. Nếu công việc nên
  xảy ra sau, hãy dùng cron thay thế.

## Ví dụ

Chạy một tác vụ dài và thăm dò sau:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Bắt đầu ngay trong nền:

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
