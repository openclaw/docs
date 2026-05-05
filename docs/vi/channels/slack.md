---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi khi chạy (Chế độ Socket + URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho môi trường production cho tin nhắn trực tiếp và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; HTTP Request URLs cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp Slack mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và sổ tay sửa chữa.
  </Card>
</CardGroup>

## Chọn Socket Mode hoặc HTTP Request URLs

Cả hai phương thức truyền đều sẵn sàng cho môi trường production và đạt ngang bằng tính năng cho nhắn tin, lệnh gạch chéo, App Home và tính tương tác. Chọn theo mô hình triển khai, không phải theo tính năng.

| Mối quan tâm                | Socket Mode (mặc định)                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway công khai        | Không bắt buộc                                                                       | Bắt buộc (DNS, TLS, reverse proxy hoặc tunnel)                                                                 |
| Mạng outbound                | WSS outbound tới `wss-primary.slack.com` phải truy cập được                          | Không có WS outbound; chỉ HTTPS inbound                                                                        |
| Token cần thiết              | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) với `connections:write`        | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| Laptop dev / sau tường lửa   | Hoạt động nguyên trạng                                                               | Cần tunnel công khai (ngrok, Cloudflare Tunnel, Tailscale Funnel) hoặc Gateway staging                         |
| Mở rộng ngang                | Một phiên Socket Mode cho mỗi ứng dụng trên mỗi host; nhiều Gateway cần ứng dụng Slack riêng | Trình xử lý POST không trạng thái; nhiều bản sao Gateway có thể dùng chung một ứng dụng sau load balancer      |
| Nhiều tài khoản trên một Gateway | Được hỗ trợ; mỗi tài khoản mở WS riêng                                           | Được hỗ trợ; mỗi tài khoản cần một `webhookPath` duy nhất (mặc định `/slack/events`) để đăng ký không xung đột |
| Phương thức truyền lệnh gạch chéo | Được gửi qua kết nối WS; `slash_commands[].url` bị bỏ qua                       | Slack POST tới `slash_commands[].url`; trường này là bắt buộc để lệnh được dispatch                            |
| Ký request                  | Không dùng (xác thực là App-Level Token)                                             | Slack ký mọi request; OpenClaw xác minh bằng `signingSecret`                                                   |
| Khôi phục khi rớt kết nối    | Slack SDK tự động kết nối lại; cấu hình transport pong-timeout của gateway được áp dụng | Không có kết nối liên tục để bị rớt; retry theo từng request từ Slack                                         |

<Note>
  **Chọn Socket Mode** cho host một Gateway, laptop dev và mạng on-prem có thể truy cập outbound tới `*.slack.com` nhưng không thể nhận HTTPS inbound.

**Chọn HTTP Request URLs** khi chạy nhiều bản sao Gateway sau load balancer, khi WSS outbound bị chặn nhưng HTTPS inbound được phép, hoặc khi bạn đã terminate Slack webhook tại reverse proxy.
</Note>

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** khớp với bộ tính năng đầy đủ của Slack Plugin đi kèm: App Home, lệnh gạch chéo, tệp, phản ứng, ghim, tin nhắn trực tiếp nhóm và quyền đọc emoji/usergroup. Chọn **Minimal** khi chính sách workspace giới hạn scope — nó bao phủ tin nhắn trực tiếp, lịch sử kênh/nhóm, lượt nhắc và lệnh gạch chéo nhưng bỏ tệp, phản ứng, ghim, group-DM (`mpim:*`), `emoji:read` và `usergroups:read`. Xem [Danh sách kiểm tra manifest và scope](#manifest-and-scope-checklist) để biết lý do cho từng scope và các tùy chọn bổ sung như lệnh gạch chéo thêm.
        </Note>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: thêm `connections:write`, lưu, sao chép giá trị `xapp-...`.
        - **Install App → Install to Workspace**: sao chép `xoxb-...` Bot User OAuth Token.

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

        Phương án dự phòng env (chỉ tài khoản mặc định):

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
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → thay `https://gateway-host.example.com/slack/events` bằng URL Gateway công khai của bạn → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Được khuyến nghị** khớp với toàn bộ bộ tính năng của Slack Plugin đi kèm; **Tối thiểu** loại bỏ tệp, phản ứng, ghim, nhóm DM (`mpim:*`), `emoji:read` và `usergroups:read` cho các workspace hạn chế. Xem [Danh sách kiểm tra manifest và phạm vi](#manifest-and-scope-checklist) để biết lý do cho từng phạm vi.
        </Note>

        <Info>
          Ba trường URL (`slash_commands[].url`, `event_subscriptions.request_url` và `interactivity.request_url` / `message_menu_options_url`) đều trỏ đến cùng một endpoint OpenClaw. Lược đồ manifest của Slack yêu cầu chúng được đặt tên riêng, nhưng OpenClaw định tuyến theo loại payload nên chỉ cần một `webhookPath` duy nhất (mặc định `/slack/events`) là đủ. Slash command không có `slash_commands[].url` sẽ âm thầm không làm gì trong chế độ HTTP.
        </Info>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information → App Credentials**: sao chép **Signing Secret** để xác minh yêu cầu.
        - **Install App → Install to Workspace**: sao chép Bot User OAuth Token `xoxb-...`.

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
        Dùng đường dẫn Webhook riêng cho HTTP nhiều tài khoản

        Cấp cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không va chạm.
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

Theo mặc định, OpenClaw đặt thời gian chờ pong của client Slack SDK là 15 giây cho Socket Mode. Chỉ ghi đè cài đặt truyền tải khi bạn cần tinh chỉnh theo workspace hoặc host cụ thể:

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

Chỉ dùng tùy chọn này cho các workspace Socket Mode ghi log lỗi hết thời gian chờ pong/server-ping của websocket Slack hoặc chạy trên các host đã biết là bị nghẽn event loop. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi client ping; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện của ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu về độ hoạt động của truyền tải.

## Danh sách kiểm tra manifest và phạm vi

Manifest ứng dụng Slack cơ sở giống nhau cho Socket Mode và HTTP Request URLs. Chỉ khối `settings` (và `url` của slash command) là khác.

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

Đối với **chế độ HTTP Request URLs**, thay `settings` bằng biến thể HTTP và thêm `url` vào từng slash command. Cần có URL công khai:

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

Hiển thị các tính năng khác mở rộng các mặc định ở trên.

Manifest mặc định bật tab **Home** của Slack App Home và đăng ký `app_home_opened`. Khi một thành viên workspace mở tab Home, OpenClaw xuất bản một chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload cuộc trò chuyện hay cấu hình riêng tư. Tab **Messages** vẫn được bật cho Slack DM.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Có thể dùng nhiều [slash command gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với một số điểm cần lưu ý:

    - Dùng `/agentstatus` thay vì `/status` vì lệnh `/status` đã được dành riêng.
    - Không thể cung cấp hơn 25 slash command cùng lúc.

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
        Dùng cùng danh sách `slash_commands` như Socket Mode ở trên, và thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

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
  <Accordion title="Phạm vi tác giả tùy chọn (thao tác ghi)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi dùng danh tính tác nhân đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

    Nếu bạn dùng biểu tượng emoji, Slack yêu cầu cú pháp `:emoji_name:`.

  </Accordion>
  <Accordion title="Phạm vi token người dùng tùy chọn (thao tác đọc)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào việc đọc tìm kiếm Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token trong cấu hình ghi đè phương án dự phòng env.
- Phương án dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ có trong cấu hình (không có phương án dự phòng env) và mặc định có hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp trạng thái:

- Việc kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable` hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình qua SecretRef
  hoặc một nguồn bí mật không nội tuyến khác, nhưng lệnh/đường dẫn runtime hiện tại
  không thể phân giải giá trị thực tế.
- Trong chế độ HTTP, `signingSecretStatus` được bao gồm; trong Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với hành động/đọc thư mục, token người dùng có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, token bot vẫn được ưu tiên; thao tác ghi bằng token người dùng chỉ được phép khi `userTokenReadOnly: false` và token bot không khả dụng.
</Tip>

## Hành động và cổng kiểm soát

Hành động Slack được kiểm soát bằng `channels.slack.actions.*`.

Các nhóm hành động có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | -------- |
| messages   | bật      |
| reactions  | bật      |
| pins       | bật      |
| memberInfo | bật      |
| emojiList  | bật      |

Các hành động tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack hiển thị trong placeholder tệp đến và trả về bản xem trước ảnh cho hình ảnh hoặc siêu dữ liệu tệp cục bộ cho các loại tệp khác.

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

    Thứ tự ưu tiên đa tài khoản:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` riêng chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Ghép nối trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm dưới `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn thiếu (thiết lập chỉ dùng env), runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    Phân giải tên/ID:

    - mục danh sách cho phép kênh và mục danh sách cho phép DM được phân giải khi khởi động nếu quyền truy cập token cho phép
    - mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - ủy quyền chiều đến và định tuyến kênh mặc định ưu tiên ID; khớp trực tiếp theo tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp trong `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, nên khóa dựa trên tên sẽ không bao giờ định tuyến thành công và mọi tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc để định tuyến và khóa dựa trên tên có vẻ hoạt động.

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

    Không đúng (bị chặn im lặng dưới `groupPolicy: "allowlist"`):

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
    Tin nhắn trong kênh mặc định được kiểm soát bằng lượt nhắc.

    Nguồn lượt nhắc:

    - lượt nhắc ứng dụng rõ ràng (`<@botId>`)
    - lượt nhắc nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex lượt nhắc (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời-ngược-lại-bot ngầm định (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo kênh (`channels.slack.channels.<id>`; tên chỉ thông qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: ký tự đại diện `id:`, `e164:`, `username:`, `name:`, hoặc `"*"`
      (các khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` mang tính thận trọng đối với kênh và kênh riêng tư: tin nhắn phòng do bot tạo chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không đáp ứng điều kiện hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng Slack `conversations.members`; hãy bảo đảm ứng dụng có phạm vi đọc tương ứng cho loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw bỏ tin nhắn phòng do bot tạo.

  </Tab>
</Tabs>

## Luồng, phiên và thẻ trả lời

- DM được định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Liên kết định tuyến Slack chấp nhận ID đối tượng ngang hàng thô cùng các dạng đích Slack như `channel:C12345678`, `user:U12345678`, và `<@U12345678>`.
- Với `session.dmScope=main` mặc định, DM Slack được gộp vào phiên chính của agent.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi phù hợp.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` điều khiển số lượng tin nhắn luồng hiện có được lấy khi phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi là `true`, chặn các lượt nhắc luồng ngầm định để bot chỉ phản hồi các lượt nhắc `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có tùy chọn này, các câu trả lời trong một luồng mà bot đã tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- dự phòng cũ cho trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` tắt **tất cả** luồng trả lời trong Slack, bao gồm cả thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tôn trọng ở chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh, còn trả lời Telegram vẫn hiển thị nội dòng.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- dự phòng emoji nhận diện agent (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack mong đợi shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền trực tiếp văn bản

`channels.slack.streaming` điều khiển hành vi xem trước trực tiếp:

- `off`: tắt truyền trực tiếp bản xem trước.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo từng đoạn.
- `progress`: hiển thị văn bản trạng thái tiến độ trong khi tạo, sau đó gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến các bản cập nhật công cụ/tiến độ vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ các tin nhắn công cụ/tiến độ riêng.
- `streaming.preview.commandText` / `streaming.progress.commandText`: đặt thành `status` để giữ các dòng tiến độ công cụ gọn nhẹ trong khi ẩn văn bản lệnh/thực thi thô (mặc định: `raw`).

Ẩn văn bản lệnh/thực thi thô trong khi giữ các dòng tiến độ gọn nhẹ:

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

`channels.slack.streaming.nativeTransport` điều khiển truyền trực tiếp văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

- Phải có sẵn luồng trả lời để truyền trực tiếp văn bản gốc và để trạng thái luồng trợ lý Slack xuất hiện. Việc chọn luồng vẫn tuân theo `replyToMode`.
- Kênh, trò chuyện nhóm và gốc DM cấp cao nhất vẫn có thể dùng bản xem trước nháp thông thường khi không có truyền trực tiếp gốc hoặc không tồn tại luồng trả lời.
- DM Slack cấp cao nhất mặc định ở ngoài luồng, vì vậy chúng không hiển thị bản xem trước luồng/trạng thái gốc kiểu luồng của Slack; thay vào đó OpenClaw đăng và chỉnh sửa một bản xem trước nháp trong DM.
- Phương tiện và payload không phải văn bản quay về cơ chế gửi thông thường.
- Kết quả cuối phương tiện/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối văn bản/khối đủ điều kiện chỉ được xả khi có thể chỉnh sửa trực tiếp bản xem trước tại chỗ.
- Nếu truyền trực tiếp thất bại giữa chừng trong một câu trả lời, OpenClaw quay về cơ chế gửi thông thường cho các payload còn lại.

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

## Dự phòng phản ứng đang nhập

`typingReaction` thêm một reaction tạm thời vào tin nhắn Slack gửi đến trong khi OpenClaw đang xử lý phản hồi, rồi xóa reaction đó khi lượt chạy kết thúc. Tính năng này hữu ích nhất bên ngoài phản hồi theo thread, vốn dùng chỉ báo trạng thái mặc định "đang nhập...".

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"hourglass_flowing_sand"`).
- Reaction được thực hiện theo best-effort và quá trình dọn dẹp được tự động thử sau khi phản hồi hoặc đường dẫn lỗi hoàn tất.

## Phương tiện, chia nhỏ và phân phối

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Tệp đính kèm Slack được tải xuống từ URL riêng tư do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho phương tiện khi tải thành công và giới hạn kích thước cho phép. Placeholder tệp bao gồm `fileId` của Slack để agent có thể tải tệp gốc bằng `download-file`.

    Tải xuống dùng thời gian chờ idle và tổng thời gian có giới hạn. Nếu việc truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và fallback về placeholder tệp.

    Giới hạn kích thước inbound trong runtime mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - các đoạn văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật tách ưu tiên đoạn văn
    - gửi tệp dùng API tải lên của Slack và có thể bao gồm phản hồi theo thread (`thread_ts`)
    - giới hạn phương tiện outbound theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, lượt gửi qua kênh dùng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Delivery targets">
    Đích rõ ràng được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ có văn bản/block có thể đăng trực tiếp tới ID người dùng; tải tệp lên và gửi theo thread sẽ mở DM qua API hội thoại Slack trước vì các đường dẫn đó yêu cầu ID hội thoại cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh đã cấu hình duy nhất hoặc nhiều lệnh native. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh native yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động của lệnh native được **tắt** cho Slack, nên `commands.native: "auto"` không bật lệnh native của Slack.

```txt
/help
```

Menu đối số native dùng chiến lược hiển thị thích ứng, hiển thị modal xác nhận trước khi gửi giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: block nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có trình xử lý tùy chọn interactivity
- vượt quá giới hạn Slack: giá trị tùy chọn được mã hóa fallback về nút

```txt
/think
```

Phiên slash dùng khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến lượt thực thi lệnh tới phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Phản hồi tương tác

Slack có thể hiển thị điều khiển phản hồi tương tác do agent tạo, nhưng tính năng này bị tắt theo mặc định.

Bật tính năng này toàn cục:

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

Khi được bật, agent có thể phát directive phản hồi chỉ dành cho Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các directive này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI riêng cho Slack. Các kênh khác không chuyển directive Slack Block Kit thành hệ thống nút riêng của chúng.
- Giá trị callback tương tác là token opaque do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các block tương tác được tạo vượt quá giới hạn Slack Block Kit, OpenClaw fallback về phản hồi văn bản gốc thay vì gửi payload block không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt native với nút và tương tác, thay vì fallback về Web UI hoặc terminal.

- Phê duyệt exec dùng `channels.slack.execApprovals.*` để định tuyến DM/kênh native.
- Phê duyệt Plugin vẫn có thể được phân giải qua cùng bề mặt nút native của Slack khi yêu cầu đã đến Slack và loại approval id là `plugin:`.
- Việc ủy quyền người phê duyệt vẫn được thực thi: chỉ người dùng được xác định là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Tính năng này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt hiển thị trực tiếp trong hội thoại dưới dạng nút Block Kit.
Khi có các nút đó, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt
qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; fallback về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec native khi `enabled` chưa được đặt hoặc là `"auto"` và phân giải được ít nhất một
người phê duyệt. Đặt `enabled: false` để tắt Slack một cách rõ ràng với vai trò client phê duyệt native.
Đặt `enabled: true` để buộc bật phê duyệt native khi phân giải được người phê duyệt.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack rõ ràng:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình native cho Slack chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
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
định tuyến tới các chat khác hoặc các đích ngoài băng tần rõ ràng. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; nút native của Slack vẫn có thể phân giải phê duyệt Plugin khi các yêu cầu đó đã đến
Slack.

`/approve` trong cùng chat cũng hoạt động trong kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Thread broadcast ("Cũng gửi tới kênh" trong phản hồi thread) được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa reaction được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Metadata chủ đề/mục đích của kênh được coi là ngữ cảnh không đáng tin cậy và có thể được đưa vào ngữ cảnh định tuyến.
- Ngữ cảnh seed từ thread starter và lịch sử thread ban đầu được lọc theo allowlist người gửi đã cấu hình khi áp dụng.
- Block action và tương tác modal phát sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - block action: giá trị đã chọn, nhãn, giá trị picker, và metadata `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với metadata kênh đã định tuyến và input biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (break-glass; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- thread/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
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
    - `channels.slack.dmPolicy` (hoặc bản cũ `channels.slack.dm.policy`)
    - phê duyệt ghép cặp / mục allowlist
    - Sự kiện DM của Slack Assistant: log chi tiết nhắc đến `drop message_changed`
      thường có nghĩa là Slack đã gửi một sự kiện Assistant-thread đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong metadata tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Xác thực bot + app token và việc bật Socket Mode trong cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không phân giải được giá trị được hỗ trợ bởi SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Xác thực:

    - signing secret
    - đường dẫn Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong snapshot
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không
    phân giải được signing secret được hỗ trợ bởi SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Xác minh bạn đã định dùng:

    - chế độ lệnh native (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và allowlist kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt agent khi tải tệp Slack thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được truyền qua đường dẫn hiểu phương tiện hoặc trực tiếp tới mô hình phản hồi hỗ trợ vision; các tệp khác được giữ lại làm ngữ cảnh tệp có thể tải xuống thay vì được xem là input hình ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện            | Nguồn             | Hành vi hiện tại                                                                        | Ghi chú                                                                 |
| --------------------------- | ----------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Ảnh JPEG / PNG / GIF / WebP | URL tệp Slack     | Được tải xuống và đính kèm vào lượt xử lý để các khả năng hỗ trợ thị giác xử lý         | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)          |
| Tệp PDF                     | URL tệp Slack     | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Luồng vào Slack không tự động chuyển đổi PDF thành đầu vào thị giác ảnh |
| Tệp khác                    | URL tệp Slack     | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                            | Tệp nhị phân không được xử lý như đầu vào hình ảnh                      |
| Trả lời trong luồng         | Tệp của tin nhắn mở luồng | Tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi phản hồi không có phương tiện trực tiếp | Tin nhắn mở luồng chỉ có tệp sử dụng một phần giữ chỗ cho tệp đính kèm |
| Tin nhắn nhiều ảnh          | Nhiều tệp Slack   | Mỗi tệp được đánh giá độc lập                                                           | Quá trình xử lý Slack bị giới hạn ở tám tệp mỗi tin nhắn                |

### Luồng xử lý vào

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng mã thông báo bot (`xoxb-...`).
2. Tệp được ghi vào kho lưu trữ phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và loại nội dung được thêm vào ngữ cảnh đầu vào.
4. Các đường dẫn mô hình/công cụ có khả năng xử lý ảnh có thể dùng tệp đính kèm ảnh từ ngữ cảnh đó.
5. Các tệp không phải ảnh vẫn có sẵn dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu chính phản hồi không có phương tiện trực tiếp và tin nhắn gốc được đưa vào có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh mở luồng.
- Tệp đính kèm trực tiếp của phản hồi được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Một tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng một phần giữ chỗ cho tệp đính kèm để cơ chế dự phòng vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack duy nhất chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua luồng phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý theo thứ tự tệp của Slack trong tải trọng sự kiện.
- Lỗi tải xuống của một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể phục vụ, URL hết hạn, tệp không truy cập được, tệp quá kích thước và phản hồi HTML xác thực/đăng nhập Slack sẽ bị bỏ qua thay vì được báo là định dạng không được hỗ trợ.
- **Mô hình thị giác**: Phân tích ảnh dùng mô hình phản hồi đang hoạt động khi mô hình đó hỗ trợ thị giác, hoặc mô hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Kịch bản                              | Hành vi hiện tại                                                            | Cách khắc phục                                                            |
| ------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| URL tệp Slack hết hạn                 | Tệp bị bỏ qua; không hiển thị lỗi                                           | Tải lại tệp lên Slack                                                     |
| Chưa cấu hình mô hình thị giác        | Tệp đính kèm ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng mô hình phản hồi có khả năng thị giác |
| Ảnh rất lớn (> 20 MB theo mặc định)   | Bị bỏ qua theo giới hạn kích thước                                          | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                       |
| Tệp đính kèm được chuyển tiếp/chia sẻ | Văn bản và phương tiện ảnh/tệp do Slack lưu trữ được xử lý theo khả năng tốt nhất | Chia sẻ lại trực tiếp trong luồng OpenClaw                                |
| Tệp đính kèm PDF                      | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua thị giác ảnh | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF |

### Tài liệu liên quan

- [Luồng hiểu phương tiện](/vi/nodes/media-understanding)
- [Công cụ PDF](/vi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Bật khả năng thị giác cho tệp đính kèm Slack
- Kiểm thử hồi quy: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Xác minh trực tiếp: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Slack với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi kênh và DM nhóm.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đầu vào đến các tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Bố cục cấu hình và thứ tự ưu tiên.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Danh mục lệnh và hành vi.
  </Card>
</CardGroup>
