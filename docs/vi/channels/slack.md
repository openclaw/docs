---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi thời gian chạy (Socket Mode + URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho môi trường sản xuất cho DM và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Chế độ Socket; URL Yêu cầu HTTP cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM Slack mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Chế độ Socket (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Tạo ứng dụng mới](https://api.slack.com/apps/new)**:

        - chọn **từ manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest ví dụ](#manifest-and-scope-checklist) bên dưới rồi tiếp tục tạo
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

        Phương án dự phòng bằng env (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL Yêu cầu HTTP">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Tạo ứng dụng mới](https://api.slack.com/apps/new)**:

        - chọn **từ manifest** và chọn một workspace cho ứng dụng của bạn
        - dán [manifest ví dụ](#manifest-and-scope-checklist) và cập nhật các URL trước khi tạo
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
        Dùng đường dẫn webhook duy nhất cho HTTP nhiều tài khoản

        Cấp cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không xung đột.
        </Note>

      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Tinh chỉnh truyền tải Socket Mode

OpenClaw đặt thời gian chờ pong của máy khách Slack SDK mặc định là 15 giây cho Socket Mode. Chỉ ghi đè cài đặt truyền tải khi bạn cần tinh chỉnh riêng cho workspace hoặc máy chủ:

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

Chỉ dùng tùy chọn này cho các workspace Socket Mode ghi log thời gian chờ pong/server-ping của websocket Slack hoặc chạy trên các máy chủ đã biết có tình trạng vòng lặp sự kiện bị đói tài nguyên. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi ping từ máy khách; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện của ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu về trạng thái sống của truyền tải.

## Danh sách kiểm tra manifest và phạm vi

Manifest cơ sở của ứng dụng Slack giống nhau cho Socket Mode và HTTP Request URLs. Chỉ khối `settings` (và `url` của lệnh slash) khác nhau.

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

Đối với **chế độ HTTP Request URLs**, hãy thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh slash. Bắt buộc phải có URL công khai:

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

Hiển thị các tính năng khác nhau mở rộng các mặc định ở trên.

Manifest mặc định bật thẻ **Home** trong Slack App Home và đăng ký `app_home_opened`. Khi một thành viên workspace mở thẻ Home, OpenClaw xuất bản một chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload hội thoại hoặc cấu hình riêng tư. Thẻ **Messages** vẫn được bật cho DM Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Có thể dùng nhiều [lệnh slash gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với vài điểm cần lưu ý:

    - Dùng `/agentstatus` thay vì `/status` vì lệnh `/status` đã được dành riêng.
    - Không thể cung cấp hơn 25 lệnh slash cùng lúc.

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
        Dùng cùng danh sách `slash_commands` như Socket Mode ở trên và thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

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
  <Accordion title="Optional authorship scopes (write operations)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi sử dụng danh tính tác nhân đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

    Nếu bạn dùng biểu tượng emoji, Slack yêu cầu cú pháp `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào lượt đọc tìm kiếm Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token cấu hình ghi đè dự phòng env.
- Dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ dùng trong cấu hình (không có dự phòng env) và mặc định có hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp nhanh trạng thái:

- Việc kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable` hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình qua SecretRef
  hoặc một nguồn bí mật không nội tuyến khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực.
- Trong chế độ HTTP, `signingSecretStatus` được bao gồm; trong Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với thao tác/lượt đọc thư mục, user token có thể được ưu tiên khi đã cấu hình. Đối với ghi, bot token vẫn được ưu tiên; ghi bằng user-token chỉ được cho phép khi `userTokenReadOnly: false` và bot token không khả dụng.
</Tip>

## Thao tác và cổng kiểm soát

Các thao tác Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm thao tác có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | -------- |
| messages   | bật      |
| reactions  | bật      |
| pins       | bật      |
| memberInfo | bật      |
| emojiList  | bật      |

Các thao tác tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack được hiển thị trong placeholder tệp đến và trả về bản xem trước ảnh cho hình ảnh hoặc metadata tệp cục bộ cho các loại tệp khác.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` kiểm soát quyền truy cập DM. `channels.slack.allowFrom` là allowlist DM chính thức.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`)
    - `disabled`

    Cờ DM:

    - `dm.enabled` (mặc định true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (cũ)
    - `dm.groupEnabled` (DM nhóm mặc định false)
    - `dm.groupChannels` (allowlist MPIM tùy chọn)

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

    Allowlist kênh nằm trong `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn bị thiếu (thiết lập chỉ dùng env), runtime sẽ dự phòng về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Phân giải tên/ID:

    - các mục allowlist kênh và mục allowlist DM được phân giải lúc khởi động khi quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - xác thực đến và định tuyến kênh mặc định ưu tiên ID; khớp trực tiếp theo tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Các khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp trong `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, nên một khóa dựa trên tên sẽ không bao giờ định tuyến thành công và mọi tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc để định tuyến và khóa dựa trên tên có vẻ hoạt động.

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

    Incorrect (bị chặn âm thầm dưới `groupPolicy: "allowlist"`):

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
    Theo mặc định, tin nhắn kênh được kiểm soát bằng lượt nhắc đến.

    Nguồn nhắc đến:

    - lượt nhắc đến ứng dụng rõ ràng (`<@botId>`)
    - lượt nhắc đến nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex nhắc đến (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời ngầm định tới bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo kênh (`channels.slack.channels.<id>`; tên chỉ qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc ký tự đại diện `"*"`
      (các khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` thận trọng đối với kênh và kênh riêng tư: tin nhắn phòng do bot tạo chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không đáp ứng yêu cầu hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng Slack `conversations.members`; hãy bảo đảm ứng dụng có phạm vi đọc phù hợp với loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw bỏ tin nhắn phòng do bot tạo.

  </Tab>
</Tabs>

## Luồng, phiên và thẻ trả lời

- DM định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Liên kết tuyến Slack chấp nhận ID đối tác thô cùng các dạng đích Slack như `channel:C12345678`, `user:U12345678` và `<@U12345678>`.
- Với mặc định `session.dmScope=main`, DM Slack được gộp vào phiên chính của agent.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- Mặc định của `channels.slack.thread.historyScope` là `thread`; mặc định của `thread.inheritParent` là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số tin nhắn luồng hiện có được lấy khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi là `true`, chặn lượt nhắc đến luồng ngầm định để bot chỉ phản hồi các lượt nhắc đến `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng đó. Nếu không có tùy chọn này, các câu trả lời trong luồng mà bot đã tham gia sẽ bỏ qua cơ chế kiểm soát `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- dự phòng cũ cho cuộc trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` tắt **toàn bộ** luồng trả lời trong Slack, bao gồm các thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tôn trọng ở chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh, trong khi trả lời Telegram vẫn hiển thị trực tiếp trong dòng.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi emoji xác nhận trong khi OpenClaw đang xử lý một tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- dự phòng emoji định danh agent (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền trực tuyến văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền trực tuyến bản xem trước trực tiếp.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các cập nhật xem trước theo từng đoạn.
- `progress`: hiển thị văn bản trạng thái tiến độ trong khi tạo, rồi gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản nháp xem trước đang hoạt động, định tuyến cập nhật công cụ/tiến độ vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ các tin nhắn công cụ/tiến độ riêng.
- `streaming.preview.commandText` / `streaming.progress.commandText`: đặt thành `status` để giữ các dòng tiến độ công cụ ngắn gọn trong khi ẩn văn bản lệnh/thực thi thô (mặc định: `raw`).

Ẩn văn bản lệnh/thực thi thô trong khi giữ các dòng tiến độ ngắn gọn:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` kiểm soát truyền trực tuyến văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

- Phải có luồng trả lời để truyền trực tuyến văn bản gốc và trạng thái luồng trợ lý Slack xuất hiện. Việc chọn luồng vẫn tuân theo `replyToMode`.
- Gốc kênh, trò chuyện nhóm và DM cấp cao nhất vẫn có thể dùng bản nháp xem trước thông thường khi truyền trực tuyến gốc không khả dụng hoặc không có luồng trả lời.
- Theo mặc định, DM Slack cấp cao nhất vẫn ở ngoài luồng, nên chúng không hiển thị bản xem trước luồng/trạng thái gốc kiểu luồng của Slack; thay vào đó OpenClaw đăng và chỉnh sửa bản nháp xem trước trong DM.
- Phương tiện và payload không phải văn bản quay về cơ chế gửi thông thường.
- Kết quả cuối cùng dạng phương tiện/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối cùng dạng văn bản/block đủ điều kiện chỉ được xả khi có thể chỉnh sửa trực tiếp bản xem trước.
- Nếu truyền trực tuyến thất bại giữa chừng khi trả lời, OpenClaw quay về cơ chế gửi thông thường cho các payload còn lại.

Dùng bản nháp xem trước thay vì truyền trực tuyến văn bản gốc của Slack:

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

## Dự phòng phản ứng đang nhập

`typingReaction` thêm một reaction tạm thời vào tin nhắn Slack gửi đến trong khi OpenClaw đang xử lý phản hồi, rồi gỡ nó khi lượt chạy kết thúc. Điều này hữu ích nhất bên ngoài các phản hồi trong thread, vốn dùng chỉ báo trạng thái "is typing..." mặc định.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"hourglass_flowing_sand"`).
- Reaction là nỗ lực tối đa và việc dọn dẹp được thử tự động sau khi phản hồi hoặc đường dẫn lỗi hoàn tất.

## Phương tiện, chia đoạn và phân phối

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Tệp đính kèm Slack được tải xuống từ URL riêng do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho phương tiện khi việc fetch thành công và giới hạn kích thước cho phép. Placeholder của tệp bao gồm `fileId` của Slack để agent có thể fetch tệp gốc bằng `download-file`.

    Các lượt tải xuống dùng thời gian chờ nhàn rỗi và tổng thời gian chờ có giới hạn. Nếu việc truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw vẫn tiếp tục xử lý tin nhắn và quay về dùng placeholder của tệp.

    Giới hạn kích thước gửi đến lúc runtime mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - các đoạn văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia theo đoạn văn trước
    - việc gửi tệp dùng API tải lên của Slack và có thể bao gồm phản hồi trong thread (`thread_ts`)
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, lượt gửi qua kênh dùng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Delivery targets">
    Đích rõ ràng được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ có văn bản/block có thể đăng trực tiếp tới ID người dùng; tải tệp lên và gửi trong thread trước tiên mở DM thông qua API cuộc trò chuyện của Slack vì các đường dẫn đó yêu cầu ID cuộc trò chuyện cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh đã cấu hình duy nhất hoặc nhiều lệnh gốc. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định của lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Thay vào đó, lệnh gốc yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động cho lệnh gốc là **tắt** đối với Slack, nên `commands.native: "auto"` không bật lệnh gốc Slack.

```txt
/help
```

Menu đối số gốc dùng chiến lược render thích ứng, hiển thị một modal xác nhận trước khi dispatch giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: block nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có handler tùy chọn tương tác
- vượt giới hạn Slack: giá trị tùy chọn đã mã hóa quay về dùng nút

```txt
/think
```

Phiên slash dùng khóa tách biệt như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến việc thực thi lệnh tới phiên cuộc trò chuyện đích bằng `CommandTargetSessionKey`.

## Phản hồi tương tác

Slack có thể render các điều khiển phản hồi tương tác do agent tạo, nhưng tính năng này bị tắt theo mặc định.

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

Khi được bật, agent có thể phát ra chỉ thị phản hồi chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI riêng của Slack. Các kênh khác không dịch chỉ thị Slack Block Kit thành hệ thống nút riêng của chúng.
- Giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các block tương tác được tạo sẽ vượt giới hạn Slack Block Kit, OpenClaw quay về dùng phản hồi văn bản gốc thay vì gửi payload block không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt gốc với nút và tương tác, thay vì quay về Web UI hoặc terminal.

- Phê duyệt exec dùng `channels.slack.execApprovals.*` cho định tuyến DM/kênh gốc.
- Phê duyệt Plugin vẫn có thể phân giải qua cùng bề mặt nút gốc của Slack khi yêu cầu đã đến Slack và loại approval id là `plugin:`.
- Ủy quyền người phê duyệt vẫn được thực thi: chỉ người dùng được nhận diện là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Tính năng này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt render dưới dạng nút Block Kit trực tiếp trong cuộc trò chuyện.
Khi các nút đó có mặt, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat
không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec gốc khi `enabled` chưa đặt hoặc là `"auto"` và phân giải được ít nhất một
người phê duyệt. Đặt `enabled: false` để tắt Slack một cách rõ ràng với vai trò client phê duyệt gốc.
Đặt `enabled: true` để buộc bật phê duyệt gốc khi phân giải được người phê duyệt.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack rõ ràng:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình gốc Slack rõ ràng chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
chọn phân phối tới chat gốc:

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
định tuyến tới các chat khác hoặc đích ngoài băng rõ ràng. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; nút gốc Slack vẫn có thể phân giải phê duyệt Plugin khi các yêu cầu đó đã đến
Slack.

`/approve` cùng chat cũng hoạt động trong kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Broadcast thread (phản hồi thread "Also send to channel") được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/gỡ reaction được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời, kênh được tạo/đổi tên, và thêm/gỡ ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Metadata chủ đề/mục đích của kênh được coi là ngữ cảnh không đáng tin cậy và có thể được chèn vào ngữ cảnh định tuyến.
- Việc gieo ngữ cảnh người bắt đầu thread và lịch sử thread ban đầu được lọc theo allowlist người gửi đã cấu hình khi áp dụng.
- Hành động block và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động block: giá trị đã chọn, nhãn, giá trị bộ chọn, và metadata `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với metadata kênh đã định tuyến và đầu vào biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- nút bật/tắt tương thích: `dangerouslyAllowNameMatching` (break-glass; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="No replies in channels">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - allowlist kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên âm thầm thất bại dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - allowlist `users` theo từng kênh

    Lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc cấu hình cũ `channels.slack.dm.policy`)
    - phê duyệt ghép nối / mục allowlist
    - Sự kiện DM Slack Assistant: log chi tiết nhắc đến `drop message_changed`
      thường có nghĩa là Slack đã gửi một sự kiện Assistant-thread đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong metadata tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Xác thực token bot + app và việc bật Socket Mode trong cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không thể phân giải giá trị dựa trên SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Xác thực:

    - signing secret
    - đường dẫn Webhook
    - URL yêu cầu Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong snapshot
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không thể
    phân giải signing secret dựa trên SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Xác minh bạn đã định dùng:

    - chế độ lệnh gốc (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và allowlist kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt agent khi tải tệp Slack xuống thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được truyền qua đường dẫn hiểu phương tiện hoặc trực tiếp tới mô hình phản hồi có khả năng vision; các tệp khác được giữ lại dưới dạng ngữ cảnh tệp có thể tải xuống thay vì được coi là đầu vào hình ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện                 | Nguồn                   | Hành vi hiện tại                                                                        | Ghi chú                                                                       |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hình ảnh JPEG / PNG / GIF / WebP | URL tệp Slack          | Được tải xuống và đính kèm vào lượt để xử lý bằng khả năng thị giác                     | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)                 |
| Tệp PDF                        | URL tệp Slack          | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Slack inbound không tự động chuyển đổi PDF thành đầu vào thị giác hình ảnh |
| Tệp khác                       | URL tệp Slack          | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                              | Tệp nhị phân không được xem là đầu vào hình ảnh                               |
| Phản hồi trong luồng           | Tệp của tin nhắn bắt đầu luồng | Tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi phản hồi không có phương tiện trực tiếp | Tin nhắn bắt đầu chỉ có tệp dùng một placeholder tệp đính kèm                          |
| Tin nhắn nhiều hình ảnh         | Nhiều tệp Slack        | Mỗi tệp được đánh giá độc lập                                                        | Quá trình xử lý Slack bị giới hạn ở tám tệp mỗi tin nhắn                     |

### Quy trình inbound

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng token bot (`xoxb-...`).
2. Tệp được ghi vào kho phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và kiểu nội dung được thêm vào ngữ cảnh inbound.
4. Các đường dẫn model/công cụ hỗ trợ hình ảnh có thể dùng tệp đính kèm hình ảnh từ ngữ cảnh đó.
5. Các tệp không phải hình ảnh vẫn khả dụng dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu chính phản hồi không có phương tiện trực tiếp và tin nhắn gốc được bao gồm có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh bắt đầu luồng.
- Tệp đính kèm trực tiếp của phản hồi được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng một placeholder tệp đính kèm để phương án dự phòng vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack duy nhất chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua quy trình phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý theo thứ tự tệp của Slack trong payload sự kiện.
- Lỗi khi tải xuống một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và model

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể phục vụ, URL đã hết hạn, tệp không truy cập được, tệp quá lớn và phản hồi HTML xác thực/đăng nhập Slack sẽ bị bỏ qua thay vì được báo là định dạng không được hỗ trợ.
- **Model thị giác**: Phân tích hình ảnh dùng model phản hồi đang hoạt động khi model đó hỗ trợ thị giác, hoặc model hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Tình huống                              | Hành vi hiện tại                                                             | Cách xử lý                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack đã hết hạn               | Tệp bị bỏ qua; không hiển thị lỗi                                             | Tải lại tệp lên Slack                                                      |
| Chưa cấu hình model thị giác           | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng model phản hồi hỗ trợ thị giác |
| Hình ảnh rất lớn (> 20 MB theo mặc định) | Bị bỏ qua theo giới hạn kích thước                                           | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                       |
| Tệp đính kèm được chuyển tiếp/chia sẻ   | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo nỗ lực tốt nhất | Chia sẻ lại trực tiếp trong luồng OpenClaw                                  |
| Tệp đính kèm PDF                       | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động được định tuyến qua thị giác hình ảnh | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF   |

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
    Hành vi của kênh và DM nhóm.
  </Card>
  <Card title="Channel routing" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn inbound đến agent.
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
