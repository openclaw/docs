---
read_when:
    - 設定 Slack 或偵錯 Slack 通訊端/HTTP 模式
summary: Slack 設定與執行階段行為（Socket Mode + HTTP 請求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

透過 Slack 應用程式整合，已可投入生產環境用於私訊和頻道。預設模式為 Socket 模式；也支援 HTTP 請求 URL。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Slack 私訊預設使用配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
</CardGroup>

## 選擇 Socket 模式或 HTTP 請求 URL

兩種傳輸方式皆可投入生產環境，並在訊息、斜線指令、應用程式首頁和互動性上達到功能等價。請依部署型態選擇，而不是依功能選擇。

| 考量                         | Socket 模式（預設）                                                                  | HTTP 請求 URL                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公開 Gateway URL             | 不需要                                                                               | 需要（DNS、TLS、反向代理或通道）                                                                               |
| 對外網路                     | 必須可對外連線至 `wss-primary.slack.com` 的 WSS                                      | 沒有對外 WS；僅需入站 HTTPS                                                                                    |
| 所需權杖                     | 機器人權杖 (`xoxb-...`) + 應用層級權杖 (`xapp-...`)，並具備 `connections:write`      | 機器人權杖 (`xoxb-...`) + 簽署祕密                                                                             |
| 開發筆電／防火牆後方         | 可直接使用                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或預備環境 Gateway                                   |
| 水平擴充                     | 每個應用程式在每台主機上只能有一個 Socket 模式工作階段；多個 Gateway 需要個別的 Slack 應用程式 | 無狀態 POST 處理常式；多個 Gateway 複本可在負載平衡器後方共用一個應用程式                                     |
| 單一 Gateway 上的多帳號      | 支援；每個帳號會開啟自己的 WS                                                        | 支援；每個帳號都需要唯一的 `webhookPath`（預設 `/slack/events`），讓註冊不會衝突                               |
| 斜線指令傳輸                 | 透過 WS 連線傳遞；`slash_commands[].url` 會被忽略                                    | Slack 會 POST 到 `slash_commands[].url`；此欄位是派發指令的必要欄位                                           |
| 請求簽署                     | 不使用（驗證使用應用層級權杖）                                                       | Slack 會簽署每個請求；OpenClaw 會使用 `signingSecret` 驗證                                                    |
| 連線中斷時的復原             | Slack SDK 會自動重新連線；套用 Gateway 的 pong-timeout 傳輸調校                      | 沒有會中斷的持久連線；重試由 Slack 依每個請求執行                                                            |

<Note>
  **選擇 Socket 模式**，適用於單一 Gateway 主機、開發筆電，以及可對外連至 `*.slack.com` 但無法接受入站 HTTPS 的內部部署網路。

**選擇 HTTP 請求 URL**，適用於在負載平衡器後方執行多個 Gateway 複本、對外 WSS 遭封鎖但允許入站 HTTPS，或你已在反向代理終止 Slack Webhook 的情境。
</Note>

## 快速設定

<Tabs>
  <Tab title="Socket 模式（預設）">
    <Steps>
      <Step title="建立新的 Slack 應用程式">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **建立新應用程式** → **從資訊清單** → 選取你的工作區 → 貼上下列其中一份資訊清單 → **下一步** → **建立**。

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
          **建議**符合內建 Slack Plugin 的完整功能集：應用程式首頁、斜線指令、檔案、反應、釘選、群組私訊，以及表情符號/使用者群組讀取。當工作區政策限制權限範圍時，請選擇 **最小**：它涵蓋私訊、頻道/群組記錄、提及和斜線指令，但不包含檔案、反應、釘選、群組私訊 (`mpim:*`)、`emoji:read` 和 `usergroups:read`。請參閱[資訊清單與權限範圍檢查清單](#manifest-and-scope-checklist)，了解各權限範圍的理由，以及額外斜線指令等可加選項。
        </Note>

        Slack 建立應用程式後：

        - **基本資訊 → 應用層級權杖 → 產生權杖和權限範圍**：新增 `connections:write`、儲存，然後複製 `xapp-...` 值。
        - **安裝應用程式 → 安裝到工作區**：複製 `xoxb-...` 機器人使用者 OAuth 權杖。

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

        環境變數後備（僅限預設帳號）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="啟動 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP 請求 URL">
    <Steps>
      <Step title="建立新的 Slack 應用程式">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **建立新應用程式** → **從資訊清單** → 選取你的工作區 → 貼上下列其中一份資訊清單 → 將 `https://gateway-host.example.com/slack/events` 替換為你的公開 Gateway URL → **下一步** → **建立**。

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
          **建議** 會符合內建 Slack Plugin 的完整功能集；**最小** 會移除檔案、反應、釘選、群組 DM（`mpim:*`）、`emoji:read` 與 `usergroups:read`，適用於限制較嚴格的工作區。請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)，了解各範圍的理由。
        </Note>

        <Info>
          三個 URL 欄位（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）都指向同一個 OpenClaw 端點。Slack 的資訊清單結構描述要求它們分別命名，但 OpenClaw 會依照承載資料類型路由，因此單一 `webhookPath`（預設 `/slack/events`）就足夠。未設定 `slash_commands[].url` 的斜線指令會在 HTTP 模式中靜默無作用。
        </Info>

        Slack 建立應用程式後：

        - **Basic Information → App Credentials**：複製 **Signing Secret** 以進行請求驗證。
        - **Install App → Install to Workspace**：複製 `xoxb-...` Bot User OAuth Token。

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
        為多帳號 HTTP 使用唯一的 Webhook 路徑

        為每個帳號指定不同的 `webhookPath`（預設 `/slack/events`），使註冊不會發生衝突。
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

只在記錄到 Slack websocket pong/server-ping 逾時，或執行在已知事件迴圈飢餓主機上的 Socket Mode 工作區使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息與事件仍是應用程式狀態，而不是傳輸存活訊號。

## 資訊清單與範圍檢查清單

基礎 Slack 應用程式資訊清單對 Socket Mode 和 HTTP Request URLs 相同。只有 `settings` 區塊（以及斜線指令 `url`）不同。

基礎資訊清單（Socket Mode 預設）：

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

若使用 **HTTP Request URLs 模式**，請將 `settings` 替換為 HTTP 變體，並為每個斜線指令新增 `url`。需要公開 URL：

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

### 其他資訊清單設定

呈現擴充上述預設值的不同功能。

預設資訊清單會啟用 Slack App Home 的 **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會透過 `views.publish` 發布安全的預設 Home 檢視；不會包含對話承載資料或私人設定。**Messages** 分頁仍會為 Slack DM 啟用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可使用多個[原生斜線指令](#commands-and-slash-behavior)取代單一已設定指令，並保留細節差異：

    - 使用 `/agentstatus` 而非 `/status`，因為 `/status` 指令已保留。
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
        使用與上方 Socket Mode 相同的 `slash_commands` 清單，並在每個項目加入 `"url": "https://gateway-host.example.com/slack/events"`。範例：

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

        對清單中的每個指令重複該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用作者身分範圍（寫入操作）">
    如果你希望傳出訊息使用作用中的代理身分（自訂使用者名稱和圖示），而不是預設的 Slack 應用程式身分，請加入 `chat:write.customize` 機器人範圍。

    如果你使用表情符號圖示，Slack 預期使用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，典型讀取範圍為：

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
- 設定權杖會覆寫環境變數後援。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 環境變數後援只套用於預設帳戶。
- `userToken`（`xoxp-...`）僅能透過設定提供（沒有環境變數後援），且預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳戶檢查會追蹤每個憑證的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳戶是透過 SecretRef
  或其他非內嵌祕密來源設定，但目前的命令/執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要配對是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作/目錄讀取，已設定時可優先使用使用者權杖。對於寫入，仍優先使用機器人權杖；只有在 `userTokenReadOnly: false` 且機器人權杖不可用時，才允許使用使用者權杖寫入。
</Tip>

## 動作和閘門

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組       | 預設 |
| ---------- | ------- |
| messages   | 已啟用 |
| reactions  | 已啟用 |
| pins       | 已啟用 |
| memberInfo | 已啟用 |
| emojiList  | 已啟用 |

目前 Slack 訊息動作包含 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受傳入檔案預留位置中顯示的 Slack 檔案 ID，並針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.slack.dmPolicy` 控制 DM 存取。`channels.slack.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    DM 旗標：

    - `dm.enabled`（預設為 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組 DM 預設為 false）
    - `dm.groupChannels`（選用 MPIM 允許清單）

    多帳戶優先順序：

    - `channels.slack.accounts.default.allowFrom` 只套用於 `default` 帳戶。
    - 具名帳戶在自己的 `allowFrom` 未設定時，會繼承 `channels.slack.allowFrom`。
    - 具名帳戶不會繼承 `channels.slack.accounts.default.allowFrom`。

    舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    DM 中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 底下，且 **必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）作為設定鍵。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅環境變數設定），執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy` 也是如此）。

    名稱/ID 解析：

    - 頻道允許清單項目和 DM 允許清單項目會在啟動時於權杖存取允許的情況下解析
    - 未解析的頻道名稱項目會保留為已設定狀態，但預設會被路由忽略
    - 傳入授權和頻道路由預設優先使用 ID；直接使用者名稱/slug 比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**相符。頻道查詢預設優先使用 ID，因此以名稱為基礎的鍵永遠無法成功路由，且該頻道中的所有訊息都會被靜默封鎖。這不同於 `groupPolicy: "open"`；在該模式下，路由不需要頻道鍵，且以名稱為基礎的鍵看起來可以運作。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中以右鍵點選頻道 → **複製連結** — ID（`C...`）會出現在 URL 末端。

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

    不正確（在 `groupPolicy: "allowlist"` 下會被靜默封鎖）：

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

  <Tab title="提及和頻道使用者">
    頻道訊息預設會受到提及門檻限制。

    提及來源：

    - 明確的應用程式提及（`<@botId>`）
    - Slack 使用者群組提及（`<!subteam^S...>`），前提是機器人使用者是該使用者群組的成員；需要 `usergroups:read`
    - 提及正規表示式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆機器人執行緒行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    每個頻道的控制項（`channels.slack.channels.<id>`；名稱只能透過啟動時解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 鍵格式：`id:`, `e164:`, `username:`, `name:`，或 `"*"` 萬用字元
      （舊版未加前綴的鍵仍只會對應到 `id:`）

    `allowBots` 對頻道與私人頻道採保守策略：只有在發送訊息的機器人明確列在該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確的 Slack 擁有者 ID 目前是聊天室成員時，才會接受由機器人撰寫的聊天室訊息。萬用字元與顯示名稱形式的擁有者項目不符合擁有者在場條件。擁有者在場檢查使用 Slack `conversations.members`；請確認應用程式具備符合聊天室類型的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會捨棄由機器人撰寫的聊天室訊息。

  </Tab>
</Tabs>

## 執行緒、工作階段與回覆標籤

- 私人訊息會路由為 `direct`；頻道為 `channel`；多人私人訊息（MPIM）為 `group`。
- Slack 路由繫結接受原始對等 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目標形式。
- 使用預設 `session.dmScope=main` 時，Slack 私人訊息會合併到代理程式的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 在適用時，執行緒回覆可以建立執行緒工作階段後綴（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新的執行緒工作階段啟動時要擷取多少則既有執行緒訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：當為 `true` 時，抑制隱含的執行緒提及，因此機器人只會回應執行緒內明確的 `@bot` 提及，即使機器人已參與該執行緒亦然。若未啟用，已由機器人參與的執行緒中的回覆會繞過 `requireMention` 門檻。

回覆執行緒控制項：

- `channels.slack.replyToMode`：`off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分別設定
- 私人聊天的舊版備援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 會停用 Slack 中的**所有**回覆執行緒，包括明確的 `[[reply_to_*]]` 標籤。這與 Telegram 不同；在 Telegram 中，明確標籤即使在 `"off"` 模式下仍會被採用。Slack 執行緒會在頻道中隱藏訊息，而 Telegram 回覆會保留在行內可見。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時送出確認表情符號。

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則為 "👀"）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 停用該 Slack 帳戶或全域的反應。

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：將預覽文字替換為最新的部分輸出。
- `block`：附加分塊預覽更新。
- `progress`：生成期間顯示進度狀態文字，然後送出最終文字。
- `streaming.preview.toolProgress`：草稿預覽啟用時，將工具/進度更新路由到同一則編輯中的預覽訊息（預設：`true`）。設為 `false` 可保留個別的工具/進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status` 可在隱藏原始命令/執行文字的同時保留精簡的工具進度行（預設：`raw`）。

隱藏原始命令/執行文字，同時保留精簡的進度行：

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

`channels.slack.streaming.nativeTransport` 在 `channels.slack.streaming.mode` 為 `partial` 時控制 Slack 原生文字串流（預設：`true`）。

- 必須有可用的回覆執行緒，原生文字串流與 Slack 助理執行緒狀態才會顯示。執行緒選擇仍遵循 `replyToMode`。
- 當原生串流不可用或沒有回覆執行緒時，頻道、群組聊天與頂層私人訊息根節點仍可使用一般草稿預覽。
- 頂層 Slack 私人訊息預設保持非執行緒狀態，因此不會顯示 Slack 的執行緒樣式原生串流/狀態預覽；OpenClaw 會改在私人訊息中發布並編輯草稿預覽。
- 媒體與非文字酬載會回退到一般傳遞。
- 媒體/錯誤最終內容會取消待處理的預覽編輯；符合條件的文字/區塊最終內容只有在能就地編輯預覽時才會送出。
- 如果串流在回覆途中失敗，OpenClaw 會將剩餘酬載回退到一般傳遞。

使用草稿預覽取代 Slack 原生文字串流：

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

- `channels.slack.streamMode`（`replace | status_final | append`）會自動遷移到 `channels.slack.streaming.mode`。
- 布林值 `channels.slack.streaming` 會自動遷移到 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport`。
- 舊版 `channels.slack.nativeStreaming` 會自動遷移到 `channels.slack.streaming.nativeTransport`。

## 輸入中反應備援

`typingReaction` 會在 OpenClaw 處理回覆時，對傳入的 Slack 訊息加入暫時反應，並在執行完成時移除。這在對話串回覆以外的情境最有用，因為對話串回覆會使用預設的「正在輸入...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 需要短代碼（例如 `"hourglass_flowing_sand"`）。
- 反應是盡力而為，回覆或失敗路徑完成後會自動嘗試清理。

## 媒體、分塊與傳送

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私人 URL（權杖驗證要求流程）下載，並在擷取成功且大小限制允許時寫入媒體儲存區。檔案佔位符包含 Slack `fileId`，因此代理程式可以使用 `download-file` 擷取原始檔案。

    下載會使用有界的閒置與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並退回使用檔案佔位符。

    執行階段傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="傳出文字與檔案">
    - 文字分塊使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 啟用段落優先分割
    - 檔案傳送使用 Slack 上傳 API，並可包含對話串回覆（`thread_ts`）
    - 設定時，傳出媒體上限會遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體管線中的 MIME 類型預設值

  </Accordion>

  <Accordion title="傳送目標">
    偏好的明確目標：

    - `user:<id>` 用於 DM
    - `channel:<id>` 用於頻道

    僅含文字/區塊的 Slack DM 可以直接發佈到使用者 ID；檔案上傳和對話串傳送會先透過 Slack conversation API 開啟 DM，因為這些路徑需要具體的 conversation ID。

  </Accordion>
</AccordionGroup>

## 指令與斜線行為

斜線指令在 Slack 中會顯示為單一已設定指令或多個原生指令。設定 `channels.slack.slashCommand` 以變更指令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生指令需要在你的 Slack app 中使用[額外的資訊清單設定](#additional-manifest-settings)，並以 `channels.slack.commands.native: true` 啟用，或改在全域設定中使用 `commands.native: true`。

- Slack 的原生指令自動模式為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生指令。

```txt
/help
```

原生引數選單使用自適應呈現策略，會在分派所選選項值前顯示確認互動視窗：

- 最多 5 個選項：按鈕區塊
- 6-100 個選項：靜態選取選單
- 超過 100 個選項：當 interactivity 選項處理常式可用時，使用具有非同步選項篩選的外部選取
- 超過 Slack 限制：編碼選項值會退回使用按鈕

```txt
/think
```

斜線工作階段使用像 `agent:<agentId>:slack:slash:<userId>` 這類隔離金鑰，且仍會使用 `CommandTargetSessionKey` 將指令執行路由到目標對話工作階段。

## 互動式回覆

Slack 可以呈現由代理程式撰寫的互動式回覆控制項，但此功能預設停用。

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

或僅為一個 Slack 帳號啟用：

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

啟用後，代理程式可以發出僅適用於 Slack 的回覆指示：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指示會編譯成 Slack Block Kit，並透過既有 Slack 互動事件路徑路由點擊或選取。

注意事項：

- 這是 Slack 專用 UI。其他頻道不會將 Slack Block Kit 指示轉譯成自己的按鈕系統。
- 互動式回呼值是由 OpenClaw 產生的不透明權杖，不是代理程式撰寫的原始值。
- 如果產生的互動式區塊會超過 Slack Block Kit 限制，OpenClaw 會退回傳送原始文字回覆，而不是傳送無效的 blocks 承載。

## Slack 中的執行核准

Slack 可以作為具有互動式按鈕與互動的原生核准用戶端，而不是退回使用 Web UI 或終端機。

- 執行核准使用 `channels.slack.execApprovals.*` 進行原生 DM/頻道路由。
- 當要求已經落在 Slack 中，且核准 ID 類型為 `plugin:` 時，Plugin 核准仍可透過相同的 Slack 原生按鈕介面解析。
- 仍會強制執行核准者授權：只有識別為核准者的使用者可以透過 Slack 核准或拒絕要求。

這使用與其他頻道相同的共用核准按鈕介面。當你的 Slack app 設定中啟用 `interactivity` 時，核准提示會直接在對話中呈現為 Block Kit 按鈕。
當這些按鈕存在時，它們就是主要核准使用者體驗；OpenClaw
只有在工具結果表示聊天核准無法使用，或手動核准是唯一路徑時，
才應包含手動 `/approve` 指令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`, `sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少一位核准者可解析時，Slack 會自動啟用原生執行核准。設定 `enabled: false` 可明確停用 Slack 作為原生核准用戶端。
設定 `enabled: true` 可在核准者解析時強制開啟原生核准。

沒有明確 Slack 執行核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想要覆寫核准者、新增篩選器，或選擇加入來源聊天傳送時，
才需要明確的 Slack 原生設定：

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

共用 `approvals.exec` 轉送是獨立的。只有在執行核准提示也必須
路由到其他聊天或明確的頻外目標時才使用。共用 `approvals.plugin` 轉送也是
獨立的；當這些要求已經落在 Slack 中時，Slack 原生按鈕仍可解析 Plugin 核准。

同一聊天中的 `/approve` 也可在已支援指令的 Slack 頻道與 DM 中運作。請參閱[執行核准](/zh-TW/tools/exec-approvals)以了解完整的核准轉送模型。

## 事件與營運行為

- 訊息編輯/刪除會對應到系統事件。
- 對話串廣播（「也傳送到頻道」的對話串回覆）會作為一般使用者訊息處理。
- 反應新增/移除事件會對應到系統事件。
- 成員加入/離開、頻道建立/重新命名，以及釘選新增/移除事件會對應到系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定金鑰。
- 頻道主題/用途中繼資料會被視為不受信任的脈絡，並可注入路由脈絡。
- 對話串起始者與初始對話串歷史脈絡植入，會在適用時依設定的寄件者允許清單進行篩選。
- 區塊動作與互動視窗互動會發出結構化的 `Slack interaction: ...` 系統事件，並包含豐富的承載欄位：
  - 區塊動作：選取值、標籤、選擇器值，以及 `workflow_*` 中繼資料
  - 互動視窗 `view_submission` 與 `view_closed` 事件，含已路由的頻道中繼資料與表單輸入

## 設定參考

主要參考：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- 模式/驗證：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 存取：`dm.enabled`, `dmPolicy`, `allowFrom`（舊版：`dm.policy`, `dm.allowFrom`）、`dm.groupEnabled`, `dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（break-glass；除非需要，否則保持關閉）
- 頻道存取：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 對話串/歷史：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳送：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 營運/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **金鑰必須是頻道 ID**（`C12345678`），不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，名稱式金鑰會無聲失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中以右鍵點擊頻道 → **複製連結** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 各頻道的 `users` 允許清單

    實用指令：

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
    - Slack Assistant DM 事件：提到 `drop message_changed` 的詳細記錄
      通常表示 Slack 傳送了一個已編輯的 Assistant 對話串事件，但訊息中繼資料中沒有
      可復原的人類寄件者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode 未連線">
    在 Slack app 設定中驗證 bot + app 權杖與 Socket Mode 啟用狀態。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 帳號已設定，
    但目前執行階段無法解析由 SecretRef 支援的
    值。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    驗證：

    - 簽章密鑰
    - Webhook 路徑
    - Slack 要求 URL（事件 + 互動 + 斜線指令）
    - 每個 HTTP 帳號唯一的 `webhookPath`

    如果帳號快照中出現 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 帳號已設定，但目前執行階段無法
    解析由 SecretRef 支援的簽章密鑰。

  </Accordion>

  <Accordion title="原生/斜線指令未觸發">
    確認你的意圖是：

    - 原生指令模式（`channels.slack.commands.native: true`），且已在 Slack 中註冊相符的斜線指令
    - 或單一斜線指令模式（`channels.slack.slashCommand.enabled: true`）

    也請檢查 `commands.useAccessGroups` 與頻道/使用者允許清單。

  </Accordion>
</AccordionGroup>

## 附件視覺參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將已下載的媒體附加到代理程式回合。圖片檔案可以透過媒體理解路徑傳遞，或直接傳給具備視覺能力的回覆模型；其他檔案會保留為可下載的檔案脈絡，而不會被視為圖片輸入。

### 支援的媒體類型

| 媒體類型                     | 來源               | 目前行為                                                                  | 備註                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 圖片 | Slack 檔案 URL       | 已下載並附加到該輪次，以供具備視覺能力的處理使用                   | 單一檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                 |
| PDF 檔案                      | Slack 檔案 URL       | 已下載並作為檔案內容脈絡提供給 `download-file` 或 `pdf` 等工具使用 | Slack 輸入不會自動將 PDF 轉換成影像視覺輸入 |
| 其他檔案                    | Slack 檔案 URL       | 可行時下載，並作為檔案內容脈絡提供                              | 二進位檔案不會被視為影像輸入                               |
| 執行緒回覆                 | 執行緒起始訊息檔案 | 當回覆沒有直接媒體時，根訊息檔案可作為內容脈絡補齊  | 只有檔案的起始訊息會使用附件預留位置                          |
| 多圖片訊息           | 多個 Slack 檔案 | 每個檔案都會獨立評估                                              | Slack 處理每則訊息最多八個檔案                     |

### 輸入管線

當帶有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用機器人權杖（`xoxb-...`）從 Slack 的私有 URL 下載檔案。
2. 下載成功後，檔案會寫入媒體儲存區。
3. 已下載媒體路徑和內容類型會加入輸入內容脈絡。
4. 具備影像能力的模型／工具路徑可使用該內容脈絡中的影像附件。
5. 非影像檔案仍會作為檔案中繼資料或媒體參照，提供給能處理它們的工具使用。

### 執行緒根附件繼承

當訊息抵達執行緒中（具有 `thread_ts` 父項）時：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可將根檔案補齊為執行緒起始內容脈絡。
- 直接回覆附件優先於根訊息附件。
- 只有檔案且沒有文字的根訊息會以附件預留位置表示，因此後援仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線獨立處理。
- 已下載的媒體參照會彙總到訊息內容脈絡中。
- 處理順序遵循事件承載中 Slack 的檔案順序。
- 某個附件下載失敗不會阻止其他附件。

### 大小、下載與模型限制

- **大小上限**：預設每個檔案 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超過大小限制的檔案，以及 Slack 驗證／登入 HTML 回應都會被略過，而不是回報為不支援的格式。
- **視覺模型**：影像分析會在作用中回覆模型支援視覺時使用該模型，或使用 `agents.defaults.imageModel` 設定的影像模型。

### 已知限制

| 情境                               | 目前行為                                                             | 因應方式                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                 | 略過檔案；不顯示錯誤                                                 | 在 Slack 中重新上傳檔案                                                |
| 未設定視覺模型            | 影像附件會儲存為媒體參照，但不會作為影像分析 | 設定 `agents.defaults.imageModel`，或使用具備視覺能力的回覆模型 |
| 非常大的圖片（預設 > 20 MB） | 依大小上限略過                                                         | 如果 Slack 允許，請提高 `channels.slack.mediaMaxMb`                       |
| 轉寄／共享的附件           | 文字與 Slack 託管的影像／檔案媒體會盡力處理                       | 直接在 OpenClaw 執行緒中重新分享                                   |
| PDF 附件                        | 儲存為檔案／媒體內容脈絡，不會自動透過影像視覺路由  | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具進行 PDF 分析   |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- 史詩：[ #51349](https://github.com/openclaw/openclaw/issues/51349) — 啟用 Slack 附件視覺
- 迴歸測試：[ #51353](https://github.com/openclaw/openclaw/issues/51353)
- 即時驗證：[ #51354](https://github.com/openclaw/openclaw/issues/51354)

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    頻道與群組 DM 行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將輸入訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定版面配置與優先順序。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
