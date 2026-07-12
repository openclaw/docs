---
read_when:
    - Thêm hoặc sửa đổi hành vi thực thi nền
    - Gỡ lỗi các tác vụ exec chạy lâu dài
summary: Thực thi exec nền và quản lý tiến trình
title: Thực thi nền và công cụ tiến trình
x-i18n:
    generated_at: "2026-07-12T07:53:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw chạy các lệnh shell thông qua công cụ `exec` và giữ các tác vụ chạy lâu trong bộ nhớ. Công cụ `process` quản lý các phiên chạy nền đó.

## Công cụ exec

Tham số:

| Tham số      | Mô tả                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Bắt buộc. Lệnh shell cần chạy.                                                                                                                                                  |
| `workdir`    | Thư mục làm việc; bỏ qua để sử dụng cwd mặc định.                                                                                                                               |
| `env`        | Các biến môi trường bổ sung cho lệnh.                                                                                                                                           |
| `yieldMs`    | Số mili giây chờ trước khi chuyển sang chạy nền (mặc định là 10000).                                                                                                             |
| `background` | Chạy nền ngay lập tức.                                                                                                                                                          |
| `timeout`    | Thời gian chờ tính bằng giây (mặc định là `tools.exec.timeoutSec`); kết thúc tiến trình khi hết hạn. Đặt `timeout: 0` để tắt thời gian chờ của tiến trình exec cho lần gọi đó.     |
| `pty`        | Chạy trong thiết bị đầu cuối giả khi có thể (các CLI yêu cầu TTY, tác nhân lập trình).                                                                                           |
| `elevated`   | Chạy bên ngoài sandbox nếu chế độ nâng cao được bật/cho phép (mặc định là `gateway`, hoặc `node` khi đích exec là `node`).                                                       |
| `host`       | Đích exec: `auto`, `sandbox`, `gateway` hoặc `node`.                                                                                                                             |
| `node`       | ID/tên Node, được sử dụng với `host: "node"`.                                                                                                                                   |

Hành vi:

- Các lần chạy ở chế độ tiền cảnh trả về đầu ra trực tiếp.
- Khi được chuyển sang chạy nền (rõ ràng hoặc do hết thời gian `yieldMs`), công cụ trả về `status: "running"` + `sessionId` và một đoạn ngắn ở cuối đầu ra.
- Các lần chạy nền và chạy với `yieldMs` kế thừa `tools.exec.timeoutSec`, trừ khi lần gọi truyền `timeout` rõ ràng.
- Đầu ra được giữ trong bộ nhớ cho đến khi phiên được thăm dò hoặc xóa.
- Nếu công cụ `process` không được phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
- Các lệnh exec được khởi chạy nhận `OPENCLAW_SHELL=exec` để áp dụng các quy tắc shell/hồ sơ có nhận biết ngữ cảnh.
- Đối với công việc chạy lâu bắt đầu ngay bây giờ: chỉ khởi động một lần và dựa vào cơ chế đánh thức tự động khi hoàn tất (nếu được bật) sau khi lệnh tạo đầu ra hoặc thất bại.
- Nếu cơ chế đánh thức tự động khi hoàn tất không khả dụng, hoặc bạn cần xác nhận thành công im lặng cho một lệnh thoát bình thường mà không có đầu ra, hãy thăm dò bằng `process`.
- Không mô phỏng lời nhắc hoặc thao tác theo dõi trì hoãn bằng vòng lặp `sleep` hay thăm dò lặp lại — hãy dùng Cron cho công việc trong tương lai.

### Ghi đè bằng biến môi trường

| Biến                                      | Tác dụng                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_BASH_YIELD_MS`                  | Thời gian chờ mặc định trước khi chuyển sang chạy nền (ms). Mặc định là 10000, được giới hạn trong khoảng 10-120000.                              |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`          | Giới hạn đầu ra trong bộ nhớ (ký tự).                                                                                                             |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`  | Giới hạn stdout/stderr đang chờ cho mỗi luồng (ký tự).                                                                                            |
| `OPENCLAW_BASH_JOB_TTL_MS`                | TTL cho các phiên đã hoàn tất (ms), được giới hạn trong khoảng 1 phút-3 giờ.                                                                      |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`     | Ngưỡng không có đầu ra trước khi các phiên chạy nền có thể ghi được đánh dấu là có khả năng đang chờ dữ liệu đầu vào. Mặc định là 15000.          |

### Cấu hình (được ưu tiên hơn ghi đè bằng biến môi trường)

| Khóa                                  | Mặc định | Tác dụng                                                                                                  |
| ------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000    | Giống `OPENCLAW_BASH_YIELD_MS`.                                                                           |
| `tools.exec.timeoutSec`               | 1800     | Thời gian chờ mặc định cho mỗi lần gọi.                                                                   |
| `tools.exec.cleanupMs`                | 1800000  | Giống `OPENCLAW_BASH_JOB_TTL_MS`.                                                                         |
| `tools.exec.notifyOnExit`             | true     | Đưa một sự kiện hệ thống vào hàng đợi + yêu cầu Heartbeat khi một tiến trình exec chạy nền thoát.         |
| `tools.exec.notifyOnExitEmptySuccess` | false    | Đồng thời đưa các sự kiện hoàn tất vào hàng đợi cho những lần chạy nền thành công nhưng không có đầu ra. |

## Cầu nối tiến trình con

Khi khởi chạy các tiến trình con chạy lâu bên ngoài công cụ exec/process (CLI tự khởi chạy lại, trình trợ giúp Gateway), hãy gắn trình trợ giúp cầu nối tiến trình con để chuyển tiếp tín hiệu kết thúc và tháo các trình lắng nghe khi thoát/gặp lỗi. Điều này tránh các tiến trình mồ côi trên systemd và duy trì quy trình tắt nhất quán trên các nền tảng.

## Công cụ process

Thao tác:

| Thao tác     | Tác dụng                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `list`       | Các phiên đang chạy + đã hoàn tất.                                                                         |
| `poll`       | Đọc và loại khỏi bộ đệm đầu ra mới của một phiên (đồng thời báo cáo trạng thái thoát).                     |
| `log`        | Đọc đầu ra tổng hợp và gợi ý khôi phục dữ liệu đầu vào. Hỗ trợ `offset` + `limit`.                         |
| `write`      | Gửi stdin (`data`, `eof` tùy chọn).                                                                        |
| `send-keys`  | Gửi các mã phím hoặc byte cụ thể tới phiên sử dụng PTY.                                                    |
| `submit`     | Gửi Enter/ký tự xuống dòng tới phiên sử dụng PTY.                                                          |
| `paste`      | Gửi văn bản nguyên dạng, có thể được bao trong chế độ dán có dấu ngoặc.                                    |
| `kill`       | Kết thúc một phiên chạy nền.                                                                               |
| `clear`      | Xóa một phiên đã hoàn tất khỏi bộ nhớ.                                                                     |
| `remove`     | Kết thúc nếu đang chạy, nếu không thì xóa nếu đã hoàn tất.                                                |

Lưu ý:

- Chỉ các phiên chạy nền mới được liệt kê/lưu giữ — chỉ trong bộ nhớ, không phải trên đĩa. Các phiên sẽ mất khi tiến trình khởi động lại.
- Một phiên chạy nền còn hoạt động sẽ chặn việc tạm ngưng máy chủ theo cơ chế hợp tác và khởi động lại Gateway an toàn cho đến khi chủ sở hữu tiến trình xác nhận tiến trình thực sự đã thoát.
- `process remove` có thể ẩn ngay một phiên đang chạy sau khi yêu cầu kết thúc; việc tạm ngưng và khởi động lại vẫn bị chặn cho đến khi xác nhận tiến trình đã thoát.
- Nhật ký phiên chỉ được lưu vào lịch sử trò chuyện nếu bạn chạy `process poll`/`log` và kết quả công cụ được ghi lại.
- `process` có phạm vi theo từng tác nhân; nó chỉ nhìn thấy các phiên do tác nhân đó khởi động.
- Dùng `poll`/`log` để xem trạng thái, nhật ký hoặc xác nhận hoàn tất khi cơ chế đánh thức tự động khi hoàn tất không khả dụng.
- Dùng `log` trước khi khôi phục một CLI tương tác để có thể xem đồng thời bản ghi hiện tại, trạng thái stdin và gợi ý chờ dữ liệu đầu vào.
- Dùng `write`/`send-keys`/`submit`/`paste`/`kill` khi bạn cần nhập dữ liệu hoặc can thiệp.
- `process list` bao gồm một `name` được suy ra (động từ lệnh + đích) để quét nhanh.
- `process list`, `poll` và `log` chỉ báo cáo `waitingForInput` khi phiên vẫn có stdin có thể ghi và đã không hoạt động lâu hơn ngưỡng chờ dữ liệu đầu vào (mặc định là 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` sử dụng `offset`/`limit` theo dòng. Khi cả hai đều bị bỏ qua, nó trả về 200 dòng cuối cùng cùng gợi ý phân trang. Khi đặt `offset` nhưng không đặt `limit`, nó trả về từ `offset` đến cuối (không bị giới hạn ở 200 dòng).
- `timeout` của `poll` chờ tối đa số mili giây đó trước khi trả về; các giá trị lớn hơn 30000 được giới hạn ở 30000.
- Việc thăm dò dùng để kiểm tra trạng thái theo yêu cầu, không phải để lập lịch vòng lặp chờ. Nếu công việc cần diễn ra sau này, hãy dùng Cron.

## Ví dụ

Chạy một tác vụ dài và thăm dò sau:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Kiểm tra một phiên tương tác trước khi gửi dữ liệu đầu vào:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Bắt đầu chạy nền ngay lập tức:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Gửi stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Gửi các phím PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Gửi dòng hiện tại:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Dán văn bản nguyên dạng:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Liên quan

- [Công cụ Exec](/vi/tools/exec)
- [Phê duyệt Exec](/vi/tools/exec-approvals)
