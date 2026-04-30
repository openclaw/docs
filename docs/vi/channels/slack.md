---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi thời gian chạy (Chế độ Socket + URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho production đối với DM và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; HTTP Request URLs cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM trên Slack mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và các playbook sửa lỗi.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Create New App](https://api.slack.com/apps/new)**:

        - chọn **from a manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest mẫu](#manifest-and-scope-checklist) bên dưới rồi tiếp tục tạo
        - tạo **App-Level Token** (`xapp-...`) với `connections:write`
        - cài đặt ứng dụng và sao chép **Bot Token** (`xoxb-...`) được hiển thị

      </Step>

      <Step title="Cấu hình OpenClaw">

        Thiết lập SecretRef được khuyến nghị:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Phương án dự phòng bằng biến môi trường (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Create New App](https://api.slack.com/apps/new)**:

        - chọn **from a manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest mẫu](#manifest-and-scope-checklist) và cập nhật URL trước khi tạo
        - lưu **Signing Secret** để xác minh yêu cầu
        - cài đặt ứng dụng và sao chép **Bot Token** (`xoxb-...`) được hiển thị

      </Step>

      <Step title="Cấu hình OpenClaw">

        Thiết lập SecretRef được khuyến nghị:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Dùng đường dẫn Webhook duy nhất cho HTTP nhiều tài khoản

        Gán cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không xung đột.
        </Note>

      </Step>

      <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Tinh chỉnh transport của Socket Mode

Theo mặc định, OpenClaw đặt thời gian chờ pong của client Slack SDK là 15 giây cho Socket Mode. Chỉ ghi đè cài đặt transport khi bạn cần tinh chỉnh riêng theo workspace hoặc host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Chỉ dùng thiết lập này cho các workspace Socket Mode ghi log timeout pong/server-ping websocket của Slack hoặc chạy trên host đã biết có tình trạng starvation vòng lặp sự kiện. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi client ping; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu về độ sống của transport.

## Checklist manifest và phạm vi

Manifest ứng dụng Slack cơ sở giống nhau cho Socket Mode và HTTP Request URLs. Chỉ khối `settings` (và `url` của lệnh slash) là khác.

Manifest cơ sở (mặc định Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Đối với **chế độ HTTP Request URLs**, thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh slash. Cần URL công khai:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Cài đặt manifest bổ sung

Hiển thị các tính năng khác mở rộng những mặc định ở trên.

<AccordionGroup>
  <Accordion title="Lệnh slash gốc tùy chọn">

    Có thể dùng nhiều [lệnh slash gốc](#commands-and-slash-behavior) thay vì một lệnh được cấu hình duy nhất, với một số lưu ý:

    - Dùng `/agentstatus` thay cho `/status` vì lệnh `/status` được dành riêng.
    - Không thể cung cấp quá 25 lệnh slash cùng lúc.

    Thay phần `features.slash_commands` hiện có của bạn bằng một tập con của [các lệnh có sẵn](/vi/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (mặc định)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Dùng cùng danh sách `slash_commands` như Socket Mode ở trên, và thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Phạm vi quyền tác giả tùy chọn (thao tác ghi)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi dùng danh tính agent đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

    Nếu bạn dùng biểu tượng emoji, Slack yêu cầu cú pháp `:emoji_name:`.

  </Accordion>
  <Accordion title="Phạm vi user-token tùy chọn (thao tác đọc)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào thao tác đọc tìm kiếm Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc đối với Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token trong cấu hình ghi đè phương án dự phòng env.
- Phương án dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ có trong cấu hình (không có phương án dự phòng env) và mặc định là hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp trạng thái:

- Việc kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable` hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình thông qua SecretRef
  hoặc một nguồn bí mật không nhúng trực tiếp khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực tế.
- Trong chế độ HTTP, `signingSecretStatus` được bao gồm; trong Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với thao tác/đọc thư mục, token người dùng có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, token bot vẫn được ưu tiên; thao tác ghi bằng token người dùng chỉ được phép khi `userTokenReadOnly: false` và token bot không khả dụng.
</Tip>

## Thao tác và cổng kiểm soát

Các thao tác Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm thao tác có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | -------- |
| messages   | đã bật   |
| reactions  | đã bật   |
| pins       | đã bật   |
| memberInfo | đã bật   |
| emojiList  | đã bật   |

Các thao tác tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack được hiển thị trong phần giữ chỗ tệp đến và trả về bản xem trước hình ảnh đối với hình ảnh hoặc siêu dữ liệu tệp cục bộ đối với các loại tệp khác.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` kiểm soát quyền truy cập DM. `channels.slack.allowFrom` là danh sách cho phép DM chuẩn.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`)
    - `disabled`

    Cờ DM:

    - `dm.enabled` (mặc định true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (cũ)
    - `dm.groupEnabled` (DM nhóm mặc định false)
    - `dm.groupChannels` (danh sách cho phép MPIM tùy chọn)

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` riêng của chúng chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Ghép nối trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm dưới `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn không có (thiết lập chỉ dùng env), runtime sẽ quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Phân giải tên/ID:

    - các mục danh sách cho phép kênh và danh sách cho phép DM được phân giải khi khởi động khi quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - ủy quyền tin nhắn đến và định tuyến kênh mặc định ưu tiên ID; so khớp trực tiếp username/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp dưới `groupPolicy: "allowlist"`. Việc tra cứu kênh mặc định ưu tiên ID, nên khóa dựa trên tên sẽ không bao giờ định tuyến thành công và tất cả tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc để định tuyến và khóa dựa trên tên có vẻ hoạt động.

    Luôn dùng ID kênh Slack làm khóa. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — ID (`C...`) xuất hiện ở cuối URL.

    Đúng:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Sai (bị chặn âm thầm dưới `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Tin nhắn kênh mặc định bị kiểm soát bằng đề cập.

    Nguồn đề cập:

    - đề cập ứng dụng rõ ràng (`<@botId>`)
    - mẫu regex đề cập (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi ngầm định trong luồng trả lời bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo từng kênh (`channels.slack.channels.<id>`; tên chỉ thông qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:` hoặc ký tự đại diện `"*"`
      (khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` thận trọng đối với kênh và kênh riêng tư: tin nhắn phòng do bot viết chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không đáp ứng điều kiện hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng `conversations.members` của Slack; hãy bảo đảm ứng dụng có phạm vi đọc tương ứng cho loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw loại bỏ tin nhắn phòng do bot viết.

  </Tab>
</Tabs>

## Luồng, phiên và thẻ trả lời

- DM định tuyến dưới dạng `direct`; kênh dưới dạng `channel`; MPIM dưới dạng `group`.
- Với `session.dmScope=main` mặc định, DM Slack được gộp vào phiên chính của agent.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- Mặc định của `channels.slack.thread.historyScope` là `thread`; mặc định của `thread.inheritParent` là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn luồng hiện có được lấy khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi là `true`, chặn các đề cập luồng ngầm định để bot chỉ phản hồi các đề cập `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có tùy chọn này, các trả lời trong luồng mà bot đã tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- phương án dự phòng cũ cho cuộc trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` tắt **tất cả** luồng trả lời trong Slack, bao gồm cả thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi thẻ rõ ràng vẫn được tôn trọng trong chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh, còn trả lời Telegram vẫn hiển thị trực tiếp trong dòng.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- phương án dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack mong đợi shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền trực tiếp văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền trực tiếp bản xem trước.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo từng phần.
- `progress`: hiển thị văn bản trạng thái tiến trình trong khi tạo, rồi gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến cập nhật công cụ/tiến trình vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ riêng các tin nhắn công cụ/tiến trình.

`channels.slack.streaming.nativeTransport` kiểm soát truyền trực tiếp văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

- Phải có luồng trả lời để truyền trực tiếp văn bản gốc và trạng thái luồng trợ lý Slack xuất hiện. Việc chọn luồng vẫn tuân theo `replyToMode`.
- Gốc kênh và trò chuyện nhóm vẫn có thể dùng bản xem trước nháp thông thường khi truyền trực tiếp gốc không khả dụng.
- DM Slack cấp cao nhất mặc định nằm ngoài luồng, nên chúng không hiển thị bản xem trước kiểu luồng; hãy dùng trả lời theo luồng hoặc `typingReaction` nếu bạn muốn có tiến trình hiển thị ở đó.
- Phương tiện và payload không phải văn bản quay về cách gửi thông thường.
- Kết quả cuối cùng dạng phương tiện/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối cùng dạng văn bản/khối đủ điều kiện chỉ flush khi chúng có thể chỉnh sửa bản xem trước tại chỗ.
- Nếu truyền trực tiếp thất bại giữa chừng trong một trả lời, OpenClaw quay về cách gửi thông thường cho các payload còn lại.

Dùng bản xem trước nháp thay vì truyền trực tiếp văn bản gốc của Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Khóa cũ:

- `channels.slack.streamMode` (`replace | status_final | append`) được tự động di chuyển sang `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` được tự động di chuyển sang `channels.slack.streaming.mode` và `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` cũ được tự động di chuyển sang `channels.slack.streaming.nativeTransport`.

## Phương án dự phòng phản ứng đang nhập

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi OpenClaw đang xử lý trả lời, rồi xóa phản ứng đó khi lượt chạy kết thúc. Điều này hữu ích nhất bên ngoài trả lời theo luồng, vốn dùng chỉ báo trạng thái "is typing..." mặc định.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack mong đợi shortcode (ví dụ `"hourglass_flowing_sand"`).
- Phản ứng là nỗ lực tối đa và việc dọn dẹp được tự động thử sau khi trả lời hoặc đường dẫn thất bại hoàn tất.

## Phương tiện, chia nhỏ và gửi

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Tệp đính kèm Slack được tải xuống từ URL riêng tư do Slack lưu trữ (luồng yêu cầu được xác thực bằng token) và được ghi vào kho phương tiện khi tải thành công và giới hạn kích thước cho phép. Phần giữ chỗ tệp bao gồm `fileId` của Slack để agent có thể lấy tệp gốc bằng `download-file`.

    Tải xuống dùng thời gian chờ nhàn rỗi và tổng thời gian có giới hạn. Nếu việc truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và quay về phần giữ chỗ tệp.

    Giới hạn kích thước runtime cho tin nhắn đến mặc định là `20MB` trừ khi được ghi đè bởi `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi đi">
    - các đoạn văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật tách theo đoạn văn trước
    - gửi tệp dùng API tải lên của Slack và có thể bao gồm trả lời trong luồng (`thread_ts`)
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, lượt gửi qua kênh dùng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Đích gửi">
    Đích tường minh được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack được mở qua API hội thoại Slack khi gửi tới đích người dùng.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh đã cấu hình hoặc nhiều lệnh native. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định của lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh native yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục thay thế.

- Chế độ tự động của lệnh native được **tắt** cho Slack, nên `commands.native: "auto"` không bật lệnh native của Slack.

```txt
/help
```

Menu đối số native dùng chiến lược hiển thị thích ứng, hiển thị modal xác nhận trước khi dispatch giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: khối nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có trình xử lý tùy chọn tương tác
- vượt giới hạn Slack: giá trị tùy chọn đã mã hóa fallback về nút

```txt
/think
```

Phiên slash dùng khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến các lần thực thi lệnh tới phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Trả lời tương tác

Slack có thể hiển thị điều khiển trả lời tương tác do agent tạo, nhưng tính năng này bị tắt theo mặc định.

Bật trên toàn cục:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Hoặc chỉ bật cho một tài khoản Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Khi được bật, agent có thể phát ra các chỉ thị trả lời chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI dành riêng cho Slack. Các kênh khác không chuyển dịch chỉ thị Slack Block Kit thành hệ thống nút riêng của chúng.
- Giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các khối tương tác được tạo sẽ vượt giới hạn Slack Block Kit, OpenClaw fallback về trả lời văn bản gốc thay vì gửi payload khối không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt native với nút và tương tác, thay vì fallback về Web UI hoặc terminal.

- Phê duyệt exec dùng `channels.slack.execApprovals.*` cho định tuyến DM/kênh native.
- Phê duyệt Plugin vẫn có thể được xử lý qua cùng bề mặt nút Slack-native khi yêu cầu đã đến Slack và loại id phê duyệt là `plugin:`.
- Việc ủy quyền người phê duyệt vẫn được thực thi: chỉ những người dùng được xác định là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Tính năng này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt hiển thị dưới dạng nút Block Kit trực tiếp trong hội thoại.
Khi các nút đó có mặt, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt
qua chat không khả dụng hoặc phê duyệt thủ công là đường duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; fallback về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec native khi `enabled` chưa được đặt hoặc là `"auto"` và ít nhất một
người phê duyệt được phân giải. Đặt `enabled: false` để tắt Slack làm client phê duyệt native một cách tường minh.
Đặt `enabled: true` để ép bật phê duyệt native khi người phê duyệt được phân giải.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack tường minh:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình Slack-native tường minh chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
chọn nhận gửi tới chat gốc:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Chuyển tiếp `approvals.exec` dùng chung là riêng biệt. Chỉ dùng khi lời nhắc phê duyệt exec cũng phải
định tuyến tới các chat khác hoặc đích ngoài luồng tường minh. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; nút Slack-native vẫn có thể xử lý phê duyệt Plugin khi các yêu cầu đó đã đến
Slack.

`/approve` trong cùng chat cũng hoạt động trong các kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Phát tới kênh từ luồng (trả lời luồng "Also send to channel") được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa phản ứng được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời đi, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Metadata chủ đề/mục đích của kênh được coi là ngữ cảnh không đáng tin cậy và có thể được tiêm vào ngữ cảnh định tuyến.
- Trình khởi tạo luồng và gieo ngữ cảnh lịch sử luồng ban đầu được lọc theo allowlist người gửi đã cấu hình khi áp dụng.
- Hành động khối và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động khối: giá trị đã chọn, nhãn, giá trị picker, và metadata `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với metadata kênh đã định tuyến và dữ liệu nhập biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="Trường Slack tín hiệu cao">

- chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (kế thừa: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (break-glass; giữ tắt trừ khi cần)
- truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- luồng/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có trả lời trong kênh">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - allowlist kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên sẽ thất bại âm thầm dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - allowlist `users` theo từng kênh

    Lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Tin nhắn DM bị bỏ qua">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc kế thừa `channels.slack.dm.policy`)
    - phê duyệt ghép đôi / mục allowlist
    - Sự kiện DM của Slack Assistant: log chi tiết nhắc tới `drop message_changed`
      thường có nghĩa là Slack đã gửi một sự kiện luồng Assistant đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong metadata tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode không kết nối">
    Xác thực token bot + ứng dụng và việc bật Socket Mode trong cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không thể phân giải giá trị được SecretRef hậu thuẫn.

  </Accordion>

  <Accordion title="Chế độ HTTP không nhận sự kiện">
    Xác thực:

    - signing secret
    - đường dẫn Webhook
    - URL yêu cầu Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong snapshot
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không thể
    phân giải signing secret được SecretRef hậu thuẫn.

  </Accordion>

  <Accordion title="Lệnh native/slash không kích hoạt">
    Xác minh bạn dự định dùng:

    - chế độ lệnh native (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và allowlist kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt của agent khi tải tệp Slack thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được chuyển qua đường dẫn hiểu phương tiện hoặc trực tiếp tới mô hình trả lời có khả năng vision; các tệp khác được giữ lại làm ngữ cảnh tệp có thể tải xuống thay vì được coi là dữ liệu nhập hình ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện               | Nguồn                | Hành vi hiện tại                                                                 | Ghi chú                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hình ảnh JPEG / PNG / GIF / WebP | URL tệp Slack        | Được tải xuống và đính kèm vào lượt để xử lý có khả năng vision                  | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)            |
| Tệp PDF                        | URL tệp Slack        | Được tải xuống và hiển thị làm ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Slack inbound không tự động chuyển đổi PDF thành dữ liệu nhập image-vision |
| Tệp khác                       | URL tệp Slack        | Được tải xuống khi có thể và hiển thị làm ngữ cảnh tệp                           | Tệp nhị phân không được coi là dữ liệu nhập hình ảnh                      |
| Trả lời luồng                  | Tệp của trình khởi tạo luồng | Tệp tin nhắn gốc có thể được hydrate làm ngữ cảnh khi trả lời không có phương tiện trực tiếp | Trình khởi tạo chỉ có tệp dùng placeholder tệp đính kèm                   |
| Tin nhắn nhiều ảnh             | Nhiều tệp Slack      | Mỗi tệp được đánh giá độc lập                                                     | Xử lý Slack bị giới hạn ở tám tệp mỗi tin nhắn                            |

### Pipeline inbound

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng mã thông báo bot (`xoxb-...`).
2. Tệp được ghi vào kho lưu trữ phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và loại nội dung được thêm vào ngữ cảnh đầu vào.
4. Các đường dẫn mô hình/công cụ có khả năng xử lý hình ảnh có thể dùng tệp đính kèm hình ảnh từ ngữ cảnh đó.
5. Các tệp không phải hình ảnh vẫn có sẵn dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho những công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu chính câu trả lời không có phương tiện trực tiếp và tin nhắn gốc được đưa vào có tệp, Slack có thể bổ sung các tệp gốc làm ngữ cảnh khởi đầu luồng.
- Tệp đính kèm trực tiếp trong câu trả lời được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng một phần giữ chỗ tệp đính kèm để phương án dự phòng vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua quy trình phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý theo thứ tự tệp của Slack trong payload sự kiện.
- Lỗi tải xuống ở một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể cung cấp, URL hết hạn, tệp không truy cập được, tệp quá kích thước và phản hồi HTML xác thực/đăng nhập Slack sẽ bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Mô hình thị giác**: Phân tích hình ảnh dùng mô hình trả lời đang hoạt động khi mô hình đó hỗ trợ thị giác, hoặc mô hình hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Tình huống                               | Hành vi hiện tại                                                             | Cách khắc phục                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack hết hạn                 | Tệp bị bỏ qua; không hiển thị lỗi                                                 | Tải lại tệp lên Slack                                                |
| Chưa cấu hình mô hình thị giác            | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng mô hình trả lời có khả năng thị giác |
| Hình ảnh rất lớn (> 20 MB theo mặc định) | Bị bỏ qua theo giới hạn kích thước                                                         | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                       |
| Tệp đính kèm được chuyển tiếp/chia sẻ           | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo nỗ lực tối đa                       | Chia sẻ lại trực tiếp trong luồng OpenClaw                                   |
| Tệp đính kèm PDF                        | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua thị giác hình ảnh  | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF   |

### Tài liệu liên quan

- [Quy trình hiểu phương tiện](/vi/nodes/media-understanding)
- [Công cụ PDF](/vi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — bật thị giác cho tệp đính kèm Slack
- Kiểm thử hồi quy: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Xác minh trực tiếp: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Liên quan

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Slack với Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/vi/channels/groups">
    Hành vi kênh và DM nhóm.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đầu vào đến agent.
  </Card>
  <Card title="Security" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Configuration" icon="sliders" href="/vi/gateway/configuration">
    Bố cục cấu hình và thứ tự ưu tiên.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/vi/tools/slash-commands">
    Danh mục lệnh và hành vi.
  </Card>
</CardGroup>
