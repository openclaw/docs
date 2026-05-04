---
read_when:
    - Thêm hoặc sửa đổi các hành động CLI cho tin nhắn
    - Thay đổi hành vi kênh gửi đi
summary: Tham chiếu CLI cho `openclaw message` (send + các hành động kênh)
title: Tin nhắn
x-i18n:
    generated_at: "2026-05-04T09:37:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ef57d33c93206a61a6d044667de4faf6340f7d8cc324300f235e838ee3b7ff1
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Lệnh gửi đi duy nhất để gửi tin nhắn và thao tác kênh
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Cách dùng

```
openclaw message <subcommand> [flags]
```

Chọn kênh:

- Bắt buộc có `--channel` nếu cấu hình nhiều hơn một kênh.
- Nếu cấu hình đúng một kênh, kênh đó trở thành mặc định.
- Giá trị: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost yêu cầu Plugin)
- `openclaw message` phân giải kênh đã chọn tới Plugin sở hữu kênh đó khi có `--channel` hoặc một đích có tiền tố kênh; nếu không, nó tải các Plugin kênh đã cấu hình để suy luận kênh mặc định.

Định dạng đích (`--target`):

- WhatsApp: E.164, JID nhóm, hoặc JID WhatsApp Channel/Newsletter (`...@newsletter`)
- Telegram: id cuộc trò chuyện, `@username`, hoặc đích chủ đề diễn đàn (`-1001234567890:topic:42`, hoặc `--thread-id 42`)
- Discord: `channel:<id>` hoặc `user:<id>` (hoặc mention `<@id>`; id số thô được xem là kênh)
- Google Chat: `spaces/<spaceId>` hoặc `users/<userId>`
- Slack: `channel:<id>` hoặc `user:<id>` (chấp nhận id kênh thô)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, hoặc `@username` (id trần được xem là kênh)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, hoặc `username:<name>`/`u:<name>`
- iMessage: định danh, `chat_id:<id>`, `chat_guid:<guid>`, hoặc `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, hoặc `#alias:server`
- Microsoft Teams: id cuộc hội thoại (`19:...@thread.tacv2`) hoặc `conversation:<id>` hoặc `user:<aad-object-id>`

Tra cứu tên:

- Với các nhà cung cấp được hỗ trợ (Discord/Slack/v.v.), tên kênh như `Help` hoặc `#help` được phân giải qua bộ nhớ đệm thư mục.
- Khi không tìm thấy trong bộ nhớ đệm, OpenClaw sẽ thử tra cứu thư mục trực tiếp nếu nhà cung cấp hỗ trợ.

## Cờ thường dùng

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (kênh hoặc người dùng đích cho send/poll/read/v.v.)
- `--targets <name>` (lặp lại; chỉ broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Hành vi SecretRef

- `openclaw message` phân giải các SecretRef kênh được hỗ trợ trước khi chạy thao tác đã chọn.
- Việc phân giải được giới hạn theo đích thao tác đang hoạt động khi có thể:
  - theo phạm vi kênh khi đặt `--channel` (hoặc được suy luận từ các đích có tiền tố như `discord:...`)
  - theo phạm vi tài khoản khi đặt `--account` (biến toàn cục của kênh + các bề mặt tài khoản đã chọn)
  - khi bỏ qua `--account`, OpenClaw không ép phạm vi SecretRef tài khoản `default`
- SecretRef chưa phân giải trên các kênh không liên quan không chặn một thao tác nhắn tin có đích cụ thể.
- Nếu SecretRef của kênh/tài khoản đã chọn chưa được phân giải, lệnh sẽ đóng thất bại cho thao tác đó.

## Thao tác

### Lõi

- `send`
  - Kênh: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Bắt buộc: `--target`, cộng với `--message`, `--media`, hoặc `--presentation`
  - Tùy chọn: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload trình bày dùng chung: `--presentation` gửi các khối ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`) mà lõi kết xuất qua các khả năng đã khai báo của kênh đã chọn. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation).
  - Tùy chọn phân phối chung: `--delivery` chấp nhận các gợi ý phân phối như `{ "pin": true }`; `--pin` là cách viết tắt cho phân phối được ghim khi kênh hỗ trợ.
  - Chỉ Telegram: `--force-document` (gửi ảnh và GIF dưới dạng tài liệu để tránh Telegram nén)
  - Chỉ Telegram: `--thread-id` (id chủ đề diễn đàn)
  - Chỉ Slack: `--thread-id` (dấu thời gian luồng; `--reply-to` dùng cùng trường)
  - Telegram + Discord: `--silent`
  - Chỉ WhatsApp: `--gif-playback`; WhatsApp Channels/Newsletters được định địa chỉ bằng JID `@newsletter` gốc của chúng.

- `poll`
  - Kênh: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Bắt buộc: `--target`, `--poll-question`, `--poll-option` (lặp lại)
  - Tùy chọn: `--poll-multi`
  - Chỉ Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Chỉ Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kênh: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Bắt buộc: `--message-id`, `--target`
  - Tùy chọn: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Lưu ý: `--remove` yêu cầu `--emoji` (bỏ qua `--emoji` để xóa phản ứng của chính bạn ở nơi được hỗ trợ; xem /tools/reactions)
  - Chỉ WhatsApp: `--participant`, `--from-me`
  - Phản ứng nhóm Signal: bắt buộc có `--target-author` hoặc `--target-author-uuid`

- `reactions`
  - Kênh: Discord/Google Chat/Slack/Matrix
  - Bắt buộc: `--message-id`, `--target`
  - Tùy chọn: `--limit`

- `read`
  - Kênh: Discord/Slack/Matrix
  - Bắt buộc: `--target`
  - Tùy chọn: `--limit`, `--message-id`, `--before`, `--after`
  - Chỉ Slack: `--message-id` đọc một dấu thời gian tin nhắn Slack cụ thể; kết hợp với `--thread-id` để đọc một phản hồi luồng chính xác.
  - Chỉ Discord: `--around`

- `edit`
  - Kênh: Discord/Slack/Matrix
  - Bắt buộc: `--message-id`, `--message`, `--target`

- `delete`
  - Kênh: Discord/Slack/Telegram/Matrix
  - Bắt buộc: `--message-id`, `--target`

- `pin` / `unpin`
  - Kênh: Discord/Slack/Matrix
  - Bắt buộc: `--message-id`, `--target`

- `pins` (liệt kê)
  - Kênh: Discord/Slack/Matrix
  - Bắt buộc: `--target`

- `permissions`
  - Kênh: Discord/Matrix
  - Bắt buộc: `--target`
  - Chỉ Matrix: khả dụng khi mã hóa Matrix được bật và các thao tác xác minh được cho phép

- `search`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--query`
  - Tùy chọn: `--channel-id`, `--channel-ids` (lặp lại), `--author-id`, `--author-ids` (lặp lại), `--limit`

### Luồng

- `thread create`
  - Kênh: Discord
  - Bắt buộc: `--thread-name`, `--target` (id kênh)
  - Tùy chọn: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`
  - Tùy chọn: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kênh: Discord
  - Bắt buộc: `--target` (id luồng), `--message`
  - Tùy chọn: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: không có cờ bổ sung

- `emoji upload`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--emoji-name`, `--media`
  - Tùy chọn: `--role-ids` (lặp lại)

### Nhãn dán

- `sticker send`
  - Kênh: Discord
  - Bắt buộc: `--target`, `--sticker-id` (lặp lại)
  - Tùy chọn: `--message`

- `sticker upload`
  - Kênh: Discord
  - Bắt buộc: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Vai trò / Kênh / Thành viên / Thoại

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` cho Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Sự kiện

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Tùy chọn: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Kiểm duyệt (Discord)

- `timeout`: `--guild-id`, `--user-id` (tùy chọn `--duration-min` hoặc `--until`; bỏ qua cả hai để xóa timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` cũng hỗ trợ `--reason`

### Broadcast

- `broadcast`
  - Kênh: bất kỳ kênh đã cấu hình nào; dùng `--channel all` để nhắm tới tất cả nhà cung cấp
  - Bắt buộc: `--targets <target...>`
  - Tùy chọn: `--message`, `--media`, `--dry-run`

## Ví dụ

Gửi một phản hồi Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Gửi tin nhắn với các nút ngữ nghĩa:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Lõi kết xuất cùng payload `presentation` thành các thành phần Discord, khối Slack, nút nội tuyến Telegram, props Mattermost, hoặc thẻ Teams/Feishu tùy theo khả năng của kênh. Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng đầy đủ và quy tắc dự phòng.

Gửi một payload trình bày phong phú hơn:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Tạo một cuộc thăm dò Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Tạo một cuộc thăm dò Telegram (tự động đóng sau 2 phút):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Gửi tin nhắn chủ động Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Tạo một cuộc thăm dò Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Phản ứng trong Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Phản ứng trong một nhóm Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Gửi các nút nội tuyến Telegram qua trình bày chung:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Gửi một thẻ Teams qua trình bày chung:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Gửi ảnh Telegram dưới dạng tài liệu để tránh nén:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Agent send](/vi/tools/agent-send)
