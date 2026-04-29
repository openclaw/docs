---
read_when:
    - Bạn muốn kích hoạt các lần chạy tác nhân từ các tập lệnh hoặc dòng lệnh
    - Bạn cần gửi các phản hồi của tác nhân đến một kênh trò chuyện bằng lập trình
summary: Chạy các lượt tác tử từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Gửi đến tác nhân
x-i18n:
    generated_at: "2026-04-29T23:16:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt tác tử duy nhất từ dòng lệnh mà không cần
tin nhắn trò chuyện đến. Dùng lệnh này cho quy trình có kịch bản, kiểm thử và
phân phối theo chương trình.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt tác tử đơn giản">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Lệnh này gửi tin nhắn qua Gateway và in câu trả lời.

  </Step>

  <Step title="Nhắm đến một tác tử hoặc phiên cụ thể">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Gửi câu trả lời đến một kênh">
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
| `--to \<dest\>`               | Suy ra khóa phiên từ một đích (số điện thoại, chat id)        |
| `--agent \<id\>`              | Nhắm đến một tác tử đã cấu hình (dùng phiên `main` của nó)   |
| `--session-id \<id\>`         | Tái sử dụng một phiên hiện có theo id                        |
| `--local`                     | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)              |
| `--deliver`                   | Gửi câu trả lời đến một kênh trò chuyện                      |
| `--channel \<name\>`          | Kênh gửi (whatsapp, telegram, discord, slack, v.v.)          |
| `--reply-to \<target\>`       | Ghi đè đích gửi                                              |
| `--reply-channel \<name\>`    | Ghi đè kênh gửi                                              |
| `--reply-account \<id\>`      | Ghi đè id tài khoản gửi                                      |
| `--thinking \<level\>`        | Đặt mức suy nghĩ cho hồ sơ mô hình đã chọn                   |
| `--verbose \<on\|full\|off\>` | Đặt mức chi tiết                                             |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của tác tử                              |
| `--json`                      | Xuất JSON có cấu trúc                                        |

## Hành vi

- Theo mặc định, CLI đi **qua Gateway**. Thêm `--local` để buộc dùng runtime
  nhúng trên máy hiện tại.
- Nếu không thể kết nối đến Gateway, CLI **chuyển dự phòng** sang lượt chạy nhúng cục bộ.
- Chọn phiên: `--to` suy ra khóa phiên (đích nhóm/kênh vẫn giữ cô lập; trò chuyện trực tiếp gộp về `main`).
- Các cờ suy nghĩ và chi tiết được lưu vào kho phiên.
- Đầu ra: mặc định là văn bản thuần, hoặc `--json` để nhận payload có cấu trúc + siêu dữ liệu.

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

- [Tham chiếu CLI của tác tử](/vi/cli/agent)
- [Tác tử con](/vi/tools/subagents) — tạo tác tử con chạy nền
- [Phiên](/vi/concepts/session) — cách khóa phiên hoạt động
