---
read_when:
    - Bạn muốn kích hoạt các lượt chạy tác tử từ các tập lệnh hoặc dòng lệnh
    - Bạn cần gửi phản hồi của tác nhân đến một kênh trò chuyện bằng lập trình
summary: Chạy các lượt tác nhân từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Gửi tới tác tử
x-i18n:
    generated_at: "2026-05-06T09:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt agent duy nhất từ dòng lệnh mà không cần
tin nhắn chat gửi đến. Dùng lệnh này cho các workflow có script, kiểm thử và
phân phối theo chương trình.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Lệnh này gửi tin nhắn qua Gateway và in phản hồi.

  </Step>

  <Step title="Nhắm tới một agent hoặc phiên cụ thể">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Phân phối phản hồi đến một kênh">
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
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Tin nhắn cần gửi (bắt buộc)                                 |
| `--to \<dest\>`               | Suy ra khóa phiên từ một đích (điện thoại, chat id)         |
| `--agent \<id\>`              | Nhắm tới một agent đã cấu hình (dùng phiên `main` của nó)   |
| `--session-id \<id\>`         | Tái sử dụng một phiên hiện có theo id                       |
| `--local`                     | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)             |
| `--deliver`                   | Gửi phản hồi đến một kênh chat                              |
| `--channel \<name\>`          | Kênh phân phối (WhatsApp, Telegram, Discord, Slack, v.v.)   |
| `--reply-to \<target\>`       | Ghi đè đích phân phối                                      |
| `--reply-channel \<name\>`    | Ghi đè kênh phân phối                                      |
| `--reply-account \<id\>`      | Ghi đè id tài khoản phân phối                              |
| `--thinking \<level\>`        | Đặt mức suy nghĩ cho hồ sơ mô hình đã chọn                  |
| `--verbose \<on\|full\|off\>` | Đặt mức chi tiết                                            |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của agent                              |
| `--json`                      | Xuất JSON có cấu trúc                                       |

## Hành vi

- Theo mặc định, CLI đi **qua Gateway**. Thêm `--local` để buộc dùng
  runtime nhúng trên máy hiện tại.
- Nếu không thể kết nối Gateway, CLI **chuyển dự phòng** sang lượt chạy nhúng cục bộ.
- Chọn phiên: `--to` suy ra khóa phiên (đích nhóm/kênh
  giữ nguyên cách ly; chat trực tiếp thu gọn thành `main`).
- Các cờ thinking và verbose được lưu vào kho phiên.
- Đầu ra: mặc định là văn bản thuần, hoặc `--json` để có payload + siêu dữ liệu có cấu trúc.

## Ví dụ

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Tham chiếu CLI của agent" href="/vi/cli/agent" icon="terminal">
    Tham chiếu đầy đủ về cờ và tùy chọn của `openclaw agent`.
  </Card>
  <Card title="Sub-agent" href="/vi/tools/subagents" icon="users">
    Sinh sub-agent trong nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách khóa phiên hoạt động và cách `--to`, `--agent` và `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh slash" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh native được dùng bên trong các phiên agent.
  </Card>
</CardGroup>
