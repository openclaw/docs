---
read_when:
    - Bạn muốn kích hoạt các lượt chạy tác tử từ tập lệnh hoặc dòng lệnh
    - Bạn cần gửi phản hồi của agent đến một kênh trò chuyện bằng chương trình
summary: Chạy các lượt agent từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Agent gửi
x-i18n:
    generated_at: "2026-07-19T06:23:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7928ee5d7d4d6abf1b5580df96d4856cff71a2ffbf7b414fed82dbe7fab5ff5
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt agent duy nhất từ dòng lệnh mà không cần
tin nhắn trò chuyện đầu vào. Sử dụng lệnh này cho các quy trình có tập lệnh, kiểm thử và
phân phối theo chương trình. Tài liệu tham khảo đầy đủ về cờ và hành vi:
[Tài liệu tham khảo CLI Agent](/vi/cli/agent).

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --agent main --message "Thời tiết hôm nay thế nào?"
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
    # Nhắm đến một agent cụ thể
    openclaw agent --agent ops --message "Tóm tắt nhật ký"

    # Nhắm đến một số điện thoại (suy ra khóa phiên)
    openclaw agent --to +15555550123 --message "Cập nhật trạng thái"

    # Tái sử dụng một phiên hiện có
    openclaw agent --session-id abc123 --message "Tiếp tục tác vụ"

    # Nhắm đến một khóa phiên chính xác
    openclaw agent --session-key agent:ops:incident-42 --message "Tóm tắt trạng thái"
    ```

  </Step>

  <Step title="Phân phối phản hồi đến một kênh">
    ```bash
    # Phân phối đến WhatsApp (kênh mặc định)
    openclaw agent --to +15555550123 --message "Báo cáo đã sẵn sàng" --deliver

    # Phân phối đến Slack
    openclaw agent --agent ops --message "Tạo báo cáo" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Các cờ

| Cờ                          | Mô tả                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `--message <text>`          | Tin nhắn nội tuyến cần gửi                                            |
| `--message-file <path>`     | Đọc tin nhắn từ một tệp UTF-8 hợp lệ (tối đa 4 MiB)                  |
| `--to <dest>`               | Suy ra khóa phiên từ một đích (số điện thoại, id cuộc trò chuyện)    |
| `--session-key <key>`       | Sử dụng một khóa phiên rõ ràng                                        |
| `--agent <id>`              | Nhắm đến một agent đã cấu hình (sử dụng phiên `main` của agent đó) |
| `--session-id <id>`         | Tái sử dụng một phiên hiện có theo id                                 |
| `--model <id>`              | Ghi đè mô hình cho lượt chạy này (`provider/model` hoặc id mô hình) |
| `--local`                   | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)                       |
| `--deliver`                 | Gửi phản hồi đến một kênh trò chuyện                                  |
| `--channel <name>`          | Kênh phân phối; khi dùng cùng `--agent` + `--to`, cũng áp dụng phạm vi DM |
| `--reply-to <target>`       | Ghi đè đích phân phối                                                 |
| `--reply-channel <name>`    | Ghi đè kênh phân phối                                                 |
| `--reply-account <id>`      | Ghi đè id tài khoản phân phối                                         |
| `--thinking <level>`        | Đặt mức suy luận cho hồ sơ mô hình đã chọn                            |
| `--verbose <on\|full\|off>` | Duy trì mức chi tiết cho phiên (`full` cũng ghi nhật ký đầu ra của công cụ) |
| `--timeout <seconds>`       | Ghi đè thời gian chờ của agent (mặc định 600 hoặc giá trị cấu hình)   |
| `--json`                    | Xuất JSON có cấu trúc                                                 |

## Hành vi

- Theo mặc định, CLI chạy **qua Gateway**. Thêm `--local` để buộc dùng
  runtime nhúng trên máy hiện tại.
- Chỉ truyền đúng một trong hai `--message` hoặc `--message-file`. Tin nhắn từ tệp giữ nguyên
  nội dung nhiều dòng sau khi loại bỏ BOM UTF-8 không bắt buộc. Các tệp lớn hơn
  4 MiB bị từ chối trước khi gửi đi.
- Nếu yêu cầu Gateway thất bại, CLI **chuyển dự phòng** sang lượt chạy nhúng
  cục bộ; khi Gateway hết thời gian chờ, lượt chạy dự phòng sử dụng một phiên mới thay vì chạy đua với
  bản chép lời ban đầu.
- Lựa chọn phiên: `--to` suy ra khóa phiên (đích nhóm/kênh
  giữ nguyên tính cô lập; cuộc trò chuyện trực tiếp được thu gọn thành `main`). Khi dùng đồng thời `--agent`,
  `--channel` và `--to`, việc định tuyến tuân theo người nhận chuẩn của kênh
  và `session.dmScope`. Các danh tính ổn định chỉ dùng cho đầu ra sử dụng một
  phiên do nhà cung cấp sở hữu, được cô lập với phiên chính của agent.
- `--session-key` chọn một khóa rõ ràng. Các khóa có tiền tố agent phải sử dụng
  `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với id agent đó khi
  cả hai cùng được cung cấp. Các khóa trần không phải sentinel được giới hạn phạm vi vào `--agent` khi
  được cung cấp; ví dụ, `--agent ops --session-key incident-42` định tuyến đến
  `agent:ops:incident-42`. Khi không có `--agent`, các khóa trần không phải sentinel được giới hạn phạm vi
  vào agent mặc định đã cấu hình. Các giá trị nguyên văn `global` và `unknown` chỉ giữ nguyên
  trạng thái không giới hạn phạm vi khi không cung cấp `--agent`; đường dẫn dự phòng nhúng
  phân giải các phiên sentinel đó thành agent mặc định đã cấu hình.
- `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc phân phối.
- Các cờ suy luận và chi tiết được duy trì trong kho phiên.
- Đầu ra: mặc định là văn bản thuần hoặc `--json` để nhận tải trọng có cấu trúc + siêu dữ liệu.
- Khi dùng `--json --deliver`, JSON bao gồm trạng thái phân phối cho các lần gửi
  thành công, bị chặn, một phần và thất bại. Xem
  [Trạng thái phân phối JSON](/vi/cli/agent#json-delivery-status).

## Ví dụ

```bash
# Lượt chạy đơn giản với đầu ra JSON
openclaw agent --to +15555550123 --message "Theo dõi nhật ký" --verbose on --json

# Lượt chạy có ghi đè mô hình
openclaw agent --agent ops --model openai/gpt-5.4 --message "Tóm tắt nhật ký"

# Lượt chạy có mức suy luận
openclaw agent --session-id 1234 --message "Tóm tắt hộp thư đến" --thinking medium

# Lời nhắc nhiều dòng từ một tệp
openclaw agent --agent ops --message-file ./task.md

# Khóa phiên chính xác
openclaw agent --session-key agent:ops:incident-42 --message "Tóm tắt trạng thái"

# Khóa cũ được giới hạn phạm vi vào một agent
openclaw agent --agent ops --session-key incident-42 --message "Tóm tắt trạng thái"

# Phân phối đến một kênh khác với kênh của phiên
openclaw agent --agent ops --message "Cảnh báo" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu tham khảo CLI Agent" href="/vi/cli/agent" icon="terminal">
    Tài liệu tham khảo đầy đủ về cờ và tùy chọn `openclaw agent`.
  </Card>
  <Card title="Agent phụ" href="/vi/tools/subagents" icon="users">
    Khởi tạo agent phụ trong nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách khóa phiên hoạt động và cách `--to`, `--agent` cùng `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh gốc được sử dụng bên trong các phiên agent.
  </Card>
</CardGroup>
