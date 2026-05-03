---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi khi chạy (Chế độ Socket + URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T21:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d902fbbad23cee9b3f0ab7d240845b7b229e2d2507c5ea1d1a0fa3baa915d80a
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho production cho tin nhắn trực tiếp và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Chế độ Socket; URL yêu cầu HTTP cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp Slack mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và quy trình sửa chữa.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Chế độ Socket (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Tạo ứng dụng mới](https://api.slack.com/apps/new)**:

        - chọn **từ manifest** và chọn một không gian làm việc cho ứng dụng của bạn
        - dán [manifest ví dụ](#manifest-and-scope-checklist) bên dưới và tiếp tục để tạo
        - tạo **Token cấp ứng dụng** (`xapp-...`) với `connections:write`
        - cài đặt ứng dụng và sao chép **Token bot** (`xoxb-...`) được hiển thị

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

  <Tab title="URL yêu cầu HTTP">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Trong phần cài đặt ứng dụng Slack, nhấn nút **[Tạo ứng dụng mới](https://api.slack.com/apps/new)**:

        - chọn **từ manifest** và chọn một không gian làm việc cho ứng dụng của bạn
        - dán [manifest ví dụ](#manifest-and-scope-checklist) và cập nhật URL trước khi tạo
        - lưu **Bí mật ký** để xác minh yêu cầu
        - cài đặt ứng dụng và sao chép **Token bot** (`xoxb-...`) được hiển thị

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
        Sử dụng đường dẫn Webhook riêng cho HTTP nhiều tài khoản

        Cấp cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không xung đột.
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

## Tinh chỉnh truyền tải Chế độ Socket

Với Chế độ Socket, OpenClaw đặt thời gian chờ pong của ứng dụng khách SDK Slack mặc định là 15 giây. Chỉ ghi đè cài đặt truyền tải khi bạn cần tinh chỉnh riêng cho không gian làm việc hoặc máy chủ:

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

Chỉ dùng phần này cho các không gian làm việc dùng Chế độ Socket ghi nhận thời gian chờ pong/server-ping của websocket Slack hoặc chạy trên máy chủ có tình trạng thiếu thời gian xử lý vòng lặp sự kiện đã biết. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi ping từ ứng dụng khách; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn ứng dụng và sự kiện vẫn là trạng thái ứng dụng, không phải tín hiệu kiểm tra trạng thái hoạt động của lớp truyền tải.

## Danh sách kiểm tra manifest và phạm vi

Manifest ứng dụng Slack cơ sở giống nhau cho Chế độ Socket và URL yêu cầu HTTP. Chỉ khối `settings` (và trường `url` của lệnh gạch chéo) là khác nhau.

Manifest cơ sở (mặc định là Chế độ Socket):

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

Đối với **chế độ URL yêu cầu HTTP**, hãy thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh gạch chéo. Yêu cầu URL công khai:

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

Bật các tính năng khác mở rộng các mặc định ở trên.

Manifest mặc định bật tab **Home** của Slack App Home và đăng ký `app_home_opened`. Khi một thành viên không gian làm việc mở tab Home, OpenClaw xuất bản chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload hội thoại hay cấu hình riêng tư. Tab **Messages** vẫn được bật cho tin nhắn trực tiếp Slack.

<AccordionGroup>
  <Accordion title="Lệnh gạch chéo gốc tùy chọn">

    Có thể dùng nhiều [lệnh gạch chéo gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với vài điểm cần lưu ý:

    - Dùng `/agentstatus` thay vì `/status` vì lệnh `/status` đã được giữ riêng.
    - Không thể cung cấp quá 25 lệnh gạch chéo cùng lúc.

    Thay phần `features.slash_commands` hiện có bằng một tập con của [các lệnh có sẵn](/vi/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Chế độ Socket (mặc định)">

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
```

      </Tab>
      <Tab title="URL yêu cầu HTTP">
        Dùng cùng danh sách `slash_commands` như Chế độ Socket ở trên và thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

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
  <Accordion title="Optional authorship scopes (write operations)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi sử dụng danh tính tác tử đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

    Nếu bạn dùng biểu tượng emoji, Slack yêu cầu cú pháp `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc thông thường là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào thao tác đọc tìm kiếm của Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token trong cấu hình ghi đè phương án dự phòng từ env.
- Phương án dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ cấu hình được trong config (không có phương án dự phòng env) và mặc định có hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp nhanh trạng thái:

- Kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable`, hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình thông qua SecretRef
  hoặc nguồn bí mật không nội tuyến khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực tế.
- Ở chế độ HTTP, `signingSecretStatus` được bao gồm; trong Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với các action/thao tác đọc thư mục, user token có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, bot token vẫn được ưu tiên; thao tác ghi bằng user-token chỉ được phép khi `userTokenReadOnly: false` và bot token không khả dụng.
</Tip>

## Action và cổng kiểm soát

Các action Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm action khả dụng trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | -------- |
| messages   | đã bật   |
| reactions  | đã bật   |
| pins       | đã bật   |
| memberInfo | đã bật   |
| emojiList  | đã bật   |

Các action tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack hiển thị trong placeholder tệp đến và trả về bản xem trước ảnh đối với ảnh hoặc siêu dữ liệu tệp cục bộ đối với các loại tệp khác.

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

    Ghép đôi trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm trong `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn bị thiếu (thiết lập chỉ env), runtime dự phòng về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Phân giải tên/ID:

    - các mục danh sách cho phép kênh và danh sách cho phép DM được phân giải khi khởi động khi quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - xác thực đầu vào và định tuyến kênh mặc định ưu tiên ID; so khớp trực tiếp theo tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Các khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp trong `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, nên khóa dựa trên tên sẽ không bao giờ định tuyến thành công và tất cả tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc để định tuyến và khóa dựa trên tên có vẻ hoạt động.

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

    Sai (bị chặn âm thầm trong `groupPolicy: "allowlist"`):

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
    Tin nhắn kênh mặc định bị cổng mention kiểm soát.

    Nguồn mention:

    - mention ứng dụng rõ ràng (`<@botId>`)
    - mention nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex mention (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời ngầm định tới bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo kênh (`channels.slack.channels.<id>`; tên chỉ qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc ký tự đại diện `"*"`
      (khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` thận trọng đối với kênh và kênh riêng tư: tin nhắn phòng do bot viết chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không thỏa mãn sự hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng `conversations.members` của Slack; hãy đảm bảo ứng dụng có phạm vi đọc khớp với loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw loại bỏ tin nhắn phòng do bot viết.

  </Tab>
</Tabs>

## Luồng, phiên và thẻ trả lời

- DM định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Ràng buộc tuyến Slack chấp nhận ID peer thô cộng với các dạng mục tiêu Slack như `channel:C12345678`, `user:U12345678` và `<@U12345678>`.
- Với `session.dmScope=main` mặc định, DM Slack được gộp vào phiên chính của tác tử.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn luồng hiện có được tải khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi là `true`, chặn mention luồng ngầm định để bot chỉ phản hồi các mention `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có tùy chọn này, các trả lời trong luồng mà bot đã tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- dự phòng cũ cho trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Thẻ trả lời thủ công được hỗ trợ:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` tắt **tất cả** luồng trả lời trong Slack, bao gồm các thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tôn trọng ở chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh trong khi trả lời Telegram vẫn hiển thị nội tuyến.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- phương án dự phòng emoji danh tính tác tử (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền phát văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền phát xem trước trực tiếp.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: thêm các bản cập nhật xem trước theo từng khúc.
- `progress`: hiển thị văn bản trạng thái tiến độ trong khi tạo, rồi gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến các bản cập nhật công cụ/tiến độ vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ riêng các tin nhắn công cụ/tiến độ.

`channels.slack.streaming.nativeTransport` kiểm soát truyền phát văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

- Phải có sẵn luồng trả lời để truyền phát văn bản gốc và trạng thái luồng trợ lý Slack xuất hiện. Việc chọn luồng vẫn tuân theo `replyToMode`.
- Kênh, trò chuyện nhóm và gốc DM cấp cao nhất vẫn có thể dùng bản xem trước nháp thông thường khi truyền phát gốc không khả dụng hoặc không tồn tại luồng trả lời.
- DM Slack cấp cao nhất mặc định nằm ngoài luồng, nên chúng không hiển thị bản xem trước truyền phát/trạng thái gốc kiểu luồng của Slack; thay vào đó OpenClaw đăng và chỉnh sửa bản xem trước nháp trong DM.
- Nội dung media và payload không phải văn bản dự phòng về cách gửi thông thường.
- Kết quả cuối media/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối văn bản/block đủ điều kiện chỉ flush khi có thể chỉnh sửa bản xem trước tại chỗ.
- Nếu truyền phát thất bại giữa chừng trong câu trả lời, OpenClaw dự phòng về cách gửi thông thường cho các payload còn lại.

Dùng bản xem trước nháp thay vì truyền phát văn bản gốc của Slack:

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

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi OpenClaw đang xử lý câu trả lời, rồi xóa phản ứng đó khi lượt chạy kết thúc. Điều này hữu ích nhất bên ngoài trả lời trong luồng, vốn dùng chỉ báo trạng thái "đang nhập..." mặc định.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"hourglass_flowing_sand"`).
- Reaction là nỗ lực tốt nhất và việc dọn dẹp được tự động thử sau khi đường dẫn trả lời hoặc lỗi hoàn tất.

## Phương tiện, chia đoạn và phân phối

<AccordionGroup>
  <Accordion title="Tệp đính kèm đến">
    Các tệp đính kèm Slack được tải xuống từ URL riêng do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho phương tiện khi tìm nạp thành công và giới hạn kích thước cho phép. Placeholder tệp bao gồm Slack `fileId` để agent có thể tìm nạp tệp gốc bằng `download-file`.

    Tải xuống sử dụng timeout nhàn rỗi và tổng thời gian có giới hạn. Nếu việc truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và quay về placeholder tệp.

    Giới hạn kích thước đến lúc runtime mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi đi">
    - các đoạn văn bản sử dụng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia tách ưu tiên đoạn văn
    - gửi tệp sử dụng API tải lên của Slack và có thể bao gồm trả lời trong luồng (`thread_ts`)
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, lượt gửi kênh sử dụng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Đích phân phối">
    Các đích tường minh được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ văn bản/block có thể đăng trực tiếp tới ID người dùng; tải tệp lên và gửi trong luồng mở DM qua API hội thoại Slack trước vì các đường dẫn đó yêu cầu một ID hội thoại cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh được cấu hình duy nhất hoặc nhiều lệnh native. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh native yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và thay vào đó được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động của lệnh native được **tắt** cho Slack, nên `commands.native: "auto"` không bật lệnh native Slack.

```txt
/help
```

Menu đối số native sử dụng chiến lược kết xuất thích ứng, hiển thị modal xác nhận trước khi điều phối giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: block nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có trình xử lý tùy chọn tương tác
- vượt giới hạn Slack: giá trị tùy chọn đã mã hóa quay về nút

```txt
/think
```

Phiên slash sử dụng các khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến thực thi lệnh tới phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Trả lời tương tác

Slack có thể kết xuất các điều khiển trả lời tương tác do agent tạo, nhưng tính năng này mặc định bị tắt.

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

Khi được bật, agent có thể phát các chỉ thị trả lời chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI riêng của Slack. Các kênh khác không dịch chỉ thị Slack Block Kit sang hệ thống nút riêng của chúng.
- Giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các block tương tác được tạo sẽ vượt giới hạn Slack Block Kit, OpenClaw quay về trả lời văn bản gốc thay vì gửi payload block không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt native với nút và tương tác, thay vì quay về Web UI hoặc terminal.

- Phê duyệt exec sử dụng `channels.slack.execApprovals.*` cho định tuyến DM/kênh native.
- Phê duyệt Plugin vẫn có thể xử lý qua cùng bề mặt nút native của Slack khi yêu cầu đã đến Slack và loại ID phê duyệt là `plugin:`.
- Ủy quyền người phê duyệt vẫn được thực thi: chỉ người dùng được xác định là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Việc này sử dụng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt kết xuất trực tiếp trong hội thoại dưới dạng nút Block Kit.
Khi các nút đó hiện diện, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt
qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec native khi `enabled` chưa được đặt hoặc là `"auto"` và ít nhất một
người phê duyệt được phân giải. Đặt `enabled: false` để tắt Slack như một client phê duyệt native một cách tường minh.
Đặt `enabled: true` để buộc bật phê duyệt native khi người phê duyệt được phân giải.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack tường minh:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình native Slack tường minh chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
chọn phân phối tới chat nguồn:

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
định tuyến tới chat khác hoặc đích ngoài băng tường minh. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; nút native Slack vẫn có thể xử lý phê duyệt Plugin khi các yêu cầu đó đã đến
Slack.

`/approve` cùng chat cũng hoạt động trong các kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Phát sóng luồng (trả lời luồng "Also send to channel") được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa reaction được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời đi, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Metadata chủ đề/mục đích của kênh được xem là ngữ cảnh không đáng tin cậy và có thể được tiêm vào ngữ cảnh định tuyến.
- Việc gieo ngữ cảnh người bắt đầu luồng và lịch sử luồng ban đầu được lọc theo allowlist người gửi đã cấu hình khi áp dụng.
- Hành động block và tương tác modal phát sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động block: giá trị đã chọn, nhãn, giá trị bộ chọn, và metadata `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với metadata kênh đã định tuyến và đầu vào biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="Các trường Slack có tín hiệu cao">

- chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (phá kính khẩn cấp; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- luồng/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có trả lời trong kênh">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - allowlist kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên âm thầm thất bại dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - allowlist `users` theo từng kênh

    Các lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Tin nhắn DM bị bỏ qua">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc `channels.slack.dm.policy` cũ)
    - phê duyệt ghép đôi / mục allowlist
    - Sự kiện DM Slack Assistant: log chi tiết nhắc đến `drop message_changed`
      thường có nghĩa là Slack đã gửi sự kiện luồng Assistant đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong metadata tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode không kết nối">
    Xác thực bot + token ứng dụng và việc bật Socket Mode trong cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được cấu hình
    nhưng runtime hiện tại không thể phân giải giá trị dựa trên SecretRef.

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

  <Accordion title="Lệnh native/slash không kích hoạt">
    Xác minh bạn dự định dùng:

    - chế độ lệnh native (`channels.slack.commands.native: true`) với các lệnh slash khớp đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và allowlist kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt agent khi tải tệp Slack xuống thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được truyền qua đường dẫn hiểu phương tiện hoặc trực tiếp tới mô hình trả lời có khả năng vision; các tệp khác được giữ lại làm ngữ cảnh tệp có thể tải xuống thay vì được xử lý như đầu vào hình ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện               | Nguồn                | Hành vi hiện tại                                                                 | Ghi chú                                                                    |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hình ảnh JPEG / PNG / GIF / WebP | URL tệp Slack       | Được tải xuống và đính kèm vào lượt để xử lý bằng khả năng thị giác               | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)             |
| Tệp PDF                        | URL tệp Slack        | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Slack inbound không tự động chuyển PDF thành đầu vào thị giác hình ảnh |
| Tệp khác                       | URL tệp Slack        | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                      | Tệp nhị phân không được xem là đầu vào hình ảnh                            |
| Trả lời trong luồng            | Tệp của tin nhắn khởi tạo luồng | Tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi phản hồi không có phương tiện trực tiếp | Tin nhắn khởi tạo chỉ có tệp dùng một phần giữ chỗ tệp đính kèm |
| Tin nhắn nhiều hình ảnh        | Nhiều tệp Slack      | Mỗi tệp được đánh giá độc lập                                                     | Xử lý Slack bị giới hạn ở tám tệp mỗi tin nhắn                             |

### Quy trình inbound

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng token bot (`xoxb-...`).
2. Tệp được ghi vào kho phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và loại nội dung được thêm vào ngữ cảnh inbound.
4. Các đường dẫn mô hình/công cụ có khả năng xử lý hình ảnh có thể dùng tệp đính kèm hình ảnh từ ngữ cảnh đó.
5. Tệp không phải hình ảnh vẫn có sẵn dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu chính phản hồi không có phương tiện trực tiếp và tin nhắn gốc được bao gồm có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh khởi tạo luồng.
- Tệp đính kèm trực tiếp của phản hồi được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Một tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng phần giữ chỗ tệp đính kèm để phương án dự phòng vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack duy nhất chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua quy trình phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý tuân theo thứ tự tệp của Slack trong payload sự kiện.
- Lỗi tải xuống ở một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp Slack không thể phục vụ, URL hết hạn, tệp không truy cập được, tệp quá kích thước và phản hồi HTML xác thực/đăng nhập của Slack sẽ bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Mô hình thị giác**: Phân tích hình ảnh dùng mô hình phản hồi đang hoạt động khi mô hình đó hỗ trợ thị giác, hoặc mô hình hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Tình huống                              | Hành vi hiện tại                                                            | Cách khắc phục                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack hết hạn                  | Tệp bị bỏ qua; không hiển thị lỗi                                             | Tải lại tệp lên Slack                                                       |
| Chưa cấu hình mô hình thị giác         | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng mô hình phản hồi có khả năng thị giác |
| Hình ảnh rất lớn (> 20 MB theo mặc định) | Bị bỏ qua theo giới hạn kích thước                                           | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                         |
| Tệp đính kèm được chuyển tiếp/chia sẻ  | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo nỗ lực tốt nhất | Chia sẻ lại trực tiếp trong luồng OpenClaw                                  |
| Tệp đính kèm PDF                      | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua thị giác hình ảnh | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF |

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
    Định tuyến tin nhắn inbound đến tác nhân.
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
