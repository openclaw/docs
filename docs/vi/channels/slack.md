---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket, HTTP hoặc chuyển tiếp của Slack
summary: Thiết lập Slack và hành vi thời gian chạy (Socket Mode, URL yêu cầu HTTP và chế độ chuyển tiếp)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Sẵn sàng cho production với DM và kênh thông qua tích hợp ứng dụng Slack. Chế độ mặc định là Socket Mode; URL yêu cầu HTTP cũng được hỗ trợ. Chế độ relay dành cho các triển khai được quản lý, nơi một router đáng tin cậy sở hữu luồng vào Slack.

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

## Chọn Socket Mode hoặc URL yêu cầu HTTP

Cả hai transport đều sẵn sàng cho production và đạt tương đương tính năng cho nhắn tin, lệnh slash, App Home và tương tác. Hãy chọn theo mô hình triển khai, không phải theo tính năng.

| Mối quan tâm                 | Socket Mode (mặc định)                                                                                                                               | URL yêu cầu HTTP                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway công khai        | Không bắt buộc                                                                                                                                       | Bắt buộc (DNS, TLS, reverse proxy hoặc tunnel)                                                                 |
| Mạng outbound                | Phải truy cập được WSS outbound tới `wss-primary.slack.com`                                                                                          | Không có WS outbound; chỉ HTTPS inbound                                                                        |
| Token cần thiết              | Bot token + App-Level Token với `connections:write`                                                                                                  | Bot token + Signing Secret                                                                                     |
| Laptop dev / sau firewall    | Hoạt động ngay                                                                                                                                       | Cần tunnel công khai (ngrok, Cloudflare Tunnel, Tailscale Funnel) hoặc Gateway staging                         |
| Mở rộng ngang                | Một phiên Socket Mode cho mỗi ứng dụng trên mỗi host; nhiều Gateway cần các ứng dụng Slack riêng                                                     | Handler POST phi trạng thái; nhiều bản sao Gateway có thể dùng chung một ứng dụng sau load balancer            |
| Nhiều tài khoản trên một Gateway | Được hỗ trợ; mỗi tài khoản mở WS riêng                                                                                                           | Được hỗ trợ; mỗi tài khoản cần `webhookPath` duy nhất (mặc định `/slack/events`) để các đăng ký không xung đột |
| Transport cho lệnh slash     | Được gửi qua kết nối WS; `slash_commands[].url` bị bỏ qua                                                                                            | Slack POST tới `slash_commands[].url`; trường này bắt buộc để lệnh được dispatch                               |
| Ký yêu cầu                   | Không dùng (xác thực là App-Level Token)                                                                                                             | Slack ký mọi yêu cầu; OpenClaw xác minh bằng `signingSecret`                                                   |
| Khôi phục khi mất kết nối    | Tự động kết nối lại của Slack SDK được bật; OpenClaw cũng khởi động lại các phiên Socket Mode lỗi với backoff có giới hạn. Áp dụng tinh chỉnh transport theo pong-timeout. | Không có kết nối lâu dài để bị rớt; việc thử lại theo từng yêu cầu từ Slack                                    |

<Note>
  **Chọn Socket Mode** cho host một Gateway, laptop dev và mạng on-prem có thể truy cập outbound tới `*.slack.com` nhưng không thể nhận HTTPS inbound.

**Chọn URL yêu cầu HTTP** khi chạy nhiều bản sao Gateway sau load balancer, khi WSS outbound bị chặn nhưng HTTPS inbound được cho phép, hoặc khi bạn đã kết thúc Webhook Slack tại reverse proxy.
</Note>

### Chế độ relay

Chế độ relay tách luồng vào Slack khỏi gateway OpenClaw. Một router đáng tin cậy sở hữu
kết nối Slack Socket Mode duy nhất, chọn gateway đích và chuyển tiếp một sự kiện có kiểu
qua websocket đã xác thực. Gateway tiếp tục dùng bot token của nó cho các lệnh gọi Slack Web API
outbound.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL relay phải dùng `wss://` trừ khi trỏ tới localhost. Hãy xem bearer token và
bảng route của router là một phần của ranh giới ủy quyền Slack: các sự kiện được định tuyến đi vào
handler tin nhắn Slack thông thường như các kích hoạt đã được ủy quyền. `slack_identity` do router cung cấp
trong frame websocket `hello` có thể đặt tên người dùng và biểu tượng outbound mặc định; danh tính rõ ràng
do caller cung cấp vẫn được ưu tiên. Kết nối relay kết nối lại với cùng thời gian backoff
có giới hạn như Socket Mode và xóa danh tính do router cung cấp mỗi khi
ngắt kết nối.

## Cài đặt

Cài đặt Slack trước khi cấu hình kênh:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` đăng ký và bật Plugin. Plugin vẫn không làm gì cho đến khi bạn cấu hình ứng dụng Slack và cài đặt kênh bên dưới. Xem [Plugin](/vi/tools/plugin) để biết hành vi Plugin chung và quy tắc cài đặt.

## Thiết lập nhanh

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → **Next** → **Create**.

        <CodeGroup>

```json Khuyến nghị
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Khuyến nghị** khớp với toàn bộ bộ tính năng của Plugin Slack: App Home, lệnh slash, tệp, reaction, ghim, DM nhóm và đọc emoji/usergroup. Chọn **Tối thiểu** khi chính sách workspace giới hạn scope — cấu hình này bao phủ DM, lịch sử kênh/nhóm, mention và lệnh slash nhưng bỏ tệp, reaction, ghim, DM nhóm (`mpim:*`), `emoji:read` và `usergroups:read`. Xem [Danh sách kiểm tra manifest và scope](#manifest-and-scope-checklist) để biết lý do cho từng scope và các tùy chọn bổ sung như lệnh slash bổ sung.
        </Note>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: thêm `connections:write`, lưu, sao chép App-Level Token.
        - **Install App -> Install to Workspace**: sao chép Bot User OAuth Token.

      </Step>

      <Step title="Cấu hình OpenClaw">

        Thiết lập SecretRef được khuyến nghị:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Fallback env (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Tạo ứng dụng mới** → **Từ manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → thay `https://gateway-host.example.com/slack/events` bằng URL Gateway công khai của bạn → **Tiếp theo** → **Tạo**.

        <CodeGroup>

```json Đề xuất
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Đề xuất** khớp với toàn bộ bộ tính năng của Plugin Slack; **Tối thiểu** bỏ tệp, phản ứng, ghim, DM nhóm (`mpim:*`), `emoji:read` và `usergroups:read` cho các workspace hạn chế. Xem [Danh sách kiểm tra manifest và phạm vi](#manifest-and-scope-checklist) để biết lý do cho từng phạm vi.
        </Note>

        <Info>
          Ba trường URL (`slash_commands[].url`, `event_subscriptions.request_url` và `interactivity.request_url` / `message_menu_options_url`) đều trỏ đến cùng một endpoint OpenClaw. Lược đồ manifest của Slack yêu cầu đặt tên chúng riêng biệt, nhưng OpenClaw định tuyến theo loại payload nên chỉ cần một `webhookPath` duy nhất (mặc định `/slack/events`) là đủ. Các lệnh slash không có `slash_commands[].url` sẽ âm thầm không làm gì trong chế độ HTTP.
        </Info>

        Sau khi Slack tạo ứng dụng:

        - **Thông tin cơ bản → Thông tin xác thực ứng dụng**: sao chép **Signing Secret** để xác minh yêu cầu.
        - **Cài đặt ứng dụng -> Cài đặt vào workspace**: sao chép Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Thiết lập SecretRef được đề xuất:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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
        Dùng các đường dẫn Webhook duy nhất cho HTTP nhiều tài khoản

        Cấp cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không xung đột.
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

OpenClaw đặt thời gian chờ pong của ứng dụng khách Slack SDK mặc định là 15 giây cho Socket Mode. Chỉ ghi đè các thiết lập truyền tải khi bạn cần tinh chỉnh theo workspace hoặc máy chủ cụ thể:

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

Chỉ dùng thiết lập này cho các workspace Socket Mode ghi nhật ký timeout pong/server-ping của websocket Slack hoặc chạy trên các máy chủ đã biết có tình trạng thiếu hụt event loop. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi client ping; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện của ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu về trạng thái sống của truyền tải.

Ghi chú:

- `socketMode` bị bỏ qua trong chế độ HTTP Request URL.
- Các thiết lập `channels.slack.socketMode` cơ sở áp dụng cho tất cả tài khoản Slack trừ khi bị ghi đè. Ghi đè theo tài khoản dùng `channels.slack.accounts.<accountId>.socketMode`; vì đây là ghi đè đối tượng, hãy bao gồm mọi trường tinh chỉnh socket bạn muốn cho tài khoản đó.
- Chỉ `clientPingTimeout` có mặc định của OpenClaw (`15000`). `serverPingTimeout` và `pingPongLoggingEnabled` chỉ được truyền cho Slack SDK khi được cấu hình.
- Backoff khởi động lại Socket Mode bắt đầu khoảng 2 giây và giới hạn khoảng 30 giây. Các lỗi khởi động, chờ khởi động và ngắt kết nối có thể khôi phục sẽ thử lại cho đến khi kênh dừng. Các lỗi tài khoản và thông tin xác thực vĩnh viễn như xác thực không hợp lệ, token bị thu hồi hoặc thiếu phạm vi sẽ thất bại nhanh thay vì thử lại mãi mãi.

## Danh sách kiểm tra manifest và phạm vi

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Hiển thị các tính năng khác mở rộng các mặc định ở trên.

Manifest mặc định bật thẻ **Home** trong Slack App Home và đăng ký `app_home_opened`. Khi một thành viên workspace mở thẻ Home, OpenClaw phát hành một chế độ xem Home mặc định an toàn bằng `views.publish`; không có payload hội thoại hay cấu hình riêng tư nào được đưa vào. Thẻ **Messages** vẫn được bật cho Slack DM. Manifest cũng bật các luồng trợ lý Slack bằng `features.assistant_view`, `assistant:write`, `assistant_thread_started` và `assistant_thread_context_changed`; các luồng trợ lý được định tuyến tới phiên luồng OpenClaw riêng và giữ ngữ cảnh luồng do Slack cung cấp để agent sử dụng.

<AccordionGroup>
  <Accordion title="Lệnh slash gốc tùy chọn">

    Có thể dùng nhiều [lệnh slash gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình duy nhất, với vài điểm cần lưu ý:

    - Dùng `/agentstatus` thay vì `/status` vì lệnh `/status` đã được dành riêng.
    - Không thể cung cấp hơn 25 lệnh slash cùng lúc.

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
      <Tab title="URL yêu cầu HTTP">
        Dùng cùng danh sách `slash_commands` như Socket Mode ở trên, và thêm `"url": "https://gateway-host.example.com/slack/events"` vào từng mục. Ví dụ:

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
- Chế độ Relay yêu cầu `botToken` cùng với `relay.url`, `relay.authToken` và `relay.gatewayId`; chế độ này không dùng app token hay signing secret.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` và `userToken` chấp nhận chuỗi văn bản thuần
  hoặc đối tượng SecretRef.
- Token cấu hình ghi đè env fallback.
- Env fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` chỉ có trong cấu hình (không có env fallback) và mặc định là hành vi chỉ đọc (`userTokenReadOnly: true`).

Hành vi ảnh chụp trạng thái:

- Việc kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status`
  theo từng thông tin xác thực (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable` hoặc `missing`.
- `configured_unavailable` nghĩa là tài khoản được cấu hình thông qua SecretRef
  hoặc một nguồn bí mật không inline khác, nhưng đường dẫn lệnh/runtime hiện tại
  không thể phân giải giá trị thực tế.
- Trong chế độ HTTP, `signingSecretStatus` được đưa vào; trong Socket Mode,
  cặp bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với thao tác đọc hành động/thư mục, user token có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, bot token vẫn được ưu tiên; thao tác ghi bằng user-token chỉ được phép khi `userTokenReadOnly: false` và bot token không khả dụng.
</Tip>

## Hành động và cổng kiểm soát

Các hành động Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm hành động có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Các hành động tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack được hiển thị trong placeholder tệp đầu vào và trả về bản xem trước hình ảnh cho hình ảnh hoặc siêu dữ liệu tệp cục bộ cho các loại tệp khác.

## Kiểm soát truy cập và định tuyến

  <Tabs>
  <Tab title="Chính sách DM">
    `channels.slack.dmPolicy` kiểm soát quyền truy cập DM. `channels.slack.allowFrom` là danh sách cho phép DM chuẩn.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`)
    - `disabled`

    Cờ DM:

    - `dm.enabled` (mặc định là true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (cũ)
    - `dm.groupEnabled` (DM nhóm mặc định là false)
    - `dm.groupChannels` (danh sách cho phép MPIM tùy chọn)

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Các tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` riêng của chúng chưa được đặt.
    - Các tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể làm vậy mà không thay đổi quyền truy cập.

    Ghép đôi trong DM dùng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát cách xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm trong `channels.slack.channels` và **phải dùng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Lưu ý thời gian chạy: nếu `channels.slack` hoàn toàn bị thiếu (thiết lập chỉ bằng env), thời gian chạy sẽ quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Phân giải tên/ID:

    - các mục danh sách cho phép kênh và danh sách cho phép DM được phân giải khi khởi động nếu quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên như cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - ủy quyền đầu vào và định tuyến kênh mặc định ưu tiên ID; khớp trực tiếp theo tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

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

  <Tab title="Lượt nhắc đến và người dùng kênh">
    Tin nhắn kênh mặc định yêu cầu có lượt nhắc đến.

    Nguồn nhắc đến:

    - nhắc đến ứng dụng rõ ràng (`<@botId>`)
    - nhắc đến nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - mẫu regex nhắc đến (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi luồng trả lời bot ngầm định (bị tắt khi `thread.requireExplicitMention` là `true`)

    Điều khiển theo từng kênh (`channels.slack.channels.<id>`; tên chỉ qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: ký tự đại diện `channel:`, `id:`, `e164:`, `username:`, `name:`, hoặc `"*"`
      (các khóa cũ không có tiền tố vẫn chỉ ánh xạ sang `id:`)

    `allowBots` thận trọng với kênh và kênh riêng tư: tin nhắn phòng do bot tạo chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên phòng. Ký tự đại diện và mục chủ sở hữu dạng tên hiển thị không đáp ứng điều kiện hiện diện của chủ sở hữu. Sự hiện diện của chủ sở hữu dùng Slack `conversations.members`; hãy đảm bảo ứng dụng có phạm vi đọc phù hợp với loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu tra cứu thành viên thất bại, OpenClaw loại bỏ tin nhắn phòng do bot tạo.

    Tin nhắn Slack do bot tạo được chấp nhận dùng chung [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection). Cấu hình `channels.defaults.botLoopProtection` cho ngân sách mặc định, rồi ghi đè bằng `channels.slack.botLoopProtection` hoặc `channels.slack.channels.<id>.botLoopProtection` khi một không gian làm việc hoặc kênh cần giới hạn khác.

  </Tab>
</Tabs>

## Luồng thảo luận, phiên và thẻ trả lời

- DM định tuyến là `direct`; kênh là `channel`; MPIM là `group`.
- Ràng buộc tuyến Slack chấp nhận ID đối tượng thô cùng các dạng mục tiêu Slack như `channel:C12345678`, `user:U12345678` và `<@U12345678>`.
- Với mặc định `session.dmScope=main`, DM Slack được gộp vào phiên chính của tác nhân.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Tin nhắn kênh cấp cao nhất thông thường vẫn nằm trong phiên theo kênh, ngay cả khi `replyToMode` không phải `off`.
- Trả lời trong luồng Slack dùng `thread_ts` Slack của cha cho hậu tố phiên (`:thread:<threadTs>`), ngay cả khi luồng trả lời gửi ra bị tắt bằng `replyToMode="off"`.
- OpenClaw gieo một gốc kênh cấp cao nhất đủ điều kiện vào `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` khi gốc đó dự kiến sẽ bắt đầu một luồng Slack hiển thị, để gốc và các trả lời luồng sau này dùng chung một phiên OpenClaw. Điều này áp dụng cho sự kiện `app_mention`, khớp đề cập bot rõ ràng hoặc mẫu đề cập đã cấu hình, và các kênh `requireMention: false` có `replyToMode` không phải `off`.
- Mặc định của `channels.slack.thread.historyScope` là `thread`; mặc định của `thread.inheritParent` là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn luồng hiện có được lấy khi một phiên luồng mới bắt đầu (mặc định `20`; đặt `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi `true`, chặn đề cập luồng ngầm định để bot chỉ phản hồi các đề cập `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng. Nếu không có tùy chọn này, các trả lời trong luồng có bot tham gia sẽ bỏ qua cổng `requireMention`.

Điều khiển luồng trả lời:

- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- dự phòng cũ cho trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Đối với trả lời luồng Slack rõ ràng từ công cụ `message`, đặt `replyBroadcast: true` với `action: "send"` và `threadId` hoặc `replyTo` để yêu cầu Slack cũng phát trả lời luồng tới kênh cha. Điều này ánh xạ tới cờ `reply_broadcast` của Slack `chat.postMessage` và chỉ được hỗ trợ cho gửi văn bản hoặc Block Kit, không hỗ trợ tải lên phương tiện.

Khi một lệnh gọi công cụ `message` chạy bên trong luồng Slack và nhắm tới cùng kênh, OpenClaw thường kế thừa luồng Slack hiện tại theo `replyToMode`. Đặt `topLevel: true` trên `action: "send"` hoặc `action: "upload-file"` để buộc tạo tin nhắn mới ở kênh cha. `threadId: null` được chấp nhận như cùng một cách chọn không tham gia cấp cao nhất.

<Note>
`replyToMode="off"` tắt luồng trả lời Slack gửi ra, bao gồm các thẻ `[[reply_to_*]]` rõ ràng. Nó không làm phẳng các phiên luồng Slack đi vào: tin nhắn đã được đăng bên trong một luồng Slack vẫn định tuyến tới phiên `:thread:<threadTs>`. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tôn trọng ở chế độ `"off"`. Luồng Slack ẩn tin nhắn khỏi kênh trong khi trả lời Telegram vẫn hiển thị nội tuyến.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đi vào. `ackReactionScope` quyết định _khi nào_ emoji đó thực sự được gửi.

### Emoji (`ackReaction`)

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- dự phòng emoji danh tính tác nhân (`agents.list[].identity.emoji`, nếu không thì `"eyes"` / 👀)

Ghi chú:

- Slack kỳ vọng mã ngắn (ví dụ `"eyes"`).
- Dùng `""` để tắt phản ứng cho tài khoản Slack hoặc toàn cục.

### Phạm vi (`messages.ackReactionScope`)

Nhà cung cấp Slack đọc phạm vi từ `messages.ackReactionScope` (mặc định `"group-mentions"`). Hiện không có ghi đè ở cấp tài khoản Slack hoặc kênh Slack; giá trị này là toàn cục cho Gateway.

Giá trị:

- `"all"`: phản ứng trong DM và nhóm.
- `"direct"`: chỉ phản ứng trong DM.
- `"group-all"`: phản ứng trên mọi tin nhắn nhóm (không có DM).
- `"group-mentions"` (mặc định): phản ứng trong nhóm, nhưng chỉ khi bot được đề cập (hoặc trong các mục có thể được đề cập trong nhóm đã chọn tham gia). **DM bị loại trừ.**
- `"off"` / `"none"`: không bao giờ phản ứng.

<Note>
Phạm vi mặc định (`"group-mentions"`) không kích hoạt phản ứng xác nhận trong tin nhắn trực tiếp. Để thấy `ackReaction` đã cấu hình (ví dụ `"eyes"`) trên DM Slack đi vào, đặt `messages.ackReactionScope` thành `"direct"` hoặc `"all"`. `messages.ackReactionScope` được đọc khi nhà cung cấp Slack khởi động, vì vậy cần khởi động lại Gateway để thay đổi có hiệu lực.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Phát trực tuyến văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt phát trực tuyến bản xem trước trực tiếp.
- `partial` (mặc định): thay văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo khối.
- `progress`: hiển thị văn bản trạng thái tiến trình trong khi tạo, rồi gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi bản xem trước nháp đang hoạt động, định tuyến các cập nhật công cụ/tiến trình vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ các tin nhắn công cụ/tiến trình riêng.
- `streaming.preview.commandText` / `streaming.progress.commandText`: đặt thành `status` để giữ các dòng tiến trình công cụ gọn trong khi ẩn văn bản lệnh/thực thi thô (mặc định: `raw`).

Ẩn văn bản lệnh/thực thi thô trong khi giữ các dòng tiến trình gọn:

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

`channels.slack.streaming.nativeTransport` kiểm soát phát trực tuyến văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

Thẻ tác vụ tiến trình gốc của Slack là tùy chọn tham gia cho chế độ tiến trình. Đặt `channels.slack.streaming.progress.nativeTaskCards` thành `true` với `channels.slack.streaming.mode="progress"` để gửi thẻ kế hoạch/tác vụ gốc Slack trong khi công việc đang chạy, rồi cập nhật cùng thẻ tác vụ đó khi hoàn tất. Nếu không có cờ này, chế độ tiến trình giữ hành vi xem trước nháp di động.

- Phải có luồng trả lời để phát trực tuyến văn bản gốc và trạng thái luồng Slack assistant xuất hiện. Việc chọn luồng vẫn theo `replyToMode`.
- Gốc kênh, trò chuyện nhóm và DM cấp cao nhất vẫn có thể dùng bản xem trước nháp bình thường khi phát trực tuyến gốc không khả dụng hoặc không tồn tại luồng trả lời.
- DM Slack cấp cao nhất mặc định nằm ngoài luồng, nên chúng không hiển thị bản xem trước luồng/trạng thái gốc kiểu luồng của Slack; thay vào đó OpenClaw đăng và chỉnh sửa bản xem trước nháp trong DM.
- Phương tiện và tải trọng không phải văn bản quay về cơ chế gửi bình thường.
- Kết quả cuối cùng là phương tiện/lỗi sẽ hủy các chỉnh sửa xem trước đang chờ; kết quả cuối cùng dạng văn bản/khối đủ điều kiện chỉ được xả khi có thể chỉnh sửa trực tiếp bản xem trước.
- Nếu phát trực tuyến thất bại giữa chừng khi trả lời, OpenClaw quay về cơ chế gửi bình thường cho các tải trọng còn lại.

Dùng bản xem trước nháp thay vì phát trực tuyến văn bản gốc Slack:

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

Chọn tham gia thẻ tác vụ tiến trình gốc Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Khóa cũ:

- `channels.slack.streamMode` (`replace | status_final | append`) là bí danh runtime cũ cho `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` là bí danh runtime cũ cho `channels.slack.streaming.mode` và `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` cũ là bí danh runtime cho `channels.slack.streaming.nativeTransport`.
- Chạy `openclaw doctor --fix` để ghi lại cấu hình phát trực tuyến Slack đã lưu thành các khóa chuẩn.

## Dự phòng phản ứng đang nhập

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đi vào trong khi OpenClaw đang xử lý trả lời, rồi xóa phản ứng đó khi lượt chạy kết thúc. Tùy chọn này hữu ích nhất bên ngoài các trả lời theo luồng, vốn dùng chỉ báo trạng thái mặc định "đang nhập...".

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack kỳ vọng mã ngắn (ví dụ `"hourglass_flowing_sand"`).
- Phản ứng được thực hiện theo khả năng tốt nhất và quá trình dọn dẹp được tự động thử sau khi trả lời hoặc đường dẫn thất bại hoàn tất.

## Phương tiện, chia khúc và gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm đi vào">
    Tệp đính kèm Slack được tải xuống từ URL riêng tư do Slack lưu trữ (luồng yêu cầu xác thực bằng token) và được ghi vào kho phương tiện khi lấy thành công và giới hạn kích thước cho phép. Placeholder tệp bao gồm Slack `fileId` để tác nhân có thể lấy tệp gốc bằng `download-file`.

    Tải xuống dùng thời gian chờ nhàn rỗi và tổng thời gian có giới hạn. Nếu việc lấy tệp Slack bị treo hoặc thất bại, OpenClaw tiếp tục xử lý tin nhắn và quay về placeholder tệp.

    Giới hạn kích thước đi vào runtime mặc định là `20MB` trừ khi được ghi đè bằng `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi ra">
    - khúc văn bản dùng `channels.slack.textChunkLimit` (mặc định 4000)
    - `channels.slack.chunkMode="newline"` bật chia tách ưu tiên đoạn văn
    - gửi tệp dùng API tải lên của Slack và có thể bao gồm trả lời theo luồng (`thread_ts`)
    - giới hạn phương tiện gửi ra theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, gửi qua kênh dùng mặc định theo loại MIME từ pipeline phương tiện

  </Accordion>

  <Accordion title="Mục tiêu gửi">
    Mục tiêu rõ ràng ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ văn bản/khối có thể đăng trực tiếp tới ID người dùng; tải lên tệp và gửi theo luồng mở DM qua API hội thoại Slack trước vì các đường dẫn đó cần một ID hội thoại cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi dấu gạch chéo

Lệnh dấu gạch chéo xuất hiện trong Slack dưới dạng một lệnh đã cấu hình duy nhất hoặc nhiều lệnh gốc. Cấu hình `channels.slack.slashCommand` để thay đổi mặc định lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Lệnh gốc yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động lệnh gốc đang **tắt** cho Slack, nên `commands.native: "auto"` không bật lệnh gốc Slack.

```txt
/help
```

Menu đối số gốc dùng chiến lược render thích ứng, hiển thị modal xác nhận trước khi gửi giá trị tùy chọn đã chọn:

- tối đa 5 tùy chọn: khối nút
- 6-100 tùy chọn: menu chọn tĩnh
- hơn 100 tùy chọn: chọn bên ngoài với lọc tùy chọn bất đồng bộ khi có trình xử lý tùy chọn tương tác
- vượt quá giới hạn Slack: giá trị tùy chọn đã mã hóa quay về nút

```txt
/think
```

Các phiên slash dùng khóa cô lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến việc thực thi lệnh đến phiên hội thoại đích bằng `CommandTargetSessionKey`.

## Phản hồi tương tác

Slack có thể kết xuất các điều khiển phản hồi tương tác do agent tạo, nhưng tính năng này bị tắt theo mặc định.
Với đầu ra mới từ agent, CLI và Plugin, hãy ưu tiên các nút `presentation` dùng chung hoặc các khối chọn. Chúng dùng cùng đường dẫn tương tác Slack đồng thời vẫn suy giảm phù hợp trên các kênh khác.

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

Khi được bật, agent vẫn có thể phát ra các chỉ thị phản hồi chỉ dành cho Slack đã không còn được khuyến nghị:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn trở lại qua đường dẫn sự kiện tương tác Slack hiện có. Giữ chúng cho các prompt cũ và các lối thoát riêng cho Slack; dùng presentation dùng chung cho các điều khiển di động mới.

Các API biên dịch chỉ thị cũng không còn được khuyến nghị cho mã producer mới:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Dùng payload `presentation` và `buildSlackPresentationBlocks(...)` cho các điều khiển mới được Slack kết xuất.

Ghi chú:

- Đây là UI kế thừa riêng cho Slack. Các kênh khác không chuyển dịch chỉ thị Slack Block Kit thành hệ thống nút riêng của chúng.
- Các giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các khối tương tác được tạo vượt quá giới hạn Slack Block Kit, OpenClaw sẽ quay về phản hồi văn bản gốc thay vì gửi payload khối không hợp lệ.

### Gửi modal do Plugin sở hữu

Các Plugin Slack đăng ký trình xử lý tương tác cũng có thể nhận các sự kiện vòng đời modal `view_submission` và `view_closed` trước khi OpenClaw nén payload cho sự kiện hệ thống hiển thị với agent. Dùng một trong các mẫu định tuyến này khi mở modal Slack:

- Đặt `callback_id` thành `openclaw:<namespace>:<payload>`.
- Hoặc giữ `callback_id` hiện có và đặt `pluginInteractiveData:
"<namespace>:<payload>"` trong `private_metadata` của modal.

Trình xử lý nhận `ctx.interaction.kind` là `view_submission` hoặc `view_closed`, `inputs` đã chuẩn hóa, và toàn bộ đối tượng `stateValues` thô từ Slack. Chỉ định tuyến bằng callback ID là đủ để gọi trình xử lý Plugin; hãy bao gồm các trường định tuyến người dùng/phiên `private_metadata` hiện có của modal khi modal cũng cần tạo sự kiện hệ thống hiển thị với agent. Agent nhận một sự kiện hệ thống `Slack interaction: ...` gọn, đã biên tập. Nếu trình xử lý trả về `systemEvent.summary`, `systemEvent.reference`, hoặc `systemEvent.data`, các trường đó được đưa vào sự kiện gọn đó để agent có thể tham chiếu bộ nhớ do Plugin sở hữu mà không thấy toàn bộ payload biểu mẫu.

## Phê duyệt gốc trong Slack

Slack có thể hoạt động như một ứng dụng phê duyệt gốc với các nút và tương tác, thay vì quay về Web UI hoặc terminal.

- Phê duyệt exec và Plugin có thể kết xuất dưới dạng prompt Slack-native Block Kit.
- `channels.slack.execApprovals.*` vẫn là cấu hình bật ứng dụng phê duyệt exec gốc và định tuyến DM/kênh.
- DM phê duyệt exec dùng `channels.slack.execApprovals.approvers` hoặc `commands.ownerAllowFrom`.
- Phê duyệt Plugin dùng nút Slack-native khi Slack được bật làm ứng dụng phê duyệt gốc cho phiên khởi tạo, hoặc khi `approvals.plugin` định tuyến đến phiên Slack khởi tạo hoặc một đích Slack.
- DM phê duyệt Plugin dùng người phê duyệt Plugin Slack từ `channels.slack.allowFrom`, `allowFrom` theo tài khoản được đặt tên, hoặc tuyến mặc định của tài khoản.
- Ủy quyền người phê duyệt vẫn được thực thi: người phê duyệt chỉ dành cho exec không thể phê duyệt yêu cầu Plugin trừ khi họ cũng là người phê duyệt Plugin.

Cơ chế này dùng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong cài đặt ứng dụng Slack của bạn, prompt phê duyệt kết xuất trực tiếp trong cuộc hội thoại dưới dạng nút Block Kit.
Khi các nút đó xuất hiện, chúng là UX phê duyệt chính; OpenClaw chỉ nên bao gồm lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt exec gốc khi `enabled` chưa được đặt hoặc là `"auto"` và phân giải được ít nhất một người phê duyệt exec. Slack cũng có thể xử lý phê duyệt Plugin gốc qua đường dẫn ứng dụng gốc này khi người phê duyệt Plugin Slack được phân giải và yêu cầu khớp với các bộ lọc ứng dụng gốc. Đặt `enabled: false` để tắt rõ ràng Slack làm ứng dụng phê duyệt gốc. Đặt `enabled: true` để bắt buộc bật phê duyệt gốc khi người phê duyệt được phân giải. Việc tắt phê duyệt exec Slack không tắt việc gửi phê duyệt Plugin Slack gốc được bật qua `approvals.plugin`; việc gửi phê duyệt Plugin dùng người phê duyệt Plugin Slack thay thế.

Hành vi mặc định khi không có cấu hình phê duyệt exec Slack rõ ràng:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Cấu hình Slack-native rõ ràng chỉ cần thiết khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc, hoặc chọn tham gia gửi đến chat khởi nguồn:

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

Chuyển tiếp `approvals.exec` dùng chung là riêng biệt. Chỉ dùng khi prompt phê duyệt exec cũng phải định tuyến đến các cuộc chat khác hoặc các đích ngoài băng rõ ràng. Chuyển tiếp `approvals.plugin` dùng chung cũng riêng biệt; gửi gốc của Slack chỉ chặn đường dự phòng đó khi Slack có thể xử lý yêu cầu phê duyệt Plugin theo cách gốc.

`/approve` trong cùng chat cũng hoạt động trong các kênh Slack và DM đã hỗ trợ lệnh. Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Phát sóng chuỗi thảo luận (phản hồi chuỗi thảo luận "Also send to channel") được xử lý như tin nhắn người dùng bình thường.
- Sự kiện thêm/xóa phản ứng được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời đi, kênh được tạo/đổi tên, và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- `channel_id_changed` có thể di chuyển khóa cấu hình kênh khi `configWrites` được bật.
- Siêu dữ liệu chủ đề/mục đích của kênh được xem là ngữ cảnh không đáng tin cậy và có thể được chèn vào ngữ cảnh định tuyến.
- Người bắt đầu chuỗi thảo luận và việc gieo ngữ cảnh lịch sử chuỗi ban đầu được lọc theo danh sách cho phép người gửi đã cấu hình khi áp dụng.
- Hành động khối, lối tắt và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - hành động khối: giá trị đã chọn, nhãn, giá trị bộ chọn, và siêu dữ liệu `workflow_*`
  - lối tắt toàn cục: siêu dữ liệu callback và actor, được định tuyến đến phiên trực tiếp của actor
  - lối tắt tin nhắn: callback, actor, kênh, chuỗi thảo luận, và ngữ cảnh tin nhắn đã chọn
  - sự kiện modal `view_submission` và `view_closed` với siêu dữ liệu kênh đã định tuyến và đầu vào biểu mẫu

Định nghĩa lối tắt toàn cục hoặc tin nhắn trong cấu hình ứng dụng Slack của bạn và dùng bất kỳ callback ID không rỗng nào. OpenClaw xác nhận các payload lối tắt khớp, áp dụng cùng chính sách người gửi DM/kênh như các tương tác Slack khác, và đưa sự kiện đã làm sạch vào hàng đợi cho phiên agent được định tuyến. Trigger ID và URL phản hồi được biên tập khỏi ngữ cảnh agent.

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="Các trường Slack tín hiệu cao">

- chế độ/xác thực: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (kế thừa: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- công tắc tương thích: `dangerouslyAllowNameMatching` (phá kính khi khẩn cấp; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- chuỗi thảo luận/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- gửi đi: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- mở rộng liên kết: `unfurlLinks` (mặc định: `false`), `unfurlMedia` để kiểm soát xem trước liên kết/phương tiện của `chat.postMessage`; đặt `unfurlLinks: true` để chọn bật lại xem trước liên kết
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong kênh">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - danh sách cho phép kênh (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên sẽ âm thầm thất bại dưới `groupPolicy: "allowlist"` vì định tuyến kênh mặc định ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - danh sách cho phép `users` theo kênh
    - `messages.groupChat.visibleReplies`: yêu cầu nhóm/kênh bình thường mặc định là `"automatic"`. Nếu bạn đã chọn `"message_tool"` và nhật ký hiển thị văn bản assistant nhưng không có lệnh gọi `message(action=send)`, mô hình đã bỏ lỡ đường dẫn công cụ tin nhắn hiển thị. Văn bản cuối vẫn riêng tư trong chế độ này; kiểm tra nhật ký Gateway chi tiết để xem siêu dữ liệu payload bị chặn, hoặc đặt thành `"automatic"` nếu bạn muốn mọi phản hồi cuối bình thường của assistant được đăng qua đường dẫn kế thừa.
    - `messages.groupChat.unmentionedInbound`: nếu là `"room_event"`, trò chuyện kênh được cho phép nhưng không nhắc tên là ngữ cảnh xung quanh và vẫn im lặng trừ khi agent gọi công cụ `message`. Xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - phê duyệt ghép nối / mục danh sách cho phép (`dmPolicy: "open"` vẫn yêu cầu `channels.slack.allowFrom: ["*"]`)
    - DM nhóm dùng xử lý MPIM; bật `channels.slack.dm.groupEnabled` và, nếu đã cấu hình, bao gồm MPIM trong `channels.slack.dm.groupChannels`
    - Sự kiện DM Slack Assistant: nhật ký chi tiết nhắc đến `drop message_changed`
      thường nghĩa là Slack đã gửi sự kiện chuỗi Assistant đã chỉnh sửa mà không có
      người gửi là con người có thể khôi phục trong siêu dữ liệu tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Chế độ Socket không kết nối">
    Xác thực bot + token ứng dụng và việc bật Socket Mode trong cài đặt ứng dụng Slack.
    App-Level Token cần `connections:write`, và token bot Bot User OAuth Token
    phải thuộc cùng ứng dụng Slack/workspace với token ứng dụng.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng runtime hiện tại không thể phân giải giá trị dựa trên SecretRef.

    Các nhật ký như `slack socket mode failed to start; retry ...` là lỗi khởi động
    có thể khôi phục. Thiếu scope, token bị thu hồi và xác thực không hợp lệ sẽ
    thất bại nhanh thay vào đó. Nhật ký `slack token mismatch ...` nghĩa là token bot và token ứng dụng
    có vẻ thuộc về các ứng dụng Slack khác nhau; hãy sửa thông tin xác thực của ứng dụng Slack.

  </Accordion>

  <Accordion title="Chế độ HTTP không nhận được sự kiện">
    Xác thực:

    - signing secret
    - đường dẫn Webhook
    - URL Yêu cầu Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP
    - URL công khai kết thúc TLS và chuyển tiếp yêu cầu đến đường dẫn Gateway
    - đường dẫn `request_url` của ứng dụng Slack khớp chính xác với `channels.slack.webhookPath` (mặc định `/slack/events`)

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong ảnh chụp nhanh
    tài khoản, tài khoản HTTP đã được cấu hình nhưng runtime hiện tại không thể
    phân giải signing secret được SecretRef hỗ trợ.

    Nhật ký `slack: webhook path ... already registered` lặp lại nghĩa là hai tài khoản HTTP
    đang dùng cùng một `webhookPath`; hãy cấp cho mỗi tài khoản một đường dẫn riêng.

  </Accordion>

  <Accordion title="Lệnh native/slash không kích hoạt">
    Xác minh bạn có ý định dùng:

    - chế độ lệnh native (`channels.slack.commands.native: true`) với các lệnh slash tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh slash (`channels.slack.slashCommand.enabled: true`)

    Slack không tự động tạo hoặc xóa lệnh slash. `commands.native: "auto"` không bật lệnh native của Slack; hãy dùng `true` và tạo các lệnh tương ứng trong ứng dụng Slack. Ở chế độ HTTP, mọi lệnh slash của Slack phải bao gồm URL Gateway. Trong Socket Mode, payload lệnh đến qua websocket và Slack bỏ qua `slash_commands[].url`.

    Cũng hãy kiểm tra `commands.useAccessGroups`, ủy quyền DM, danh sách cho phép kênh,
    và danh sách cho phép `users` theo từng kênh. Slack trả về lỗi tạm thời cho
    người gửi lệnh slash bị chặn, bao gồm:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Tham chiếu vision cho tệp đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt tác tử khi tải xuống tệp Slack thành công và giới hạn kích thước cho phép. Tệp ảnh có thể được truyền qua đường dẫn hiểu phương tiện hoặc trực tiếp đến mô hình trả lời có khả năng vision; các tệp khác được giữ lại dưới dạng ngữ cảnh tệp có thể tải xuống thay vì được xử lý như đầu vào ảnh.

### Loại phương tiện được hỗ trợ

| Loại phương tiện                | Nguồn                | Hành vi hiện tại                                                                 | Ghi chú                                                                   |
| ------------------------------- | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Ảnh JPEG / PNG / GIF / WebP     | URL tệp Slack        | Được tải xuống và đính kèm vào lượt để xử lý có khả năng vision                  | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)            |
| Tệp PDF                         | URL tệp Slack        | Được tải xuống và hiển thị dưới dạng ngữ cảnh tệp cho công cụ như `download-file` hoặc `pdf` | Đầu vào Slack không tự động chuyển đổi PDF thành đầu vào image-vision      |
| Tệp khác                        | URL tệp Slack        | Được tải xuống khi có thể và hiển thị dưới dạng ngữ cảnh tệp                     | Tệp nhị phân không được xử lý như đầu vào ảnh                              |
| Trả lời trong chuỗi             | Tệp của tin nhắn mở đầu chuỗi | Tệp của tin nhắn gốc có thể được hydrate làm ngữ cảnh khi câu trả lời không có phương tiện trực tiếp | Tin nhắn mở đầu chỉ có tệp dùng một placeholder tệp đính kèm              |
| Tin nhắn nhiều ảnh              | Nhiều tệp Slack      | Mỗi tệp được đánh giá độc lập                                                     | Xử lý Slack được giới hạn ở tám tệp mỗi tin nhắn                           |

### Pipeline đầu vào

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng token bot.
2. Tệp được ghi vào kho phương tiện khi thành công.
3. Đường dẫn phương tiện đã tải xuống và loại nội dung được thêm vào ngữ cảnh đầu vào.
4. Các đường dẫn mô hình/công cụ có khả năng xử lý ảnh có thể dùng tệp đính kèm ảnh từ ngữ cảnh đó.
5. Tệp không phải ảnh vẫn khả dụng dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho các công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc chuỗi

Khi một tin nhắn đến trong một chuỗi (có cha `thread_ts`):

- Nếu bản thân câu trả lời không có phương tiện trực tiếp và tin nhắn gốc được bao gồm có tệp, Slack có thể hydrate các tệp gốc làm ngữ cảnh mở đầu chuỗi.
- Tệp đính kèm trực tiếp của câu trả lời được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng một placeholder tệp đính kèm để fallback vẫn có thể bao gồm các tệp của nó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack duy nhất chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua pipeline phương tiện.
- Tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý theo thứ tự tệp của Slack trong payload sự kiện.
- Lỗi tải xuống của một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Lỗi tải xuống**: Các tệp mà Slack không thể phục vụ, URL hết hạn, tệp không truy cập được, tệp quá kích thước, và phản hồi HTML xác thực/đăng nhập Slack sẽ bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Mô hình vision**: Phân tích ảnh dùng mô hình trả lời đang hoạt động khi mô hình đó hỗ trợ vision, hoặc mô hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Kịch bản                              | Hành vi hiện tại                                                            | Cách xử lý tạm thời                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL tệp Slack hết hạn                 | Tệp bị bỏ qua; không hiển thị lỗi                                           | Tải lại tệp lên Slack                                                      |
| Chưa cấu hình mô hình vision          | Tệp đính kèm ảnh được lưu dưới dạng tham chiếu phương tiện, nhưng không được phân tích như ảnh | Cấu hình `agents.defaults.imageModel` hoặc dùng mô hình trả lời có khả năng vision |
| Ảnh rất lớn (> 20 MB theo mặc định)   | Bị bỏ qua theo giới hạn kích thước                                          | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                        |
| Tệp đính kèm được chuyển tiếp/chia sẻ | Văn bản và phương tiện ảnh/tệp do Slack lưu trữ được xử lý với nỗ lực tốt nhất | Chia sẻ lại trực tiếp trong chuỗi OpenClaw                                 |
| Tệp đính kèm PDF                      | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động định tuyến qua image vision | Dùng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF |

### Tài liệu liên quan

- [Pipeline hiểu phương tiện](/vi/nodes/media-understanding)
- [Công cụ PDF](/vi/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Bật vision cho tệp đính kèm Slack
- Kiểm thử hồi quy: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Xác minh trực tiếp: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Slack với gateway.
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
