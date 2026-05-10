---
read_when:
    - Bạn muốn kích hoạt các lần chạy tác tử từ tập lệnh hoặc dòng lệnh
    - Bạn cần gửi phản hồi của tác nhân đến một kênh trò chuyện bằng chương trình
summary: Chạy các lượt tác tử từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Tác nhân gửi
x-i18n:
    generated_at: "2026-05-10T19:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt agent duy nhất từ dòng lệnh mà không cần
tin nhắn trò chuyện đến. Dùng lệnh này cho các quy trình có kịch bản, kiểm thử và
gửi nội dung theo chương trình.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Lệnh này gửi tin nhắn qua Gateway và in phản hồi.

  </Step>

  <Step title="Nhắm đến một agent hoặc phiên cụ thể">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Gửi phản hồi đến một kênh">
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
| `--message \<text\>`          | Tin nhắn cần gửi (bắt buộc)                                  |
| `--to \<dest\>`               | Suy ra khóa phiên từ một mục tiêu (điện thoại, id trò chuyện) |
| `--agent \<id\>`              | Nhắm đến một agent đã cấu hình (dùng phiên `main` của agent đó) |
| `--session-id \<id\>`         | Tái sử dụng một phiên hiện có theo id                        |
| `--local`                     | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)              |
| `--deliver`                   | Gửi phản hồi đến một kênh trò chuyện                         |
| `--channel \<name\>`          | Kênh gửi (whatsapp, telegram, discord, slack, v.v.)          |
| `--reply-to \<target\>`       | Ghi đè mục tiêu gửi                                          |
| `--reply-channel \<name\>`    | Ghi đè kênh gửi                                              |
| `--reply-account \<id\>`      | Ghi đè id tài khoản gửi                                      |
| `--thinking \<level\>`        | Đặt mức suy luận cho hồ sơ mô hình đã chọn                   |
| `--verbose \<on\|full\|off\>` | Đặt mức chi tiết                                             |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của agent                               |
| `--json`                      | Xuất JSON có cấu trúc                                        |

## Hành vi

- Theo mặc định, CLI đi **qua Gateway**. Thêm `--local` để buộc dùng
  runtime nhúng trên máy hiện tại.
- Nếu không thể truy cập Gateway, CLI **chuyển dự phòng** sang lượt chạy nhúng cục bộ.
- Chọn phiên: `--to` suy ra khóa phiên (mục tiêu nhóm/kênh
  giữ nguyên cách ly; trò chuyện trực tiếp được gộp về `main`).
- Các cờ suy luận và chi tiết được lưu vào kho phiên.
- Đầu ra: mặc định là văn bản thuần, hoặc `--json` để có payload + siêu dữ liệu có cấu trúc.
- Với `--json --deliver`, JSON bao gồm trạng thái gửi cho các lượt gửi đã gửi,
  bị chặn, một phần và thất bại. Xem
  [trạng thái gửi JSON](/vi/cli/agent#json-delivery-status).

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
  <Card title="Tham chiếu CLI cho agent" href="/vi/cli/agent" icon="terminal">
    Tham chiếu đầy đủ về cờ và tùy chọn của `openclaw agent`.
  </Card>
  <Card title="Agent phụ" href="/vi/tools/subagents" icon="users">
    Khởi tạo agent phụ chạy nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách khóa phiên hoạt động và cách `--to`, `--agent`, và `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh dấu gạch chéo" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh gốc được dùng bên trong các phiên agent.
  </Card>
</CardGroup>
