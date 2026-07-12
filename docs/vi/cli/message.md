---
read_when:
    - Thêm hoặc sửa đổi các hành động CLI về tin nhắn
    - Thay đổi hành vi của kênh gửi đi
summary: Tài liệu tham khảo CLI cho `openclaw message` (gửi + thao tác kênh)
title: Tin nhắn
x-i18n:
    generated_at: "2026-07-12T07:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Lệnh gửi đi duy nhất để gửi tin nhắn và thực hiện các thao tác kênh trên
Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams,
Signal, Slack, Telegram và WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Chọn kênh

- `--channel <name>` là bắt buộc nếu có nhiều hơn một kênh được cấu hình; nếu
  chỉ có đúng một kênh được cấu hình, kênh đó sẽ là mặc định.
- Giá trị: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost yêu cầu plugin).
- Đích có tiền tố kênh (ví dụ `discord:channel:123`) sẽ phân giải
  plugin sở hữu mà không cần chỉ định rõ `--channel`.

## Định dạng đích (`-t, --target`)

| Kênh                | Định dạng                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Discord             | `channel:<id>`, `user:<id>`, lượt đề cập `<@id>` hoặc mã số thuần (được coi là mã kênh)                                  |
| Google Chat         | `spaces/<spaceId>` hoặc `users/<userId>`                                                                                 |
| iMessage            | định danh, `chat_id:<id>`, `chat_guid:<guid>` hoặc `chat_identifier:<id>`                                                |
| Mattermost (plugin) | `channel:<id>`, `user:<id>`, `@username` hoặc mã thuần (được coi là một kênh)                                             |
| Matrix              | `@user:server`, `!room:server` hoặc `#alias:server`                                                                       |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), mã cuộc trò chuyện thuần hoặc `user:<aad-object-id>`                        |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` hoặc bất kỳ dạng nào trong số này có tiền tố `signal:` |
| Slack               | `channel:<id>` hoặc `user:<id>` (mã thuần được coi là một kênh)                                                          |
| Telegram            | mã cuộc trò chuyện, `@username` hoặc đích chủ đề diễn đàn: `<chatId>:topic:<topicId>` (hoặc `--thread-id <topicId>`)     |
| WhatsApp            | E.164, JID nhóm (`...@g.us`) hoặc JID Kênh/Bản tin (`...@newsletter`)                                                     |

Tra cứu tên kênh: đối với các nhà cung cấp có danh bạ (Discord/Slack/v.v.), các tên
như `Help` hoặc `#help` được phân giải qua bộ nhớ đệm danh bạ; nếu không tìm thấy
trong bộ nhớ đệm và nhà cung cấp hỗ trợ, hệ thống sẽ chuyển sang tra cứu trực tiếp
trong danh bạ.

## Cờ chung

Mọi thao tác đều chấp nhận: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Các thao tác cần đích cũng chấp nhận
`-t, --target <dest>`.

## Phân giải SecretRef

`openclaw message` phân giải các SecretRef của kênh trước khi chạy thao tác,
với phạm vi hẹp nhất có thể:

- theo phạm vi kênh khi `--channel` được đặt (hoặc được suy ra từ đích có tiền tố)
- theo phạm vi tài khoản khi `--account` cũng được đặt
- tất cả các kênh đã cấu hình khi không đặt cả hai

Các SecretRef chưa phân giải trên những kênh không liên quan không bao giờ chặn
một thao tác có đích cụ thể; SecretRef chưa phân giải trên kênh/tài khoản đã chọn
sẽ khiến thao tác thất bại theo cơ chế đóng an toàn.

## Thao tác

### Cốt lõi

| Thao tác        | Kênh                                                                                                            | Bắt buộc                                                       | Ghi chú                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, cộng với một trong `--message`/`--media`/`--presentation` | Xem [Gửi](#send) bên dưới.                                                                                                                                                                                                                                                                                                                                                     |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (lặp lại)        | Xem [Thăm dò ý kiến](#poll) bên dưới.                                                                                                                                                                                                                                                                                                                                          |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (cần `--emoji`; bỏ qua cờ này để xóa các phản ứng của chính mình khi được hỗ trợ, xem [Phản ứng](/vi/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Phản ứng nhóm Signal yêu cầu `--target-author` hoặc `--target-author-uuid`. Nextcloud Talk chỉ thêm phản ứng; `--remove` gây lỗi. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                                     |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` đọc một dấu thời gian cụ thể; kết hợp với `--thread-id` để đọc chính xác một phản hồi trong luồng.                                                                                                                                                               |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Các luồng diễn đàn Telegram sử dụng `--thread-id`.                                                                                                                                                                                                                                                                                                                            |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                                                                |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` cũng chấp nhận `--pinned-message-id` (Microsoft Teams: mã tài nguyên ghim/liệt kê ghim, không phải mã tin nhắn trò chuyện).                                                                                                                                                                                                                                             |
| `pins` (liệt kê) | Discord, Matrix, Microsoft Teams, Slack                                                                        | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                                     |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: chỉ khả dụng khi mã hóa được bật và các thao tác xác minh được cho phép.                                                                                                                                                                                                                                                                                               |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (lặp lại), `--author-id`, `--author-ids` (lặp lại), `--limit`.                                                                                                                                                                                                                                                                                 |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                                                        |

### Gửi

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: đính kèm hình ảnh/âm thanh/video/tài liệu (đường dẫn cục bộ hoặc
  URL).
- `--presentation <json>`: tải trọng dùng chung với các khối `text`, `context`, `divider`,
  `chart`, `table`, `buttons` và `select`, được kết xuất theo khả năng của từng kênh.
  Xem [Trình bày tin nhắn](/vi/plugins/message-presentation).
- `--delivery <json>`: tùy chọn phân phối chung, ví dụ `{"pin":
true}`. `--pin` là dạng viết tắt để phân phối có ghim khi kênh hỗ trợ
  tính năng này.
- `--reply-to <id>`, `--thread-id <id>` (chủ đề diễn đàn Telegram; dấu thời gian luồng
  Slack, cùng trường với `--reply-to`).
- `--force-document` (Telegram, WhatsApp): gửi hình ảnh/GIF/video dưới dạng
  tài liệu để tránh bị kênh nén.
- `--silent` (Telegram, Discord): gửi mà không có thông báo.
- `--gif-playback` (chỉ WhatsApp): xử lý nội dung video như ảnh GIF phát lại.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack kết xuất trực tiếp các khối biểu đồ được hỗ trợ; các kênh khác nhận cùng
dữ liệu dưới dạng văn bản dễ đọc:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack cũng hiển thị nguyên bản các khối bảng được khai báo rõ ràng. Các kênh khác nhận
chú thích và mọi hàng dưới dạng văn bản có tính xác định:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Các nút Mini App của Telegram sử dụng `webApp` (`web_app` vẫn được phân tích cú pháp cho JSON
cũ) và chỉ hiển thị trong cuộc trò chuyện riêng tư giữa người dùng và bot:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Thăm dò ý kiến

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: lặp lại từ 2 đến 12 lần.
- `--poll-multi`: cho phép chọn nhiều phương án.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Luồng thảo luận

- `thread create`: dành cho kênh Discord. Bắt buộc: `--thread-name`, `--target`
  (ID kênh). Tùy chọn: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: dành cho kênh Discord. Bắt buộc: `--guild-id`. Tùy chọn:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: dành cho kênh Discord. Bắt buộc: `--target` (ID luồng),
  `--message`. Tùy chọn: `--media`, `--reply-to`.

### Biểu tượng cảm xúc

- `emoji list`: Discord (`--guild-id`), Slack (không có cờ bổ sung).
- `emoji upload`: Discord. Bắt buộc: `--guild-id`, `--emoji-name`, `--media`.
  Tùy chọn: `--role-ids` (có thể lặp lại).

### Nhãn dán

- `sticker send`: Discord. Bắt buộc: `--target`, `--sticker-id` (có thể lặp lại).
  Tùy chọn: `--message`.
- `sticker upload`: Discord. Bắt buộc: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Vai trò, kênh, thoại, sự kiện (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: bắt buộc `--guild-id`, `--event-name`, `--start-time`;
  tùy chọn `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Kiểm duyệt (Discord)

- `timeout`: `--guild-id`, `--user-id`; tùy chọn `--duration-min` hoặc
  `--until` (bỏ qua cả hai để xóa thời gian chờ), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Phát rộng

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Gửi một tải trọng đến nhiều đích. `--targets` nhận danh sách
được phân tách bằng dấu cách. Dùng `--channel all` để nhắm đến mọi nhà cung cấp đã cấu hình.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Gửi bằng tác tử](/vi/tools/agent-send)
- [Trình bày tin nhắn](/vi/plugins/message-presentation)
