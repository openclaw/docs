---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi thời gian chạy (Socket Mode + URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng dùng trong production cho DM và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; HTTP Request URLs cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Slack DM mặc định dùng chế độ ghép đôi.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa lỗi.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Create New App](https://api.slack.com/apps/new)**:

        - chọn **from a manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest mẫu](#manifest-and-scope-checklist) bên dưới và tiếp tục tạo
        - tạo **App-Level Token** (`xapp-...`) với `connections:write`
        - cài đặt ứng dụng và sao chép **Bot Token** (`xoxb-...`) được hiển thị

      </Step>

      <Step title="Configure OpenClaw">

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

        Phương án dự phòng qua env (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Create New App](https://api.slack.com/apps/new)**:

        - chọn **from a manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest mẫu](#manifest-and-scope-checklist) và cập nhật URL trước khi tạo
        - lưu **Signing Secret** để xác minh yêu cầu
        - cài đặt ứng dụng và sao chép **Bot Token** (`xoxb-...`) được hiển thị

      </Step>

      <Step title="Configure OpenClaw">

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

        Cấp cho mỗi tài khoản một `webhookPath` riêng (mặc định `/slack/events`) để các đăng ký không xung đột.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Tinh chỉnh truyền tải Socket Mode

Theo mặc định, OpenClaw đặt thời gian chờ pong của client Slack SDK là 15 giây cho Socket Mode. Chỉ ghi đè cài đặt truyền tải khi bạn cần tinh chỉnh riêng cho workspace hoặc máy chủ:

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

Chỉ dùng phần này cho các workspace Socket Mode ghi log timeout pong/server-ping websocket của Slack hoặc chạy trên máy chủ đã biết có tình trạng thiếu tài nguyên vòng lặp sự kiện. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi client ping; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu về trạng thái sống của truyền tải.

## Danh sách kiểm tra manifest và scope

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
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

Đối với **chế độ HTTP Request URLs**, thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh slash. Yêu cầu URL công khai:

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
        "app_home_opened",
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

Manifest mặc định bật tab **Home** trong Slack App Home và đăng ký `app_home_opened`. Khi một thành viên workspace mở tab Home, OpenClaw xuất bản một chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload hội thoại hoặc cấu hình riêng tư. Tab **Messages** vẫn được bật cho Slack DM.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Có thể dùng nhiều [lệnh slash gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với một số điểm cần lưu ý:

    - Dùng `/agentstatus` thay cho `/status` vì lệnh `/status` đã được dành riêng.
    - Không thể cung cấp quá 25 lệnh slash cùng lúc.

    Thay phần `features.slash_commands` hiện có của bạn bằng một tập con của [các lệnh có sẵn](/vi/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Dùng cùng danh sách `slash_commands` như Socket Mode ở trên, rồi thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

```json
{
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
  ]
}
```

        Lặp lại giá trị `url` đó trên mọi lệnh trong danh sách.

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
    - `search:read` (nếu bạn phụ thuộc vào lượt đọc tìm kiếm của Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret`, và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token trong cấu hình ghi đè phương án dự phòng env.
- Phương án dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ cấu hình được trong config (không có phương án dự phòng env) và mặc định có hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp nhanh trạng thái:

- Kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable`, hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình qua SecretRef
  hoặc một nguồn bí mật không nhúng trực tiếp khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực tế.
- Ở chế độ HTTP, `signingSecretStatus` được bao gồm; ở Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với thao tác đọc actions/directory, user token có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, bot token vẫn được ưu tiên; thao tác ghi bằng user-token chỉ được phép khi `userTokenReadOnly: false` và bot token không khả dụng.
</Tip>

## Hành động và cổng kiểm soát

Các hành động Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm hành động khả dụng trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | -------- |
| messages   | bật      |
| reactions  | bật      |
| pins       | bật      |
| memberInfo | bật      |
| emojiList  | bật      |

Các hành động tin nhắn Slack hiện tại gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, và `emoji-list`. `download-file` chấp nhận ID tệp Slack hiển thị trong placeholder tệp đến và trả về bản xem trước hình ảnh cho ảnh hoặc siêu dữ liệu tệp cục bộ cho các loại tệp khác.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
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
    - Tài khoản được đặt tên kế thừa `channels.slack.allowFrom` khi `allowFrom` riêng của chúng chưa được đặt.
    - Tài khoản được đặt tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Ghép nối trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm dưới `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa config.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn bị thiếu (thiết lập chỉ dùng env), runtime quay về `groupPolicy="allowlist"` và ghi một cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Phân giải tên/ID:

    - các mục danh sách cho phép kênh và danh sách cho phép DM được phân giải lúc khởi động khi quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - ủy quyền đầu vào và định tuyến kênh mặc định ưu tiên ID; khớp trực tiếp theo tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp dưới `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, nên khóa dựa trên tên sẽ không bao giờ định tuyến thành công và mọi tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc cho định tuyến và một khóa dựa trên tên có vẻ hoạt động.

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

  <Tab title="Lượt nhắc đến và người dùng kênh">
    Tin nhắn kênh mặc định được kiểm soát bằng lượt nhắc đến.

    Nguồn lượt nhắc đến:

    - lượt nhắc đến ứng dụng rõ ràng (`<@botId>`)
    - lượt nhắc đến nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex nhắc đến (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời ngầm đến bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo kênh (`channels.slack.channels.<id>`; tên chỉ thông qua phân giải lúc khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc ký tự đại diện `"*"`
      (khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` thận trọng đối với kênh và kênh riêng tư: tin nhắn phòng do bot viết chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không thỏa mãn điều kiện hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng Slack `conversations.members`; hãy bảo đảm ứng dụng có phạm vi đọc phù hợp cho loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw loại bỏ tin nhắn phòng do bot viết.

  </Tab>
</Tabs>

## Luồng, phiên và thẻ trả lời

- DM định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Ràng buộc tuyến Slack chấp nhận ID peer thô cùng các dạng đích Slack như `channel:C12345678`, `user:U12345678`, và `<@U12345678>`.
- Với `session.dmScope=main` mặc định, DM Slack gộp vào phiên chính của agent.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn luồng hiện có được lấy khi phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi `true`, chặn nhắc đến luồng ngầm để bot chỉ phản hồi các lượt nhắc đến `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có tùy chọn này, các câu trả lời trong luồng có bot tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- phương án dự phòng cũ cho chat trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` tắt **tất cả** luồng trả lời trong Slack, bao gồm cả thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi thẻ rõ ràng vẫn được tôn trọng ở chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh, còn trả lời Telegram vẫn hiển thị nội tuyến.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- phương án dự phòng emoji danh tính agent (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền trực tuyến văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền trực tuyến bản xem trước trực tiếp.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra một phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo khối.
- `progress`: hiển thị văn bản trạng thái tiến trình trong khi tạo, rồi gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến cập nhật công cụ/tiến trình vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ riêng các tin nhắn công cụ/tiến trình.

`channels.slack.streaming.nativeTransport` kiểm soát truyền trực tuyến văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

- Phải có sẵn luồng trả lời để truyền trực tuyến văn bản gốc và trạng thái luồng trợ lý Slack xuất hiện. Việc chọn luồng vẫn theo `replyToMode`.
- Kênh, chat nhóm và gốc DM cấp cao nhất vẫn có thể dùng bản xem trước nháp thông thường khi truyền trực tuyến gốc không khả dụng hoặc không có luồng trả lời.
- DM Slack cấp cao nhất mặc định vẫn ở ngoài luồng, nên chúng không hiển thị bản xem trước luồng/trạng thái gốc kiểu luồng của Slack; thay vào đó OpenClaw đăng và chỉnh sửa bản xem trước nháp trong DM.
- Payload phương tiện và không phải văn bản quay về cách gửi thông thường.
- Kết quả cuối cho phương tiện/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối văn bản/khối đủ điều kiện chỉ flush khi chúng có thể chỉnh sửa bản xem trước tại chỗ.
- Nếu truyền trực tuyến thất bại giữa phản hồi, OpenClaw quay về cách gửi thông thường cho các payload còn lại.

Dùng bản xem trước nháp thay vì truyền trực tuyến văn bản gốc của Slack:

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

## Phương án dự phòng phản ứng nhập

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi OpenClaw đang xử lý câu trả lời, rồi gỡ phản ứng đó khi lượt chạy kết thúc. Điều này hữu ích nhất bên ngoài trả lời theo luồng, vốn dùng chỉ báo trạng thái "is typing..." mặc định.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"hourglass_flowing_sand"`).
- Reaction được thực hiện theo best-effort và việc dọn dẹp được tự động thử sau khi đường dẫn trả lời hoặc lỗi hoàn tất.

## Media, chia nhỏ và gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm đến">
    Tệp đính kèm Slack được tải xuống từ URL riêng do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho media khi fetch thành công và giới hạn kích thước cho phép. Trình giữ chỗ tệp bao gồm Slack `fileId` để agent có thể fetch tệp gốc bằng `download-file`.

    Tải xuống dùng thời gian chờ nhàn rỗi và tổng thời gian có giới hạn. Nếu việc truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và dùng lại trình giữ chỗ tệp.

    Giới hạn kích thước đến khi chạy mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi đi">
    - phần văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia tách ưu tiên đoạn văn
    - gửi tệp dùng API tải lên của Slack và có thể bao gồm trả lời trong thread (`thread_ts`)
    - giới hạn media gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, việc gửi qua kênh dùng các mặc định theo loại MIME từ pipeline media

  </Accordion>

  <Accordion title="Đích gửi">
    Các đích tường minh được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ có văn bản/block có thể đăng trực tiếp tới ID người dùng; tải tệp lên và gửi theo thread sẽ mở DM qua API hội thoại của Slack trước vì các đường dẫn đó cần ID hội thoại cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh đã cấu hình duy nhất hoặc nhiều lệnh gốc. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh gốc yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và thay vào đó được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động của lệnh gốc được **tắt** cho Slack nên `commands.native: "auto"` không bật lệnh gốc của Slack.

```txt
/help
```

Menu đối số gốc dùng chiến lược kết xuất thích ứng, hiển thị modal xác nhận trước khi dispatch giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: block nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có handler tùy chọn interactivity
- vượt giới hạn Slack: giá trị tùy chọn đã mã hóa fallback về nút

```txt
/think
```

Phiên slash dùng khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến thực thi lệnh tới phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Trả lời tương tác

Slack có thể kết xuất điều khiển trả lời tương tác do agent tạo, nhưng tính năng này mặc định bị tắt.

Bật toàn cục:

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

Khi được bật, agent có thể phát ra chỉ thị trả lời chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Những chỉ thị này biên dịch thành Slack Block Kit và định tuyến lượt bấm hoặc lựa chọn ngược qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI riêng cho Slack. Các kênh khác không dịch chỉ thị Slack Block Kit thành hệ thống nút riêng của chúng.
- Giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu block tương tác được tạo vượt giới hạn Slack Block Kit, OpenClaw fallback về trả lời văn bản gốc thay vì gửi payload block không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt gốc với nút và tương tác tương tác, thay vì fallback về Web UI hoặc terminal.

- Phê duyệt exec dùng `channels.slack.execApprovals.*` cho định tuyến DM/kênh gốc.
- Phê duyệt Plugin vẫn có thể được xử lý qua cùng bề mặt nút Slack-gốc khi yêu cầu đã đến Slack và loại approval id là `plugin:`.
- Ủy quyền người phê duyệt vẫn được thực thi: chỉ những người dùng được xác định là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Điều này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt được kết xuất dưới dạng nút Block Kit trực tiếp trong cuộc hội thoại.
Khi có các nút đó, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat
không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; fallback về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và ít nhất một
người phê duyệt được phân giải. Đặt `enabled: false` để tắt rõ ràng Slack với vai trò client phê duyệt gốc.
Đặt `enabled: true` để buộc bật phê duyệt gốc khi người phê duyệt được phân giải.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack tường minh:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình Slack-gốc tường minh chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
chọn tham gia gửi đến chat nguồn:

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

Chuyển tiếp `approvals.exec` dùng chung là riêng biệt. Chỉ dùng nó khi lời nhắc phê duyệt exec cũng phải
định tuyến tới các chat khác hoặc đích ngoài băng tường minh. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; nút Slack-gốc vẫn có thể xử lý phê duyệt Plugin khi các yêu cầu đó đã đến
Slack.

`/approve` cùng chat cũng hoạt động trong các kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Thread broadcast (trả lời thread “Also send to channel”) được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa reaction được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời đi, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Metadata chủ đề/mục đích kênh được xem là ngữ cảnh không đáng tin cậy và có thể được chèn vào ngữ cảnh định tuyến.
- Bộ khởi tạo thread và việc seed ngữ cảnh lịch sử thread ban đầu được lọc theo allowlist người gửi đã cấu hình khi áp dụng.
- Hành động block và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động block: giá trị đã chọn, nhãn, giá trị picker, và metadata `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với metadata kênh đã định tuyến và đầu vào biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="Các trường Slack tín hiệu cao">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (break-glass; để tắt trừ khi cần)
- truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có trả lời trong kênh">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - allowlist kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên sẽ âm thầm thất bại dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
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
    - `channels.slack.dmPolicy` (hoặc legacy `channels.slack.dm.policy`)
    - phê duyệt ghép nối / mục allowlist
    - sự kiện DM Slack Assistant: nhật ký verbose nhắc đến `drop message_changed`
      thường có nghĩa Slack đã gửi một sự kiện thread Assistant đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong metadata tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode không kết nối">
    Xác thực token bot + app và việc bật Socket Mode trong cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không thể phân giải giá trị dựa trên SecretRef.

  </Accordion>

  <Accordion title="Chế độ HTTP không nhận sự kiện">
    Xác thực:

    - signing secret
    - đường dẫn Webhook
    - URL yêu cầu Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong snapshot
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không thể
    phân giải signing secret dựa trên SecretRef.

  </Accordion>

  <Accordion title="Lệnh gốc/slash không kích hoạt">
    Xác minh ý định của bạn là:

    - chế độ lệnh gốc (`channels.slack.commands.native: true`) với các lệnh slash khớp được đăng ký trong Slack
    - hoặc chế độ lệnh slash đơn (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và allowlist kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm media đã tải xuống vào lượt agent khi tải tệp Slack thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được chuyển qua đường dẫn hiểu media hoặc trực tiếp tới model trả lời có khả năng vision; các tệp khác được giữ lại làm ngữ cảnh tệp có thể tải xuống thay vì được xử lý như đầu vào hình ảnh.

### Loại media được hỗ trợ

| Loại phương tiện              | Nguồn                 | Hành vi hiện tại                                                              | Ghi chú                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hình ảnh JPEG / PNG / GIF / WebP | URL tệp Slack        | Được tải xuống và đính kèm vào lượt xử lý để xử lý bằng khả năng thị giác      | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)            |
| Tệp PDF                        | URL tệp Slack        | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Dữ liệu vào từ Slack không tự động chuyển đổi PDF thành đầu vào thị giác hình ảnh |
| Tệp khác                       | URL tệp Slack        | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                   | Tệp nhị phân không được xem là đầu vào hình ảnh                            |
| Trả lời trong luồng            | Tệp của tin nhắn mở đầu luồng | Các tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi câu trả lời không có phương tiện trực tiếp | Tin nhắn mở đầu chỉ có tệp sử dụng trình giữ chỗ tệp đính kèm              |
| Tin nhắn nhiều hình ảnh        | Nhiều tệp Slack      | Mỗi tệp được đánh giá độc lập                                                  | Xử lý Slack được giới hạn ở tám tệp mỗi tin nhắn                           |

### Quy trình dữ liệu vào

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng bot token (`xoxb-...`).
2. Tệp được ghi vào kho lưu trữ phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và kiểu nội dung được thêm vào ngữ cảnh dữ liệu vào.
4. Các đường dẫn model/công cụ có khả năng xử lý hình ảnh có thể dùng tệp đính kèm hình ảnh từ ngữ cảnh đó.
5. Tệp không phải hình ảnh vẫn khả dụng dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu chính câu trả lời không có phương tiện trực tiếp và tin nhắn gốc được bao gồm có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh mở đầu luồng.
- Tệp đính kèm trực tiếp trong câu trả lời được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Một tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng trình giữ chỗ tệp đính kèm để đường fallback vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack duy nhất chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua quy trình phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý theo thứ tự tệp của Slack trong event payload.
- Lỗi tải xuống ở một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và model

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể phục vụ, URL hết hạn, tệp không truy cập được, tệp vượt kích thước và phản hồi HTML xác thực/đăng nhập Slack sẽ bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Model thị giác**: Phân tích hình ảnh dùng model trả lời đang hoạt động khi model đó hỗ trợ thị giác, hoặc model hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Kịch bản                              | Hành vi hiện tại                                                            | Cách xử lý thay thế                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack hết hạn                  | Tệp bị bỏ qua; không hiển thị lỗi                                            | Tải lại tệp lên Slack                                                      |
| Chưa cấu hình model thị giác           | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng model trả lời có khả năng thị giác |
| Hình ảnh rất lớn (> 20 MB theo mặc định) | Bị bỏ qua theo giới hạn kích thước                                           | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                        |
| Tệp đính kèm được chuyển tiếp/chia sẻ  | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo best-effort | Chia sẻ lại trực tiếp trong luồng OpenClaw                                 |
| Tệp đính kèm PDF                      | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua thị giác hình ảnh | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF |

### Tài liệu liên quan

- [Quy trình hiểu phương tiện](/vi/nodes/media-understanding)
- [Công cụ PDF](/vi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Bật khả năng thị giác cho tệp đính kèm Slack
- Kiểm thử hồi quy: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Xác minh trực tiếp: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Liên quan

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Ghép một người dùng Slack với Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/vi/channels/groups">
    Hành vi kênh và DM nhóm.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đến các agent.
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
