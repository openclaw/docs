---
read_when:
    - Bạn muốn kích hoạt các lượt chạy agent từ script hoặc dòng lệnh
    - Bạn cần gửi phản hồi của agent đến một kênh trò chuyện bằng lập trình
summary: Chạy các lượt tác tử từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Gửi tác tử
x-i18n:
    generated_at: "2026-06-27T18:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt tác nhân duy nhất từ dòng lệnh mà không cần
tin nhắn trò chuyện đến. Dùng lệnh này cho quy trình có script, kiểm thử và
phân phối theo chương trình.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt tác nhân đơn giản">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Lệnh này gửi tin nhắn qua Gateway và in phản hồi.

  </Step>

  <Step title="Gửi prompt nhiều dòng từ một tệp">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lệnh này đọc một tệp UTF-8 hợp lệ làm nội dung tin nhắn của tác nhân.

  </Step>

  <Step title="Nhắm tới một tác nhân hoặc phiên cụ thể">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Phân phối phản hồi tới một kênh">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Cờ

| Cờ                            | Mô tả                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | Tin nhắn nội tuyến cần gửi                                   |
| `--message-file \<path\>`     | Đọc tin nhắn từ một tệp UTF-8 hợp lệ                         |
| `--to \<dest\>`               | Suy ra khóa phiên từ một đích (điện thoại, id trò chuyện)    |
| `--session-key \<key\>`       | Dùng một khóa phiên rõ ràng                                  |
| `--agent \<id\>`              | Nhắm tới một tác nhân đã cấu hình (dùng phiên `main` của nó) |
| `--session-id \<id\>`         | Dùng lại một phiên hiện có theo id                           |
| `--local`                     | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)              |
| `--deliver`                   | Gửi phản hồi tới một kênh trò chuyện                         |
| `--channel \<name\>`          | Kênh phân phối (whatsapp, telegram, discord, slack, v.v.)    |
| `--reply-to \<target\>`       | Ghi đè đích phân phối                                        |
| `--reply-channel \<name\>`    | Ghi đè kênh phân phối                                        |
| `--reply-account \<id\>`      | Ghi đè id tài khoản phân phối                                |
| `--thinking \<level\>`        | Đặt mức suy nghĩ cho hồ sơ mô hình đã chọn                   |
| `--verbose \<on\|full\|off\>` | Đặt mức chi tiết                                             |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của tác nhân                            |
| `--json`                      | Xuất JSON có cấu trúc                                        |

## Hành vi

- Theo mặc định, CLI đi **qua Gateway**. Thêm `--local` để buộc dùng
  runtime nhúng trên máy hiện tại.
- Truyền đúng một trong hai tùy chọn `--message` hoặc `--message-file`. Tin nhắn từ tệp giữ nguyên
  nội dung nhiều dòng sau khi loại bỏ UTF-8 BOM tùy chọn.
- Nếu không thể truy cập Gateway, CLI **quay về** lượt chạy nhúng cục bộ.
- Chọn phiên: `--to` suy ra khóa phiên (đích nhóm/kênh
  giữ nguyên tính tách biệt; trò chuyện trực tiếp gộp về `main`).
- `--session-key` chọn một khóa rõ ràng. Khóa có tiền tố tác nhân phải dùng
  `agent:<agent-id>:<session-key>`, và `--agent` phải khớp id tác nhân đó khi
  cả hai cùng được cung cấp. Khóa trần không phải sentinel được đặt trong phạm vi `--agent` khi
  được cung cấp; ví dụ, `--agent ops --session-key incident-42` định tuyến tới
  `agent:ops:incident-42`. Khi không có `--agent`, khóa trần không phải sentinel được đặt trong phạm vi
  tác nhân mặc định đã cấu hình. Giá trị nguyên văn `global` và `unknown` vẫn
  không có phạm vi chỉ khi không cung cấp `--agent`; trong trường hợp đó, fallback nhúng
  và quyền sở hữu kho lưu trữ dùng tác nhân mặc định đã cấu hình.
- Các cờ suy nghĩ và chi tiết được lưu giữ vào kho phiên.
- Đầu ra: văn bản thuần theo mặc định, hoặc `--json` cho payload + metadata có cấu trúc.
- Với `--json --deliver`, JSON bao gồm trạng thái phân phối cho các lượt gửi
  đã gửi, bị chặn, một phần và thất bại. Xem
  [Trạng thái phân phối JSON](/vi/cli/agent#json-delivery-status).

## Ví dụ

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Tham chiếu CLI của tác nhân" href="/vi/cli/agent" icon="terminal">
    Tham chiếu đầy đủ về cờ và tùy chọn của `openclaw agent`.
  </Card>
  <Card title="Tác nhân phụ" href="/vi/tools/subagents" icon="users">
    Khởi tạo tác nhân phụ chạy nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách khóa phiên hoạt động và cách `--to`, `--agent`, cùng `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh gốc được dùng bên trong phiên tác nhân.
  </Card>
</CardGroup>
