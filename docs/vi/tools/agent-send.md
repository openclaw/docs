---
read_when:
    - Bạn muốn kích hoạt các lượt chạy agent từ tập lệnh hoặc dòng lệnh
    - Bạn cần phân phối phản hồi của agent đến một kênh trò chuyện bằng chương trình
summary: Chạy các lượt tác nhân từ CLI và tùy chọn gửi phản hồi đến các kênh
title: Gửi tác nhân
x-i18n:
    generated_at: "2026-07-21T13:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad3da0feea102725ebb5555e0dd375ed6f3a0396d8ffd0ab916ced303201eabc
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` chạy một lượt agent duy nhất từ dòng lệnh mà không cần tin nhắn trò chuyện đến. Dùng lệnh này cho các quy trình có tập lệnh, kiểm thử và gửi theo chương trình. Tham khảo đầy đủ về cờ và hành vi:
[Tài liệu tham khảo CLI agent](/vi/cli/agent).

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --agent main --message "Thời tiết hôm nay thế nào?"
    ```

    Gửi tin nhắn qua Gateway và in phản hồi.

  </Step>

  <Step title="Gửi prompt nhiều dòng từ một tệp">
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

  <Step title="Gửi phản hồi đến một kênh">
    ```bash
    # Gửi đến WhatsApp (kênh mặc định)
    openclaw agent --to +15555550123 --message "Báo cáo đã sẵn sàng" --deliver

    # Gửi đến Slack
    openclaw agent --agent ops --message "Tạo báo cáo" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Các cờ

| Cờ                          | Mô tả                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `--message <text>`          | Tin nhắn nội tuyến cần gửi                                            |
| `--message-file <path>`          | Đọc tin nhắn từ một tệp UTF-8 hợp lệ (tối đa 4 MiB)                  |
| `--to <dest>`          | Suy ra khóa phiên từ một đích (điện thoại, id cuộc trò chuyện)       |
| `--session-key <key>`          | Dùng một khóa phiên tường minh                                        |
| `--agent <id>`          | Nhắm đến một agent đã cấu hình (dùng phiên `main` của agent đó) |
| `--session-id <id>`          | Tái sử dụng một phiên hiện có theo id                                 |
| `--model <id>`          | Ghi đè mô hình cho lượt chạy này (`provider/model` hoặc id mô hình) |
| `--local`          | Buộc dùng runtime nhúng cục bộ (bỏ qua Gateway)                       |
| `--deliver`          | Gửi phản hồi đến một kênh trò chuyện                                  |
| `--channel <name>`          | Kênh gửi; khi dùng cùng `--agent` + `--to`, cũng áp dụng phạm vi DM |
| `--reply-to <target>`          | Ghi đè đích gửi                                                       |
| `--reply-channel <name>`          | Ghi đè kênh gửi                                                       |
| `--reply-account <id>`          | Ghi đè id tài khoản gửi                                               |
| `--thinking <level>`          | Đặt mức suy luận cho hồ sơ mô hình đã chọn                            |
| `--verbose <on\|full\|off>`          | Duy trì mức chi tiết cho phiên (`full` cũng ghi nhật ký đầu ra của công cụ) |
| `--timeout <seconds>`          | Ghi đè thời gian chờ của agent (mặc định 600 hoặc giá trị cấu hình)  |
| `--json`          | Xuất JSON có cấu trúc                                                 |

## Hành vi

- Theo mặc định, CLI đi **qua Gateway**. Thêm `--local` để buộc dùng
  runtime nhúng trên máy hiện tại.
- Truyền chính xác một trong `--message` hoặc `--message-file`. Tin nhắn từ tệp giữ nguyên
  nội dung nhiều dòng sau khi loại bỏ BOM UTF-8 tùy chọn. Các tệp lớn hơn
  4 MiB bị từ chối trước khi điều phối.
- Sau các lần thử lại bắt tay do lỗi tạm thời, thời gian chờ Gateway hoặc kết nối bị đóng
  sẽ khiến lệnh thất bại kèm gợi ý trên stderr; CLI không bao giờ âm thầm chạy lại lượt đó
  bằng runtime nhúng. Gateway vẫn có thể hoàn tất một lượt đã chấp nhận, vì vậy hãy xác minh trạng thái
  Gateway và phiên trước khi thử lại hoặc chạy lại với `--local`.
- Chọn phiên: `--to` suy ra khóa phiên (đích nhóm/kênh
  duy trì sự cô lập; cuộc trò chuyện trực tiếp thu gọn thành `main`). Khi dùng đồng thời `--agent`,
  `--channel` và `--to`, việc định tuyến tuân theo người nhận chuẩn của kênh
  và `session.dmScope`. Các danh tính ổn định chỉ dùng cho gửi đi sử dụng một
  phiên do nhà cung cấp sở hữu, được cô lập khỏi phiên chính của agent.
- `--session-key` chọn một khóa tường minh. Các khóa có tiền tố agent phải dùng
  `agent:<agent-id>:<session-key>`, và `--agent` phải khớp với id agent đó khi
  cả hai đều được cung cấp. Các khóa trần không phải sentinel được giới hạn phạm vi theo `--agent` khi
  được cung cấp; ví dụ, `--agent ops --session-key incident-42` định tuyến đến
  `agent:ops:incident-42`. Khi không có `--agent`, các khóa trần không phải sentinel được giới hạn phạm vi
  theo agent mặc định đã cấu hình. Các giá trị nguyên văn `global` và `unknown` chỉ
  không bị giới hạn phạm vi khi không cung cấp `--agent`.
- `--reply-channel` và `--reply-account` chỉ ảnh hưởng đến việc gửi.
- Các cờ suy luận và chi tiết được duy trì trong kho phiên.
- Đầu ra: văn bản thuần theo mặc định hoặc `--json` để nhận payload có cấu trúc + siêu dữ liệu.
- Với `--json --deliver`, JSON bao gồm trạng thái gửi cho các lần gửi
  thành công, bị chặn, một phần và thất bại. Xem
  [Trạng thái gửi JSON](/vi/cli/agent#json-delivery-status).

## Ví dụ

```bash
# Lượt đơn giản với đầu ra JSON
openclaw agent --to +15555550123 --message "Theo dõi nhật ký" --verbose on --json

# Lượt chạy với mô hình được ghi đè
openclaw agent --agent ops --model openai/gpt-5.4 --message "Tóm tắt nhật ký"

# Lượt chạy với mức suy luận
openclaw agent --session-id 1234 --message "Tóm tắt hộp thư đến" --thinking medium

# Prompt nhiều dòng từ một tệp
openclaw agent --agent ops --message-file ./task.md

# Khóa phiên chính xác
openclaw agent --session-key agent:ops:incident-42 --message "Tóm tắt trạng thái"

# Khóa cũ được giới hạn phạm vi theo một agent
openclaw agent --agent ops --session-key incident-42 --message "Tóm tắt trạng thái"

# Gửi đến một kênh khác với kênh của phiên
openclaw agent --agent ops --message "Cảnh báo" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu tham khảo CLI agent" href="/vi/cli/agent" icon="terminal">
    Tài liệu tham khảo đầy đủ về cờ và tùy chọn `openclaw agent`.
  </Card>
  <Card title="Agent con" href="/vi/tools/subagents" icon="users">
    Khởi tạo agent con trong nền.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Cách hoạt động của khóa phiên và cách `--to`, `--agent` cùng `--session-id` phân giải chúng.
  </Card>
  <Card title="Lệnh dấu gạch chéo" href="/vi/tools/slash-commands" icon="slash">
    Danh mục lệnh gốc được dùng bên trong các phiên agent.
  </Card>
</CardGroup>
