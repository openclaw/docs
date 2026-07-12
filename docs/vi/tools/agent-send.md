---
read_when:
    - Bạn muốn kích hoạt các lượt chạy tác nhân từ tập lệnh hoặc dòng lệnh
    - Bạn cần gửi phản hồi của tác tử đến một kênh trò chuyện theo phương thức lập trình
summary: Chạy lượt tác tử từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Gửi tác tử
x-i18n:
    generated_at: "2026-07-12T08:28:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt agent duy nhất từ dòng lệnh mà không cần
tin nhắn trò chuyện đến. Hãy dùng lệnh này cho các quy trình có kịch bản, kiểm thử và
phân phối theo chương trình. Tài liệu tham khảo đầy đủ về cờ và hành vi:
[Tài liệu tham khảo CLI của agent](/vi/cli/agent).

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Gửi tin nhắn qua Gateway và in phản hồi.

  </Step>

  <Step title="Gửi lời nhắc nhiều dòng từ một tệp">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Đọc một tệp UTF-8 hợp lệ làm nội dung tin nhắn của agent.

  </Step>

  <Step title="Nhắm đến một agent hoặc phiên cụ thể">
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

## Các cờ

| Cờ                          | Mô tả                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `--message <text>`          | Tin nhắn nội tuyến cần gửi                                            |
| `--message-file <path>`     | Đọc tin nhắn từ một tệp UTF-8 hợp lệ                                  |
| `--to <dest>`               | Suy ra khóa phiên từ một đích (điện thoại, mã định danh cuộc trò chuyện) |
| `--session-key <key>`       | Sử dụng khóa phiên được chỉ định rõ                                   |
| `--agent <id>`              | Nhắm đến một agent đã cấu hình (sử dụng phiên `main` của agent đó)     |
| `--session-id <id>`         | Sử dụng lại một phiên hiện có theo mã định danh                        |
| `--model <id>`              | Ghi đè mô hình cho lần chạy này (`provider/model` hoặc mã mô hình)     |
| `--local`                   | Buộc sử dụng môi trường chạy nhúng cục bộ (bỏ qua Gateway)             |
| `--deliver`                 | Gửi phản hồi đến một kênh trò chuyện                                   |
| `--channel <name>`          | Kênh phân phối; với `--agent` + `--to`, cũng áp dụng phạm vi tin nhắn riêng |
| `--reply-to <target>`       | Ghi đè đích phân phối                                                  |
| `--reply-channel <name>`    | Ghi đè kênh phân phối                                                  |
| `--reply-account <id>`      | Ghi đè mã định danh tài khoản phân phối                                |
| `--thinking <level>`        | Đặt mức suy luận cho hồ sơ mô hình đã chọn                             |
| `--verbose <on\|full\|off>` | Lưu mức chi tiết cho phiên (`full` cũng ghi nhật ký đầu ra của công cụ) |
| `--timeout <seconds>`       | Ghi đè thời gian chờ của agent (mặc định 600 hoặc giá trị cấu hình)    |
| `--json`                    | Xuất JSON có cấu trúc                                                  |

## Hành vi

- Theo mặc định, CLI chạy **qua Gateway**. Thêm `--local` để buộc sử dụng
  môi trường chạy nhúng trên máy hiện tại.
- Chỉ truyền chính xác một trong hai cờ `--message` hoặc `--message-file`. Tin nhắn từ tệp giữ nguyên
  nội dung nhiều dòng sau khi loại bỏ BOM UTF-8 không bắt buộc.
- Nếu yêu cầu đến Gateway thất bại, CLI **chuyển dự phòng** sang lần chạy nhúng
  cục bộ; khi Gateway hết thời gian chờ, quá trình chuyển dự phòng sử dụng một phiên mới thay vì chạy đua với
  bản chép lời ban đầu.
- Lựa chọn phiên: `--to` suy ra khóa phiên (các đích nhóm/kênh
  duy trì sự cô lập; các cuộc trò chuyện trực tiếp được gộp vào `main`). Khi dùng đồng thời `--agent`,
  `--channel` và `--to`, việc định tuyến tuân theo người nhận chuẩn của kênh
  và `session.dmScope`. Các danh tính ổn định chỉ dùng để gửi đi sử dụng một
  phiên do nhà cung cấp sở hữu, được cô lập với phiên chính của agent.
- `--session-key` chọn một khóa được chỉ định rõ. Các khóa có tiền tố agent phải sử dụng
  `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với mã định danh agent đó khi
  cả hai cùng được cung cấp. Các khóa thuần không phải giá trị canh gác được đặt trong phạm vi `--agent` khi
  có cung cấp; ví dụ, `--agent ops --session-key incident-42` định tuyến đến
  `agent:ops:incident-42`. Nếu không có `--agent`, các khóa thuần không phải giá trị canh gác được đặt trong phạm vi
  agent mặc định đã cấu hình. Các giá trị nguyên văn `global` và `unknown` chỉ giữ
  trạng thái không thuộc phạm vi khi không cung cấp `--agent`; đường dẫn chuyển dự phòng nhúng
  phân giải các phiên canh gác đó thành agent mặc định đã cấu hình.
- `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc phân phối.
- Các cờ mức suy luận và mức chi tiết được lưu vào kho phiên.
- Đầu ra: văn bản thuần theo mặc định hoặc `--json` để nhận tải trọng có cấu trúc cùng siêu dữ liệu.
- Với `--json --deliver`, JSON bao gồm trạng thái phân phối cho các lần gửi
  thành công, bị chặn, một phần và thất bại. Xem
  [Trạng thái phân phối JSON](/vi/cli/agent#json-delivery-status).

## Ví dụ

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

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
  <Card title="Tài liệu tham khảo CLI của agent" href="/vi/cli/agent" icon="terminal">
    Tài liệu tham khảo đầy đủ về các cờ và tùy chọn của `openclaw agent`.
  </Card>
  <Card title="Agent con" href="/vi/tools/subagents" icon="users">
    Khởi tạo agent con trong nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách hoạt động của khóa phiên và cách `--to`, `--agent` cùng `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh gốc được sử dụng bên trong các phiên agent.
  </Card>
</CardGroup>
