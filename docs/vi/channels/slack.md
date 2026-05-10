---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket/HTTP của Slack
summary: Thiết lập Slack và hành vi khi chạy (Socket Mode + các URL yêu cầu HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho môi trường production cho tin nhắn trực tiếp và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; URL yêu cầu HTTP cũng được hỗ trợ.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp Slack mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Chẩn đoán liên kênh và playbook sửa chữa.
  </Card>
</CardGroup>

## Chọn Socket Mode hoặc URL yêu cầu HTTP

Cả hai phương thức truyền đều sẵn sàng cho môi trường production và đạt tương đương tính năng cho nhắn tin, lệnh slash, App Home và tính tương tác. Hãy chọn theo mô hình triển khai, không theo tính năng.

| Mối quan tâm                 | Socket Mode (mặc định)                                                               | URL yêu cầu HTTP                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway công khai        | Không bắt buộc                                                                       | Bắt buộc (DNS, TLS, reverse proxy hoặc tunnel)                                                                 |
| Mạng outbound                | WSS outbound tới `wss-primary.slack.com` phải truy cập được                          | Không có WS outbound; chỉ HTTPS inbound                                                                        |
| Token cần thiết              | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) với `connections:write`        | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| Laptop dev / sau firewall    | Hoạt động nguyên trạng                                                               | Cần tunnel công khai (ngrok, Cloudflare Tunnel, Tailscale Funnel) hoặc Gateway staging                         |
| Mở rộng ngang                | Một phiên Socket Mode cho mỗi ứng dụng trên mỗi host; nhiều Gateway cần ứng dụng Slack riêng | Handler POST không trạng thái; nhiều bản sao Gateway có thể dùng chung một ứng dụng sau load balancer          |
| Nhiều tài khoản trên một Gateway | Được hỗ trợ; mỗi tài khoản mở WS riêng                                           | Được hỗ trợ; mỗi tài khoản cần một `webhookPath` duy nhất (mặc định `/slack/events`) để các đăng ký không xung đột |
| Phương thức truyền lệnh slash | Được phân phối qua kết nối WS; `slash_commands[].url` bị bỏ qua                     | Slack POST tới `slash_commands[].url`; trường này là bắt buộc để lệnh được điều phối                           |
| Ký yêu cầu                   | Không dùng (xác thực là App-Level Token)                                             | Slack ký mọi yêu cầu; OpenClaw xác minh bằng `signingSecret`                                                   |
| Khôi phục khi mất kết nối    | Slack SDK tự động kết nối lại; tinh chỉnh truyền tải pong-timeout của Gateway được áp dụng | Không có kết nối liên tục để mất; retry là theo từng yêu cầu từ Slack                                          |

<Note>
  **Chọn Socket Mode** cho host một Gateway, laptop dev và mạng on-prem có thể truy cập outbound tới `*.slack.com` nhưng không thể nhận HTTPS inbound.

**Chọn URL yêu cầu HTTP** khi chạy nhiều bản sao Gateway sau load balancer, khi WSS outbound bị chặn nhưng HTTPS inbound được cho phép, hoặc khi bạn đã kết thúc webhook Slack tại reverse proxy.
</Note>

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → **Next** → **Create**.

        <CodeGroup>

```json Được khuyến nghị
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

```json Tối thiểu
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
          **Được khuyến nghị** khớp với toàn bộ bộ tính năng của Plugin Slack đi kèm: App Home, lệnh slash, tệp, reaction, ghim, tin nhắn trực tiếp nhóm và quyền đọc emoji/usergroup. Chọn **Tối thiểu** khi chính sách workspace hạn chế scope — cấu hình này bao gồm tin nhắn trực tiếp, lịch sử kênh/nhóm, mention và lệnh slash nhưng bỏ tệp, reaction, ghim, tin nhắn trực tiếp nhóm (`mpim:*`), `emoji:read` và `usergroups:read`. Xem [Danh sách kiểm tra manifest và scope](#manifest-and-scope-checklist) để biết lý do cho từng scope và các tùy chọn cộng thêm như lệnh slash bổ sung.
        </Note>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: thêm `connections:write`, lưu, sao chép giá trị `xapp-...`.
        - **Install App → Install to Workspace**: sao chép Bot User OAuth Token `xoxb-...`.

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

        Dự phòng env (chỉ tài khoản mặc định):

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
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → thay `https://gateway-host.example.com/slack/events` bằng URL Gateway công khai của bạn → **Next** → **Create**.

        <CodeGroup>

```json Được khuyến nghị
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
          **Khuyến nghị** khớp với đầy đủ bộ tính năng của Plugin Slack đi kèm; **Tối thiểu** loại bỏ tệp, phản ứng, ghim, DM nhóm (`mpim:*`), `emoji:read` và `usergroups:read` cho các không gian làm việc có hạn chế. Xem [Danh sách kiểm tra manifest và phạm vi](#manifest-and-scope-checklist) để biết lý do theo từng phạm vi.
        </Note>

        <Info>
          Ba trường URL (`slash_commands[].url`, `event_subscriptions.request_url` và `interactivity.request_url` / `message_menu_options_url`) đều trỏ đến cùng một endpoint OpenClaw. Lược đồ manifest của Slack yêu cầu đặt tên riêng cho chúng, nhưng OpenClaw định tuyến theo loại payload nên một `webhookPath` duy nhất (mặc định `/slack/events`) là đủ. Các lệnh slash không có `slash_commands[].url` sẽ âm thầm không làm gì trong chế độ HTTP.
        </Info>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information → App Credentials**: sao chép **Signing Secret** để xác minh yêu cầu.
        - **Install App → Install to Workspace**: sao chép Bot User OAuth Token `xoxb-...`.

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

OpenClaw đặt thời gian chờ pong của máy khách Slack SDK mặc định là 15 giây cho Socket Mode. Chỉ ghi đè thiết lập truyền tải khi bạn cần tinh chỉnh theo không gian làm việc hoặc máy chủ cụ thể:

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

Chỉ dùng mục này cho các không gian làm việc Socket Mode ghi log lỗi hết thời gian chờ pong/server-ping của websocket Slack hoặc chạy trên các máy chủ đã biết là có tình trạng thiếu tài nguyên vòng lặp sự kiện. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi client ping; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Thông báo và sự kiện của ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu hoạt động của truyền tải.

## Danh sách kiểm tra manifest và phạm vi

Manifest cơ sở của ứng dụng Slack giống nhau cho Socket Mode và HTTP Request URLs. Chỉ khối `settings` (và `url` của lệnh slash) là khác.

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

Đối với **chế độ HTTP Request URLs**, thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh slash. Bắt buộc có URL công khai:

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

### Thiết lập manifest bổ sung

Đưa ra các tính năng khác nhau mở rộng các mặc định ở trên.

Manifest mặc định bật thẻ **Home** trong Slack App Home và đăng ký `app_home_opened`. Khi một thành viên không gian làm việc mở thẻ Home, OpenClaw xuất bản một chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload cuộc trò chuyện hoặc cấu hình riêng tư. Thẻ **Messages** vẫn được bật cho DM Slack.

<AccordionGroup>
  <Accordion title="Lệnh slash gốc tùy chọn">

    Có thể dùng nhiều [lệnh slash gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với một số điểm cần lưu ý:

    - Dùng `/agentstatus` thay vì `/status` vì lệnh `/status` được dành riêng.
    - Không thể cung cấp nhiều hơn 25 lệnh slash cùng lúc.

    Thay thế phần `features.slash_commands` hiện có của bạn bằng một tập con của [các lệnh có sẵn](/vi/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (mặc định)">

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
  <Accordion title="Phạm vi quyền tác giả tùy chọn (thao tác ghi)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi dùng danh tính tác nhân đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

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
    - `search:read` (nếu bạn phụ thuộc vào thao tác đọc tìm kiếm của Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc cho Socket Mode.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret`, và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token trong cấu hình ghi đè phương án dự phòng từ env.
- Phương án dự phòng env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` (`xoxp-...`) chỉ cấu hình được trong config (không có phương án dự phòng từ env) và mặc định là hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp nhanh trạng thái:

- Kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable`, hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình qua SecretRef
  hoặc một nguồn bí mật không nằm inline khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực.
- Trong chế độ HTTP, `signingSecretStatus` được bao gồm; trong Socket Mode, cặp
  bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Với các thao tác đọc hành động/thư mục, user token có thể được ưu tiên khi đã cấu hình. Với thao tác ghi, bot token vẫn được ưu tiên; ghi bằng user-token chỉ được phép khi `userTokenReadOnly: false` và bot token không khả dụng.
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

Các hành động tin nhắn Slack hiện tại gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, và `emoji-list`. `download-file` chấp nhận ID tệp Slack hiển thị trong placeholder tệp đến và trả về bản xem trước hình ảnh cho ảnh hoặc metadata tệp cục bộ cho các loại tệp khác.

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
    - Tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` của chính chúng chưa được đặt.
    - Tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Ghép đôi trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm dưới `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Ghi chú runtime: nếu `channels.slack` hoàn toàn bị thiếu (thiết lập chỉ dùng env), runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Phân giải tên/ID:

    - mục danh sách cho phép kênh và mục danh sách cho phép DM được phân giải khi khởi động nếu quyền truy cập token cho phép
    - mục tên kênh chưa phân giải được giữ nguyên như đã cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - ủy quyền đến và định tuyến kênh mặc định ưu tiên ID; khớp trực tiếp theo username/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp dưới `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, nên khóa dựa trên tên sẽ không bao giờ định tuyến thành công và mọi tin nhắn trong kênh đó sẽ bị chặn âm thầm. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc cho định tuyến và khóa dựa trên tên có vẻ hoạt động.

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

  <Tab title="Lượt nhắc và người dùng kênh">
    Tin nhắn kênh mặc định được kiểm soát bằng lượt nhắc.

    Nguồn lượt nhắc:

    - lượt nhắc ứng dụng rõ ràng (`<@botId>`)
    - lượt nhắc nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex lượt nhắc (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời ngầm định đến bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo kênh (`channels.slack.channels.<id>`; tên chỉ qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, hoặc ký tự đại diện `"*"`
      (khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `allowBots` mang tính thận trọng với kênh và kênh riêng tư: tin nhắn phòng do bot tạo chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu theo tên hiển thị không thỏa mãn sự hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng `conversations.members` của Slack; hãy bảo đảm ứng dụng có phạm vi đọc tương ứng với loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw bỏ tin nhắn phòng do bot tạo.

  </Tab>
</Tabs>

## Luồng hội thoại, phiên và thẻ trả lời

- DM định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Liên kết định tuyến Slack chấp nhận ID peer thô cùng các dạng mục tiêu Slack như `channel:C12345678`, `user:U12345678`, và `<@U12345678>`.
- Với `session.dmScope=main` mặc định, DM Slack được gộp vào phiên chính của tác nhân.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Trả lời trong luồng có thể tạo hậu tố phiên luồng (`:thread:<threadTs>`) khi áp dụng.
- Trong các kênh nơi OpenClaw xử lý tin nhắn cấp cao nhất mà không yêu cầu lượt nhắc rõ ràng, `replyToMode` khác `off` định tuyến từng root được xử lý vào `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` để luồng Slack hiển thị ánh xạ tới một phiên OpenClaw ngay từ lượt đầu tiên.
- Mặc định `channels.slack.thread.historyScope` là `thread`; mặc định `thread.inheritParent` là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số tin nhắn luồng hiện có được lấy khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi `true`, chặn lượt nhắc luồng ngầm định để bot chỉ phản hồi các lượt nhắc `@bot` rõ ràng trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có thiết lập này, trả lời trong luồng mà bot đã tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- dự phòng cũ cho trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Thẻ trả lời thủ công được hỗ trợ:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Với trả lời luồng Slack rõ ràng từ công cụ `message`, đặt `replyBroadcast: true` với `action: "send"` và `threadId` hoặc `replyTo` để yêu cầu Slack cũng phát trả lời luồng tới kênh cha. Thiết lập này ánh xạ tới cờ `reply_broadcast` của `chat.postMessage` trong Slack và chỉ được hỗ trợ cho gửi văn bản hoặc Block Kit, không hỗ trợ tải lên media.

Khi một lệnh gọi công cụ `message` chạy bên trong luồng Slack và nhắm tới cùng kênh, OpenClaw thường kế thừa luồng Slack hiện tại theo `replyToMode`. Đặt `topLevel: true` trên `action: "send"` hoặc `action: "upload-file"` để buộc tạo tin nhắn kênh cha mới thay vào đó. `threadId: null` được chấp nhận như cùng một cách chọn không dùng cấp luồng.

<Note>
`replyToMode="off"` tắt **mọi** luồng trả lời trong Slack, bao gồm các thẻ `[[reply_to_*]]` rõ ràng. Điều này khác với Telegram, nơi thẻ rõ ràng vẫn được tôn trọng trong chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh trong khi trả lời Telegram vẫn hiển thị inline.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đến.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- phương án dự phòng emoji danh tính tác nhân (`agents.list[].identity.emoji`, nếu không thì "👀")

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

## Truyền trực tuyến văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền trực tuyến bản xem trước trực tiếp.
- `partial` (mặc định): thay văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo khối.
- `progress`: hiển thị văn bản trạng thái tiến độ trong khi tạo, sau đó gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến cập nhật công cụ/tiến độ vào cùng tin nhắn xem trước được chỉnh sửa (mặc định: `true`). Đặt `false` để giữ các tin nhắn công cụ/tiến độ riêng biệt.
- `streaming.preview.commandText` / `streaming.progress.commandText`: đặt thành `status` để giữ các dòng tiến độ công cụ gọn nhẹ trong khi ẩn văn bản lệnh/exec thô (mặc định: `raw`).

Ẩn văn bản lệnh/exec thô trong khi giữ các dòng tiến độ gọn nhẹ:

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

- Phải có sẵn một chuỗi trả lời để truyền phát văn bản gốc và trạng thái chuỗi trợ lý Slack xuất hiện. Việc chọn chuỗi vẫn tuân theo `replyToMode`.
- Gốc kênh, cuộc trò chuyện nhóm và DM cấp cao nhất vẫn có thể dùng bản xem trước nháp thông thường khi truyền phát gốc không khả dụng hoặc không có chuỗi trả lời.
- DM Slack cấp cao nhất mặc định vẫn không nằm trong chuỗi, nên chúng không hiển thị bản xem trước trạng thái/truyền phát gốc kiểu chuỗi của Slack; thay vào đó OpenClaw đăng và chỉnh sửa bản xem trước nháp trong DM.
- Phương tiện và payload không phải văn bản quay về cơ chế gửi thông thường.
- Kết quả cuối cùng là phương tiện/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ; kết quả cuối cùng đủ điều kiện là văn bản/khối chỉ flush khi chúng có thể chỉnh sửa bản xem trước tại chỗ.
- Nếu truyền phát thất bại giữa chừng khi trả lời, OpenClaw quay về cơ chế gửi thông thường cho các payload còn lại.

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

- `channels.slack.streamMode` (`replace | status_final | append`) là bí danh runtime cũ cho `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` là bí danh runtime cũ cho `channels.slack.streaming.mode` và `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` cũ là bí danh runtime cho `channels.slack.streaming.nativeTransport`.
- Chạy `openclaw doctor --fix` để ghi lại cấu hình truyền phát Slack đã lưu bằng các khóa chuẩn.

## Dự phòng phản ứng đang nhập

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đến trong khi OpenClaw đang xử lý trả lời, rồi xóa phản ứng đó khi lượt chạy kết thúc. Tính năng này hữu ích nhất bên ngoài các trả lời theo chuỗi, vốn dùng chỉ báo trạng thái mặc định "is typing...".

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu shortcode (ví dụ `"hourglass_flowing_sand"`).
- Phản ứng là best-effort và việc dọn dẹp được tự động thử sau khi đường dẫn trả lời hoặc thất bại hoàn tất.

## Phương tiện, chia khúc và gửi

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Tệp đính kèm Slack được tải xuống từ các URL riêng do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho phương tiện khi fetch thành công và giới hạn kích thước cho phép. Placeholder tệp bao gồm `fileId` của Slack để agent có thể fetch tệp gốc bằng `download-file`.

    Tải xuống dùng thời gian chờ nhàn rỗi và tổng thời gian chờ có giới hạn. Nếu truy xuất tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và quay về placeholder tệp.

    Giới hạn kích thước runtime cho dữ liệu đến mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - khúc văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia tách ưu tiên đoạn văn
    - gửi tệp dùng API tải lên của Slack và có thể bao gồm trả lời theo chuỗi (`thread_ts`)
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, gửi qua kênh dùng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Delivery targets">
    Đích rõ ràng được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ có văn bản/khối có thể đăng trực tiếp tới ID người dùng; tải tệp lên và gửi theo chuỗi sẽ mở DM qua API hội thoại Slack trước, vì các đường dẫn đó yêu cầu một ID hội thoại cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi slash

Lệnh slash xuất hiện trong Slack dưới dạng một lệnh được cấu hình duy nhất hoặc nhiều lệnh gốc. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh gốc yêu cầu [thiết lập manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động của lệnh gốc bị **tắt** cho Slack, nên `commands.native: "auto"` không bật lệnh gốc Slack.

```txt
/help
```

Menu đối số gốc dùng chiến lược hiển thị thích ứng, hiển thị modal xác nhận trước khi dispatch giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: khối nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có handler tùy chọn tương tác
- vượt quá giới hạn Slack: giá trị tùy chọn đã mã hóa quay về nút

```txt
/think
```

Phiên slash dùng các khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến việc thực thi lệnh tới phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Trả lời tương tác

Slack có thể hiển thị các điều khiển trả lời tương tác do agent tạo, nhưng tính năng này mặc định bị tắt.

Bật tính năng này trên toàn cục:

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

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến các lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có.

Ghi chú:

- Đây là UI dành riêng cho Slack. Các kênh khác không dịch các chỉ thị Slack Block Kit thành hệ thống nút riêng của chúng.
- Giá trị callback tương tác là các token mờ do OpenClaw tạo, không phải giá trị thô do agent viết.
- Nếu các khối tương tác được tạo vượt quá giới hạn của Slack Block Kit, OpenClaw sẽ quay lại trả lời bằng văn bản gốc thay vì gửi một payload khối không hợp lệ.

## Phê duyệt exec trong Slack

Slack có thể hoạt động như một client phê duyệt gốc với các nút và tương tác tương tác, thay vì quay lại Web UI hoặc terminal.

- Phê duyệt exec dùng `channels.slack.execApprovals.*` cho định tuyến DM/kênh gốc.
- Phê duyệt Plugin vẫn có thể được giải quyết qua cùng bề mặt nút gốc của Slack khi yêu cầu đã đến Slack và loại id phê duyệt là `plugin:`.
- Ủy quyền người phê duyệt vẫn được thực thi: chỉ những người dùng được xác định là người phê duyệt mới có thể phê duyệt hoặc từ chối yêu cầu qua Slack.

Tính năng này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong phần cài đặt ứng dụng Slack của bạn, lời nhắc phê duyệt hiển thị trực tiếp trong cuộc trò chuyện dưới dạng nút Block Kit.
Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw
chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt
qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; quay lại `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và có ít nhất một
người phê duyệt được giải quyết. Đặt `enabled: false` để tắt rõ ràng Slack như một client phê duyệt gốc.
Đặt `enabled: true` để buộc bật phê duyệt gốc khi người phê duyệt được giải quyết.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack rõ ràng:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Chỉ cần cấu hình gốc của Slack rõ ràng khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc
chọn tham gia phân phối qua chat gốc:

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
riêng biệt; các nút gốc của Slack vẫn có thể giải quyết phê duyệt Plugin khi những yêu cầu đó đã đến
Slack.

`/approve` trong cùng chat cũng hoạt động trong các kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết toàn bộ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Phát sóng luồng ("Also send to channel" trong trả lời luồng) được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa phản ứng được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời khỏi, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Siêu dữ liệu chủ đề/mục đích của kênh được xem là ngữ cảnh không đáng tin cậy và có thể được chèn vào ngữ cảnh định tuyến.
- Bộ khởi tạo luồng và bước gieo ngữ cảnh lịch sử luồng ban đầu được lọc theo danh sách cho phép người gửi đã cấu hình khi áp dụng.
- Hành động khối và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động khối: giá trị đã chọn, nhãn, giá trị bộ chọn, và siêu dữ liệu `workflow_*`
  - sự kiện modal `view_submission` và `view_closed` với siêu dữ liệu kênh được định tuyến và đầu vào biểu mẫu

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (break-glass; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- luồng/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- phân phối: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurl: `unfurlLinks`, `unfurlMedia` để kiểm soát xem trước liên kết/media của `chat.postMessage`
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="No replies in channels">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - danh sách cho phép kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên âm thầm thất bại dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - danh sách cho phép `users` theo từng kênh

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
    - phê duyệt ghép nối / mục nhập danh sách cho phép
    - Sự kiện DM của Slack Assistant: log chi tiết nhắc đến `drop message_changed`
      thường có nghĩa là Slack đã gửi một sự kiện luồng Assistant đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong siêu dữ liệu tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Xác thực token bot + ứng dụng và việc bật Socket Mode trong phần cài đặt ứng dụng Slack.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không thể giải quyết giá trị được hỗ trợ bởi SecretRef.

  </Accordion>

  <Accordion title="Chế độ HTTP không nhận sự kiện">
    Xác thực:

    - bí mật ký
    - đường dẫn webhook
    - URL yêu cầu Slack (Sự kiện + Tương tác + Lệnh slash)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong ảnh chụp nhanh
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không thể
    phân giải bí mật ký được SecretRef hỗ trợ.

  </Accordion>

  <Accordion title="Lệnh native/slash không kích hoạt">
    Xác minh xem bạn dự định dùng:

    - chế độ lệnh native (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Đồng thời kiểm tra `commands.useAccessGroups` và danh sách cho phép theo kênh/người dùng.

  </Accordion>
</AccordionGroup>

## Tham chiếu thị giác cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt của tác tử khi việc tải tệp Slack xuống thành công và giới hạn kích thước cho phép. Tệp hình ảnh có thể được chuyển qua đường dẫn hiểu phương tiện hoặc trực tiếp tới mô hình trả lời có khả năng thị giác; các tệp khác được giữ lại dưới dạng ngữ cảnh tệp có thể tải xuống thay vì được xử lý như đầu vào hình ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện                 | Nguồn                | Hành vi hiện tại                                                                 | Ghi chú                                                                    |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Ảnh JPEG / PNG / GIF / WebP | URL tệp Slack       | Được tải xuống và đính kèm vào lượt để xử lý bằng khả năng thị giác                   | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)                 |
| Tệp PDF                      | URL tệp Slack       | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Đầu vào Slack không tự động chuyển đổi PDF thành đầu vào thị giác hình ảnh |
| Tệp khác                    | URL tệp Slack       | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                              | Tệp nhị phân không được xử lý như đầu vào hình ảnh                               |
| Trả lời trong luồng                 | Tệp của tin nhắn khởi đầu luồng | Tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi câu trả lời không có phương tiện trực tiếp  | Tin nhắn khởi đầu chỉ có tệp dùng một phần giữ chỗ tệp đính kèm                          |
| Tin nhắn nhiều ảnh           | Nhiều tệp Slack | Mỗi tệp được đánh giá độc lập                                              | Quá trình xử lý Slack bị giới hạn ở tám tệp mỗi tin nhắn                     |

### Đường ống đầu vào

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng token bot (`xoxb-...`).
2. Tệp được ghi vào kho phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và loại nội dung được thêm vào ngữ cảnh đầu vào.
4. Các đường dẫn mô hình/công cụ có khả năng hình ảnh có thể dùng tệp đính kèm hình ảnh từ ngữ cảnh đó.
5. Tệp không phải hình ảnh vẫn có sẵn dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong một luồng (có cha `thread_ts`):

- Nếu bản thân câu trả lời không có phương tiện trực tiếp và tin nhắn gốc được bao gồm có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh khởi đầu luồng.
- Tệp đính kèm trực tiếp trong câu trả lời được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng một phần giữ chỗ tệp đính kèm để cơ chế dự phòng vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua đường ống phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý tuân theo thứ tự tệp của Slack trong payload sự kiện.
- Lỗi tải xuống của một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể phục vụ, URL đã hết hạn, tệp không thể truy cập, tệp quá kích thước và phản hồi HTML xác thực/đăng nhập của Slack bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Mô hình thị giác**: Phân tích hình ảnh dùng mô hình trả lời đang hoạt động khi mô hình đó hỗ trợ thị giác, hoặc mô hình hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Kịch bản                               | Hành vi hiện tại                                                             | Cách xử lý                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack đã hết hạn                 | Tệp bị bỏ qua; không hiển thị lỗi                                                 | Tải lại tệp lên Slack                                                |
| Chưa cấu hình mô hình thị giác            | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng mô hình trả lời có khả năng thị giác |
| Hình ảnh rất lớn (> 20 MB theo mặc định) | Bị bỏ qua theo giới hạn kích thước                                                         | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                       |
| Tệp đính kèm được chuyển tiếp/chia sẻ           | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo khả năng tốt nhất                       | Chia sẻ lại trực tiếp trong luồng OpenClaw                                   |
| Tệp đính kèm PDF                        | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua thị giác hình ảnh  | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF   |

### Tài liệu liên quan

- [Đường ống hiểu phương tiện](/vi/nodes/media-understanding)
- [Công cụ PDF](/vi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — bật thị giác cho tệp đính kèm Slack
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
    Định tuyến tin nhắn đầu vào đến tác tử.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và gia cố bảo mật.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Bố cục cấu hình và thứ tự ưu tiên.
  </Card>
  <Card title="Lệnh slash" icon="terminal" href="/vi/tools/slash-commands">
    Danh mục lệnh và hành vi.
  </Card>
</CardGroup>
