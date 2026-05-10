---
read_when:
    - 設定 Slack 或偵錯 Slack socket/HTTP 模式
summary: Slack 設定與執行階段行為（Socket 模式 + HTTP 請求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

可透過 Slack app 整合用於 DM 和頻道，已可投入生產環境。預設模式為 Socket Mode；也支援 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Slack DM 預設使用配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
</CardGroup>

## 選擇 Socket Mode 或 HTTP Request URLs

兩種傳輸方式都已可投入生產環境，並且在傳訊、斜線命令、App Home 和互動性方面達到功能一致。請依部署型態選擇，而不是依功能選擇。

| 考量                       | Socket Mode（預設）                                                                  | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不需要                                                                               | 需要（DNS、TLS、反向代理或通道）                                                                               |
| 對外網路                     | 必須能連線到 `wss-primary.slack.com` 的對外 WSS                                      | 無對外 WS；僅限傳入 HTTPS                                                                                      |
| 需要的權杖                   | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) 並具備 `connections:write`       | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| 開發筆電 / 防火牆後方        | 可直接運作                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或暫存環境 Gateway                                   |
| 水平擴充                     | 每個主機上的每個 app 一個 Socket Mode 工作階段；多個 Gateway 需要不同的 Slack app     | 無狀態 POST 處理器；多個 Gateway 複本可在負載平衡器後方共用一個 app                                           |
| 單一 Gateway 上多帳號        | 支援；每個帳號會開啟自己的 WS                                                        | 支援；每個帳號需要唯一的 `webhookPath`（預設 `/slack/events`），避免註冊互相衝突                              |
| 斜線命令傳輸                 | 透過 WS 連線傳遞；會忽略 `slash_commands[].url`                                      | Slack POST 到 `slash_commands[].url`；此欄位是命令分派所必需                                                 |
| 請求簽章                     | 不使用（驗證使用 App-Level Token）                                                   | Slack 會為每個請求簽章；OpenClaw 使用 `signingSecret` 驗證                                                    |
| 連線中斷復原                 | Slack SDK 會自動重新連線；會套用 gateway 的 pong-timeout 傳輸調校                    | 沒有會中斷的持久連線；重試由 Slack 依每個請求進行                                                             |

<Note>
  **選擇 Socket Mode** 適用於單一 Gateway 主機、開發筆電，以及可對外連線到 `*.slack.com` 但無法接收傳入 HTTPS 的內部部署網路。

**選擇 HTTP Request URLs** 適用於在負載平衡器後方執行多個 Gateway 複本、對外 WSS 被封鎖但允許傳入 HTTPS，或你已經在反向代理終止 Slack webhook 的情況。
</Note>

## 快速設定

<Tabs>
  <Tab title="Socket Mode（預設）">
    <Steps>
      <Step title="建立新的 Slack app">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選擇你的工作區 → 貼上下方其中一個 manifest → **Next** → **Create**。

        <CodeGroup>

```json 建議
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

```json 最小
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
          **建議** 符合內建 Slack plugin 的完整功能集：App Home、斜線命令、檔案、回應、釘選、群組 DM，以及 emoji/usergroup 讀取。當工作區政策限制範圍時，請選擇 **最小**；它涵蓋 DM、頻道/群組歷史紀錄、提及和斜線命令，但不包含檔案、回應、釘選、群組 DM (`mpim:*`)、`emoji:read` 和 `usergroups:read`。請參閱 [Manifest 與範圍檢查清單](#manifest-and-scope-checklist)，了解每個範圍的理由，以及額外斜線命令等可加選項。
        </Note>

        Slack 建立 app 之後：

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**：新增 `connections:write`，儲存，複製 `xapp-...` 值。
        - **Install App → Install to Workspace**：複製 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="設定 OpenClaw">

        建議的 SecretRef 設定：

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

        Env fallback（僅預設帳號）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="啟動 gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="建立新的 Slack app">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選擇你的工作區 → 貼上下方其中一個 manifest → 將 `https://gateway-host.example.com/slack/events` 替換為你的公開 Gateway URL → **Next** → **Create**。

        <CodeGroup>

```json 建議
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
          **建議** 符合隨附 Slack Plugin 的完整功能集；**最小化** 會移除檔案、反應、釘選、群組 DM（`mpim:*`）、`emoji:read` 和 `usergroups:read`，適用於限制較嚴格的工作區。請參閱[清單與 scope 檢查清單](#manifest-and-scope-checklist)，了解每個 scope 的理由。
        </Note>

        <Info>
          這三個 URL 欄位（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）都指向同一個 OpenClaw 端點。Slack 的清單結構要求它們分別命名，但 OpenClaw 會依 payload 類型路由，因此單一 `webhookPath`（預設 `/slack/events`）就足夠。沒有 `slash_commands[].url` 的斜線指令會在 HTTP 模式中靜默無動作。
        </Info>

        Slack 建立應用程式後：

        - **基本資訊 → 應用程式憑證**：複製用於請求驗證的 **Signing Secret**。
        - **安裝應用程式 → 安裝到工作區**：複製 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="Configure OpenClaw">

        建議的 SecretRef 設定：

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
        對多帳號 HTTP 使用唯一的 Webhook 路徑

        為每個帳號指定不同的 `webhookPath`（預設 `/slack/events`），避免註冊互相衝突。
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

## Socket Mode 傳輸調校

OpenClaw 預設會將 Socket Mode 的 Slack SDK 用戶端 pong 逾時設為 15 秒。只有在需要針對工作區或主機進行特定調校時，才覆寫傳輸設定：

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

請僅在會記錄 Slack websocket pong/server-ping 逾時，或在已知會發生事件迴圈飢餓的主機上執行的 Socket Mode 工作區中使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍是應用程式狀態，而不是傳輸存活訊號。

## 清單與 scope 檢查清單

基本 Slack 應用程式清單對 Socket Mode 和 HTTP Request URLs 相同。只有 `settings` 區塊（以及斜線指令的 `url`）不同。

基本清單（Socket Mode 預設）：

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

對於 **HTTP Request URLs 模式**，請以 HTTP 變體取代 `settings`，並將 `url` 加到每個斜線指令。需要公開 URL：

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

### 其他清單設定

公開可擴充上述預設值的不同功能。

預設清單會啟用 Slack App Home 的 **首頁** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟首頁分頁時，OpenClaw 會使用 `views.publish` 發佈安全的預設首頁檢視；不會包含對話 payload 或私有設定。**訊息** 分頁仍會為 Slack DM 啟用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可以使用多個[原生斜線指令](#commands-and-slash-behavior)取代單一已設定指令，但需注意細節：

    - 使用 `/agentstatus` 而不是 `/status`，因為 `/status` 指令已保留。
    - 一次最多只能提供 25 個斜線指令。

    將現有的 `features.slash_commands` 區段替換為[可用指令](/zh-TW/tools/slash-commands#command-list)的子集：

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
        使用與上方 Socket Mode 相同的 `slash_commands` 清單，並在每個項目加上 `"url": "https://gateway-host.example.com/slack/events"`。範例：

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

        對清單中的每個指令重複使用該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用的作者身分範圍（寫入操作）">
    如果你希望傳出訊息使用作用中的代理身分（自訂使用者名稱與圖示），而不是預設 Slack 應用程式身分，請加入 `chat:write.customize` bot 範圍。

    如果使用 emoji 圖示，Slack 會要求使用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用的使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，典型的讀取範圍為：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依賴 Slack 搜尋讀取）

  </Accordion>
</AccordionGroup>

## 權杖模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定權杖會覆寫 env 後援。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env 後援只適用於預設帳戶。
- `userToken` (`xoxp-...`) 僅能透過設定指定（沒有 env 後援），且預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳戶檢查會追蹤每個憑證的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳戶是透過 SecretRef
  或其他非內嵌密鑰來源設定，但目前的命令/執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中，會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要配對是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作/目錄讀取，設定後可優先使用使用者權杖。對於寫入，仍優先使用 bot 權杖；只有在 `userTokenReadOnly: false` 且 bot 權杖不可用時，才允許使用者權杖寫入。
</Tip>

## 動作與門檻

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組      | 預設值 |
| ---------- | ------- |
| messages   | 已啟用 |
| reactions  | 已啟用 |
| pins       | 已啟用 |
| memberInfo | 已啟用 |
| emojiList  | 已啟用 |

目前 Slack 訊息動作包含 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站檔案佔位符中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設 false）
    - `dm.groupChannels`（選用 MPIM 允許清單）

    多帳戶優先順序：

    - `channels.slack.accounts.default.allowFrom` 只適用於 `default` 帳戶。
    - 命名帳戶在自身 `allowFrom` 未設定時，會繼承 `channels.slack.allowFrom`。
    - 命名帳戶不會繼承 `channels.slack.accounts.default.allowFrom`。

    為了相容性，舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍會讀取。`openclaw doctor --fix` 可在不變更存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 下，且設定鍵**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅 env 設定），執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱/ID 解析：

    - 頻道允許清單項目和 DM 允許清單項目會在啟動時於權杖存取允許的情況下解析
    - 無法解析的頻道名稱項目會保留原設定，但預設會在路由時忽略
    - 入站授權與頻道路由預設以 ID 優先；直接使用使用者名稱/slug 比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    在 `groupPolicy: "allowlist"` 下，名稱型鍵（`#channel-name` 或 `channel-name`）**不會**相符。頻道查找預設以 ID 優先，因此名稱型鍵永遠無法成功路由，該頻道中的所有訊息都會被靜默封鎖。這不同於 `groupPolicy: "open"`，後者不需要頻道鍵即可路由，名稱型鍵看起來會可用。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中右鍵點擊頻道 → **Copy link** — ID（`C...`）會出現在 URL 結尾。

    正確：

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

    錯誤（在 `groupPolicy: "allowlist"` 下會被靜默封鎖）：

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

  <Tab title="提及與頻道使用者">
    頻道訊息預設受提及門檻限制。

    提及來源：

    - 明確的應用程式提及（`<@botId>`）
    - 當 bot 使用者是該使用者群組成員時的 Slack 使用者群組提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆 bot 討論串行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    每個頻道控制（`channels.slack.channels.<id>`；名稱只能透過啟動解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 鍵格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 萬用字元
      （舊版未加前綴的鍵仍只會對應到 `id:`）

    `allowBots` 對頻道和私人頻道採保守處理：只有在傳送 bot 明確列於該聊天室的 `users` 允許清單中，或至少有一個來自 `channels.slack.allowFrom` 的明確 Slack 擁有者 ID 目前是聊天室成員時，才會接受 bot 撰寫的聊天室訊息。萬用字元和顯示名稱擁有者項目不符合擁有者在場條件。擁有者在場使用 Slack `conversations.members`；請確保應用程式具備符合聊天室類型的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查找失敗，OpenClaw 會丟棄 bot 撰寫的聊天室訊息。

  </Tab>
</Tabs>

## 討論串、工作階段與回覆標籤

- DM 以 `direct` 路由；頻道以 `channel` 路由；MPIM 以 `group` 路由。
- Slack 路由繫結接受原始對等 ID，以及 Slack 目標形式，例如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用預設 `session.dmScope=main` 時，Slack DM 會收斂到代理主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 適用時，討論串回覆可以建立討論串工作階段後綴（`:thread:<threadTs>`）。
- 在 OpenClaw 可處理頂層訊息且不需要明確提及的頻道中，非 `off` 的 `replyToMode` 會將每個已處理根訊息路由到 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，讓可見的 Slack 討論串從第一輪開始就對應到一個 OpenClaw 工作階段。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新討論串工作階段啟動時要擷取多少既有討論串訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：當為 `true` 時，會抑制隱含的討論串提及，因此 bot 只會回應討論串內明確的 `@bot` 提及，即使 bot 已參與該討論串也一樣。若未設定此項，bot 已參與的討論串中的回覆會繞過 `requireMention` 門檻。

回覆討論串控制：

- `channels.slack.replyToMode`: `off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`: 依 `direct|group|channel` 個別設定
- 直接聊天的舊版後援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

若要從 `message` 工具明確傳送 Slack 討論串回覆，請搭配 `action: "send"` 與 `threadId` 或 `replyTo` 設定 `replyBroadcast: true`，以要求 Slack 也將討論串回覆廣播到父頻道。這會對應到 Slack 的 `chat.postMessage` `reply_broadcast` 旗標，且只支援文字或 Block Kit 傳送，不支援媒體上傳。

當 `message` 工具呼叫在 Slack 討論串內執行且目標是同一個頻道時，OpenClaw 通常會依照 `replyToMode` 繼承目前的 Slack 討論串。若要強制建立新的父頻道訊息，請在 `action: "send"` 或 `action: "upload-file"` 上設定 `topLevel: true`。`threadId: null` 也會被接受為相同的頂層退出選項。

<Note>
`replyToMode="off"` 會停用 Slack 中**所有**回覆討論串，包括明確的 `[[reply_to_*]]` 標籤。這不同於 Telegram，後者在 `"off"` 模式下仍會遵循明確標籤。Slack 討論串會將訊息從頻道中隱藏，而 Telegram 回覆會維持在行內可見。
</Note>

## 確認 reaction

`ackReaction` 會在 OpenClaw 處理入站訊息時傳送確認 emoji。

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理身分 emoji 後援（`agents.list[].identity.emoji`，否則為 "👀"）

注意事項：

- Slack 需要 shortcode（例如 `"eyes"`）。
- 使用 `""` 可停用 Slack 帳戶或全域的 reaction。

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊的預覽更新。
- `progress`：產生時顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：當草稿預覽啟用時，將工具/進度更新路由到同一則已編輯的預覽訊息中（預設：`true`）。設為 `false` 可保留獨立的工具/進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status` 可在隱藏原始命令/exec 文字的同時保留精簡的工具進度行（預設：`raw`）。

隱藏原始命令/exec 文字，同時保留精簡的進度行：

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

`channels.slack.streaming.nativeTransport` 會在 `channels.slack.streaming.mode` 為 `partial` 時控制 Slack 原生文字串流（預設：`true`）。

- 必須有可用的回覆對話串，原生文字串流和 Slack 助理對話串狀態才會出現。對話串選擇仍遵循 `replyToMode`。
- 頻道、群組聊天和頂層 DM 根，在原生串流不可用或沒有回覆對話串時，仍可使用一般草稿預覽。
- 頂層 Slack DM 預設保持不進入對話串，因此不會顯示 Slack 對話串樣式的原生串流/狀態預覽；OpenClaw 會改為在 DM 中發布並編輯草稿預覽。
- 媒體和非文字 payload 會退回一般傳遞。
- 媒體/錯誤最終回覆會取消待處理的預覽編輯；符合條件的文字/block 最終回覆只有在能就地編輯預覽時才會 flush。
- 如果串流在回覆中途失敗，OpenClaw 會對剩餘 payload 退回一般傳遞。

使用草稿預覽，而不是 Slack 原生文字串流：

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

舊版鍵：

- `channels.slack.streamMode` (`replace | status_final | append`) 是 `channels.slack.streaming.mode` 的舊版執行階段別名。
- boolean `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的舊版執行階段別名。
- 舊版 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.nativeTransport` 的執行階段別名。
- 執行 `openclaw doctor --fix`，將持久化的 Slack 串流設定重寫為標準鍵。

## 輸入中反應後援

`typingReaction` 會在 OpenClaw 處理回覆時，對傳入的 Slack 訊息加入臨時反應，然後在執行結束時移除。這在對話串回覆之外最有用，因為對話串回覆會使用預設的「is typing...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用 shortcode（例如 `"hourglass_flowing_sand"`）。
- 反應採 best-effort；回覆或失敗路徑完成後，會自動嘗試清理。

## 媒體、分塊與傳遞

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私有 URL 下載（token-authenticated request flow），並在擷取成功且大小限制允許時寫入媒體儲存區。檔案 placeholder 會包含 Slack `fileId`，讓代理可以使用 `download-file` 擷取原始檔案。

    下載使用有界的閒置與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並退回使用檔案 placeholder。

    執行階段傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字分塊使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 啟用段落優先切分
    - 檔案傳送使用 Slack upload API，且可包含對話串回覆（`thread_ts`）
    - 設定時，傳出媒體上限遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體 pipeline 的 MIME 類型預設值

  </Accordion>

  <Accordion title="傳遞目標">
    建議使用明確目標：

    - `user:<id>` 用於 DM
    - `channel:<id>` 用於頻道

    僅文字/block 的 Slack DM 可以直接發布到使用者 ID；檔案上傳和對話串傳送會先透過 Slack conversation API 開啟 DM，因為這些路徑需要具體的 conversation ID。

  </Accordion>
</AccordionGroup>

## 命令與斜線行為

斜線命令在 Slack 中會呈現為單一設定的命令或多個原生命令。設定 `channels.slack.slashCommand` 以變更命令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack app 中加入[額外 manifest 設定](#additional-manifest-settings)，並改以 `channels.slack.commands.native: true` 啟用，或在全域設定中使用 `commands.native: true` 啟用。

- Slack 的原生命令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生命令。

```txt
/help
```

原生引數選單使用自適應轉譯策略，會在 dispatch 所選選項值之前顯示確認 modal：

- 最多 5 個選項：button blocks
- 6-100 個選項：static select menu
- 超過 100 個選項：當 interactivity options handler 可用時，使用 external select 搭配 async option filtering
- 超過 Slack 限制：編碼後的選項值會退回 buttons

```txt
/think
```

斜線 session 使用像 `agent:<agentId>:slack:slash:<userId>` 這樣的隔離鍵，並仍會使用 `CommandTargetSessionKey` 將命令執行路由到目標對話 session。

## 互動式回覆

Slack 可以呈現代理撰寫的互動式回覆控制項，但此功能預設停用。

全域啟用：

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

或只為單一 Slack 帳戶啟用：

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

啟用後，代理程式可以發出僅限 Slack 的回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並透過現有的 Slack 互動事件路徑，將點選或選取動作路由回來。

注意事項：

- 這是 Slack 專用 UI。其他頻道不會將 Slack Block Kit 指令轉譯成自己的按鈕系統。
- 互動回呼值是由 OpenClaw 產生的不透明權杖，不是代理程式撰寫的原始值。
- 如果產生的互動區塊會超過 Slack Block Kit 限制，OpenClaw 會退回原始文字回覆，而不是傳送無效的 blocks 酬載。

## Slack 中的執行核准

Slack 可以作為具備互動按鈕與互動功能的原生核准用戶端，而不是退回 Web UI 或終端機。

- 執行核准使用 `channels.slack.execApprovals.*` 進行原生 DM/頻道路由。
- 當請求已經抵達 Slack，且核准 ID 類型為 `plugin:` 時，Plugin 核准仍可透過同一個 Slack 原生按鈕介面完成。
- 仍會強制執行核准者授權：只有識別為核准者的使用者可以透過 Slack 核准或拒絕請求。

這會使用與其他頻道相同的共用核准按鈕介面。當你的 Slack 應用程式設定中啟用 `interactivity` 時，核准提示會直接在對話中以 Block Kit 按鈕呈現。
當這些按鈕存在時，它們就是主要的核准 UX；OpenClaw
只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，
才應包含手動 `/approve` 命令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會退回 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`, `sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少解析出一位核准者時，Slack 會自動啟用原生執行核准。設定 `enabled: false` 可明確停用 Slack 作為原生核准用戶端。
設定 `enabled: true` 可在解析出核准者時強制開啟原生核准。

沒有明確 Slack 執行核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、新增篩選器，或
選擇加入來源聊天傳遞時，才需要明確的 Slack 原生設定：

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

共用的 `approvals.exec` 轉送是獨立的。只有在執行核准提示也必須
路由到其他聊天或明確的頻外目標時才使用它。共用的 `approvals.plugin` 轉送也是
獨立的；當這些請求已經抵達 Slack 時，Slack 原生按鈕仍可完成 Plugin 核准。

同一聊天中的 `/approve` 也可在已支援命令的 Slack 頻道與 DM 中使用。完整的核准轉送模型請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯/刪除會對應到系統事件。
- 執行緒廣播（「也傳送到頻道」的執行緒回覆）會作為一般使用者訊息處理。
- 新增/移除反應事件會對應到系統事件。
- 成員加入/離開、頻道建立/重新命名，以及釘選新增/移除事件會對應到系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定鍵。
- 頻道主題/用途中繼資料會被視為不受信任的內容，且可注入路由內容中。
- 適用時，執行緒起始訊息與初始執行緒歷史內容播種會依設定的傳送者允許清單篩選。
- 區塊動作與互動視窗互動會發出結構化的 `Slack interaction: ...` 系統事件，並包含豐富的酬載欄位：
  - 區塊動作：選取的值、標籤、選擇器值，以及 `workflow_*` 中繼資料
  - 互動視窗 `view_submission` 與 `view_closed` 事件，包含已路由的頻道中繼資料與表單輸入

## 設定參考

主要參考：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- 模式/驗證：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 存取：`dm.enabled`, `dmPolicy`, `allowFrom`（舊版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急破窗；除非需要，否則保持關閉）
- 頻道存取：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 執行緒/歷史：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳遞：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 展開預覽：`unfurlLinks`, `unfurlMedia`，用於 `chat.postMessage` 連結/媒體預覽控制
- 操作/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    請依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **鍵必須是頻道 ID**（`C12345678`），而不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基於名稱的鍵會無聲失敗，因為頻道路由預設優先使用 ID。若要尋找 ID：在 Slack 中右鍵點選頻道 → **Copy link** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 每個頻道的 `users` 允許清單

    實用命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM 訊息被忽略">
    檢查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或舊版 `channels.slack.dm.policy`）
    - 配對核准 / 允許清單項目
    - Slack Assistant DM 事件：提到 `drop message_changed` 的詳細日誌
      通常表示 Slack 傳送了一個已編輯的 Assistant 執行緒事件，但訊息中繼資料中
      沒有可復原的人類傳送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未連線">
    請驗證 Slack 應用程式設定中的 bot + app 權杖，以及 Socket Mode 啟用狀態。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳戶已
    設定，但目前執行階段無法解析由 SecretRef 支援的值。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    驗證：

    - 簽署密鑰
    - webhook 路徑
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳戶使用唯一的 `webhookPath`

    如果帳戶快照中出現 `signingSecretStatus: "configured_unavailable"`，表示 HTTP 帳戶已設定，但目前執行階段無法解析由 SecretRef 支援的簽署密鑰。

  </Accordion>

  <Accordion title="原生命令/slash commands 未觸發">
    確認你原本想使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），並已在 Slack 中註冊相符的 slash commands
    - 或單一 slash command 模式（`channels.slack.slashCommand.enabled: true`）

    也請檢查 `commands.useAccessGroups` 與頻道/使用者允許清單。

  </Accordion>
</AccordionGroup>

## 附件視覺參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將下載的媒體附加到代理回合。影像檔可透過媒體理解路徑傳遞，或直接傳給支援視覺的回覆模型；其他檔案則會保留為可下載的檔案情境，而不是視為影像輸入。

### 支援的媒體類型

| 媒體類型                       | 來源                 | 目前行為                                                                          | 備註                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 影像   | Slack 檔案 URL       | 已下載並附加到該回合，以供支援視覺的處理使用                                      | 每個檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                   |
| PDF 檔案                       | Slack 檔案 URL       | 已下載並公開為檔案情境，供 `download-file` 或 `pdf` 等工具使用                    | Slack 入站不會自動將 PDF 轉換為影像視覺輸入                               |
| 其他檔案                       | Slack 檔案 URL       | 可行時下載，並公開為檔案情境                                                      | 二進位檔案不會被視為影像輸入                                              |
| 執行緒回覆                     | 執行緒起始訊息檔案   | 當回覆沒有直接媒體時，可將根訊息檔案補入為情境                                    | 僅含檔案的起始訊息會使用附件預留位置                                      |
| 多影像訊息                     | 多個 Slack 檔案      | 每個檔案會獨立評估                                                                | Slack 處理每則訊息最多八個檔案                                            |

### 入站管線

當含有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用 Bot 權杖（`xoxb-...`）從 Slack 的私有 URL 下載檔案。
2. 檔案會在成功時寫入媒體儲存區。
3. 下載的媒體路徑與內容類型會加入入站情境。
4. 支援影像的模型/工具路徑可以使用該情境中的影像附件。
5. 非影像檔案仍可作為檔案中繼資料或媒體參照，供能處理它們的工具使用。

### 執行緒根附件繼承

當訊息抵達執行緒中（具有 `thread_ts` 父項）：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可以將根檔案補入為執行緒起始情境。
- 直接回覆附件優先於根訊息附件。
- 只有檔案且沒有文字的根訊息會以附件預留位置表示，因此後備處理仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件會透過媒體管線獨立處理。
- 下載的媒體參照會彙總到訊息情境中。
- 處理順序遵循事件承載中的 Slack 檔案順序。
- 某個附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、過大的檔案，以及 Slack 驗證/登入 HTML 回應都會被略過，而不會回報為不支援的格式。
- **視覺模型**：影像分析會在目前使用中的回覆模型支援視覺時使用該模型，或使用在 `agents.defaults.imageModel` 設定的影像模型。

### 已知限制

| 情境                                   | 目前行為                                                              | 替代方法                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                  | 略過檔案；不顯示錯誤                                                  | 在 Slack 中重新上傳檔案                                                   |
| 未設定視覺模型                         | 影像附件會儲存為媒體參照，但不會作為影像進行分析                      | 設定 `agents.defaults.imageModel`，或使用支援視覺的回覆模型               |
| 非常大的影像（預設 > 20 MB）           | 依大小上限略過                                                        | 若 Slack 允許，增加 `channels.slack.mediaMaxMb`                           |
| 轉發/分享的附件                        | 文字與 Slack 代管的影像/檔案媒體採最佳努力處理                        | 直接在 OpenClaw 執行緒中重新分享                                          |
| PDF 附件                               | 儲存為檔案/媒體情境，不會自動透過影像視覺路由                         | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具進行 PDF 分析     |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件視覺啟用
- 迴歸測試: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- 即時驗證: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者配對到 gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    頻道與群組 DM 行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將入站訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定版面與優先順序。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
