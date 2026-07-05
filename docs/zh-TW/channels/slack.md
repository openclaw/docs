---
read_when:
    - 設定 Slack，或除錯 Slack socket、HTTP 或 relay 模式
summary: Slack 設定與執行階段行為（Socket Mode、HTTP Request URLs 與 relay 模式）
title: Slack
x-i18n:
    generated_at: "2026-07-05T01:53:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b8011f0fce235aa3995ab93c5716ed2112a847cf3dc7a6f9589048d9575bafc
    source_path: channels/slack.md
    workflow: 16
---

可透過 Slack app 整合在 DM 和頻道中達到生產就緒。預設模式是 Socket Mode；也支援 HTTP Request URLs。Relay 模式適用於由受信任路由器負責 Slack 入口的受管理部署。

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

兩種傳輸方式皆已達到生產就緒，並在訊息、斜線命令、App Home 和互動性方面具備功能對等。請依部署形態選擇，而不是依功能選擇。

| 考量事項                     | Socket Mode（預設）                                                                                                                                 | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公開閘道 URL                 | 不需要                                                                                                                                               | 需要（DNS、TLS、反向代理或通道）                                                                               |
| 對外網路                     | 必須能連線到 `wss-primary.slack.com` 的對外 WSS                                                                                                      | 不使用對外 WS；僅使用傳入 HTTPS                                                                                |
| 所需權杖                     | Bot token + 具備 `connections:write` 的 App-Level Token                                                                                              | Bot token + Signing Secret                                                                                     |
| 開發筆電／防火牆後方         | 可直接運作                                                                                                                                           | 需要公開通道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或預備環境閘道                                       |
| 水平擴展                     | 每個 app、每台主機一個 Socket Mode 工作階段；多個閘道需要個別的 Slack app                                                                            | 無狀態 POST 處理器；多個閘道複本可在負載平衡器後方共用一個 app                                                |
| 單一閘道上的多帳號           | 支援；每個帳號會開啟自己的 WS                                                                                                                        | 支援；每個帳號需要唯一的 `webhookPath`（預設 `/slack/events`），避免註冊互相衝突                              |
| 斜線命令傳輸                 | 透過 WS 連線傳送；`slash_commands[].url` 會被忽略                                                                                                    | Slack 會 POST 到 `slash_commands[].url`；此欄位是命令分派所必需的                                             |
| 請求簽署                     | 不使用（驗證使用 App-Level Token）                                                                                                                   | Slack 會簽署每個請求；OpenClaw 會使用 `signingSecret` 驗證                                                   |
| 連線中斷後復原               | 已啟用 Slack SDK 自動重新連線；OpenClaw 也會以有界退避重新啟動失敗的 Socket Mode 工作階段。會套用 Pong timeout 傳輸調校。                           | 沒有會中斷的持久連線；重試由 Slack 逐請求處理                                                                 |

<Note>
  **選擇 Socket Mode** 適用於單一閘道主機、開發筆電，以及能對外連線到 `*.slack.com` 但無法接受傳入 HTTPS 的內部部署網路。

**選擇 HTTP Request URLs** 適用於在負載平衡器後方執行多個閘道複本、對外 WSS 被封鎖但允許傳入 HTTPS，或你已經在反向代理終止 Slack 網路鉤子的情境。
</Note>

### Relay 模式

Relay 模式會將 Slack 入口與 OpenClaw 閘道分離。受信任的路由器負責單一 Slack Socket Mode 連線、選擇目的地閘道，並透過已驗證的 websocket 轉送具型別事件。閘道會繼續使用其 bot token 進行對外 Slack Web API 呼叫。

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

Relay URL 必須使用 `wss://`，除非目標是 localhost。請將 bearer token 和路由器路由表視為 Slack 授權邊界的一部分：路由事件會作為已授權啟用進入一般 Slack 訊息處理器。由路由器在 websocket `hello` frame 中提供的 `slack_identity` 可設定預設對外使用者名稱與圖示；呼叫者明確提供的身分仍會優先。Relay 連線會使用與 Socket Mode 相同的有界退避時序重新連線，並在中斷連線時清除路由器提供的身分。

## 安裝

設定頻道前，請先安裝 Slack：

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 會註冊並啟用外掛。在你完成下方 Slack app 與頻道設定之前，此外掛仍不會執行任何動作。一般外掛行為與安裝規則請參閱[外掛](/zh-TW/tools/plugin)。

## 快速設定

<Tabs>
  <Tab title="Socket Mode（預設）">
    <Steps>
      <Step title="建立新的 Slack app">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選取你的工作區 → 貼上下方其中一份 manifest → **Next** → **Create**。

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
          **Recommended** 符合 Slack 外掛的完整功能集：App Home、斜線命令、檔案、回應、釘選、群組 DM，以及 emoji/usergroup 讀取。當工作區政策限制 scopes 時，請選擇 **Minimal**；它涵蓋 DM、頻道／群組歷史、提及和斜線命令，但移除檔案、回應、釘選、群組 DM（`mpim:*`）、`emoji:read` 和 `usergroups:read`。請參閱 [Manifest 與 scope 檢查清單](#manifest-and-scope-checklist)，了解各 scope 的理由與額外斜線命令等增量選項。
        </Note>

        Slack 建立 app 後：

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**：加入 `connections:write`，儲存並複製 App-Level Token。
        - **Install App -> Install to Workspace**：複製 Bot User OAuth Token。

      </Step>

      <Step title="設定 OpenClaw">

        建議的 SecretRef 設定：

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

        Env fallback（僅預設帳號）：

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="啟動閘道">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        開啟 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 選取你的工作區 → 貼上下方其中一份資訊清單 → 將 `https://gateway-host.example.com/slack/events` 替換為你的公開閘道 URL → **Next** → **Create**。

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
          **Recommended** 符合 Slack 外掛的完整功能集；**Minimal** 會移除檔案、回應、釘選、群組私訊 (`mpim:*`)、`emoji:read` 和 `usergroups:read`，適合限制較多的工作區。請參閱[資訊清單與範圍檢查清單](#manifest-and-scope-checklist)，了解各範圍的理由。
        </Note>

        <Info>
          三個 URL 欄位 (`slash_commands[].url`、`event_subscriptions.request_url` 和 `interactivity.request_url` / `message_menu_options_url`) 都指向同一個 OpenClaw 端點。Slack 的資訊清單結構描述要求它們分別命名，但 OpenClaw 會依酬載類型路由，因此單一 `webhookPath` (預設為 `/slack/events`) 就足夠。若斜線命令沒有 `slash_commands[].url`，在 HTTP 模式下會靜默無動作。
        </Info>

        Slack 建立應用程式後：

        - **Basic Information → App Credentials**：複製 **Signing Secret** 以進行請求驗證。
        - **Install App -> Install to Workspace**：複製 Bot User OAuth Token。

      </Step>

      <Step title="Configure OpenClaw">

        建議的 SecretRef 設定：

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
        多帳號 HTTP 使用唯一的網路鉤子路徑

        為每個帳號指定不同的 `webhookPath` (預設為 `/slack/events`)，避免註冊互相衝突。
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

只有在 Socket Mode 工作區記錄了 Slack websocket pong/server-ping 逾時，或執行於已知事件迴圈飢餓的主機上時，才使用此設定。`clientPingTimeout` 是 SDK 傳送用戶端 ping 後等待 pong 的時間；`serverPingTimeout` 是等待 Slack 伺服器 ping 的時間。應用程式訊息和事件仍是應用程式狀態，不是傳輸活性訊號。

注意事項：

- `socketMode` 在 HTTP Request URL 模式中會被忽略。
- 基礎 `channels.slack.socketMode` 設定會套用到所有 Slack 帳號，除非被覆寫。每個帳號的覆寫使用 `channels.slack.accounts.<accountId>.socketMode`；因為這是物件覆寫，請包含該帳號所需的每個 socket 調校欄位。
- 只有 `clientPingTimeout` 有 OpenClaw 預設值 (`15000`)。`serverPingTimeout` 和 `pingPongLoggingEnabled` 只有在已設定時才會傳遞給 Slack SDK。
- Socket Mode 重新啟動退避大約從 2 秒開始，上限大約為 30 秒。可復原的啟動、等待啟動和中斷連線失敗會持續重試，直到頻道停止。永久性的帳號與認證錯誤，例如無效驗證、已撤銷的 Token 或缺少範圍，會快速失敗，而不是永遠重試。

## 資訊清單與範圍檢查清單

Socket Mode 和 HTTP Request URLs 使用相同的基礎 Slack 應用程式資訊清單。只有 `settings` 區塊 (以及斜線命令的 `url`) 不同。

基礎資訊清單 (Socket Mode 預設)：

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

對於 **HTTP Request URLs 模式**，請將 `settings` 替換為 HTTP 變體，並為每個斜線命令加入 `url`。需要公開 URL：

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

### 其他資訊清單設定

顯示擴充上述預設值的不同功能。

預設資訊清單會啟用 Slack App Home **Home** 分頁，並訂閱 `app_home_opened`。當工作區成員開啟 Home 分頁時，OpenClaw 會透過 `views.publish` 發布安全的預設 Home 檢視；其中不包含對話承載資料或私人設定。**Messages** 分頁仍會為 Slack 私訊啟用。資訊清單也會透過 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 啟用 Slack 助理執行緒；助理執行緒會路由至其自己的 OpenClaw 執行緒工作階段，並讓 Slack 提供的執行緒脈絡可供代理使用。

<AccordionGroup>
  <Accordion title="選用的原生斜線命令">

    可以使用多個[原生斜線命令](#commands-and-slash-behavior)，取代單一設定命令，但有一些細節：

    - 使用 `/agentstatus` 而不是 `/status`，因為 `/status` 命令是保留命令。
    - 一次最多只能提供 25 個斜線命令。

    將現有的 `features.slash_commands` 區段替換為[可用命令](/zh-TW/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（預設）">

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
      <Tab title="HTTP 請求 URL">
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

        在清單中的每個命令重複該 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="選用的作者身分範圍（寫入操作）">
    如果你希望傳出訊息使用作用中代理身分（自訂使用者名稱和圖示），而不是預設的 Slack 應用程式身分，請加入 `chat:write.customize` Bot 範圍。

    如果你使用表情符號圖示，Slack 預期使用 `:emoji_name:` 語法。

  </Accordion>
  <Accordion title="選用的使用者權杖範圍（讀取操作）">
    如果你設定 `channels.slack.userToken`，典型的讀取範圍包括：

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
- Relay 模式需要 `botToken` 加上 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用應用程式權杖或簽署密鑰。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- 設定權杖會覆寫環境變數備援。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 環境變數備援只套用於預設帳號。
- `userToken` 僅能在設定中使用（沒有環境變數備援），並預設為唯讀行為（`userTokenReadOnly: true`）。

狀態快照行為：

- Slack 帳號檢查會追蹤每個憑證的 `*Source` 和 `*Status`
  欄位（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 狀態為 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示帳號已透過 SecretRef
  或其他非行內密鑰來源設定，但目前的命令/執行階段路徑
  無法解析實際值。
- 在 HTTP 模式中會包含 `signingSecretStatus`；在 Socket Mode 中，
  必要組合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
對於動作/目錄讀取，已設定時可優先使用使用者權杖。對於寫入，仍優先使用 Bot 權杖；只有在 `userTokenReadOnly: false` 且 Bot 權杖不可用時，才允許使用者權杖寫入。
</Tip>

## 動作與閘門

Slack 動作由 `channels.slack.actions.*` 控制。

目前 Slack 工具中可用的動作群組：

| 群組      | 預設值 |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

目前 Slack 訊息動作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站檔案預留位置中顯示的 Slack 檔案 ID，並會針對圖片傳回圖片預覽，或針對其他檔案類型傳回本機檔案中繼資料。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.slack.dmPolicy` 控制私訊存取。`channels.slack.allowFrom` 是標準私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私訊旗標：

    - `dm.enabled`（預設 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（舊版）
    - `dm.groupEnabled`（群組私訊預設 false）
    - `dm.groupChannels`（選用的 MPIM 允許清單）

    多帳號優先順序：

    - `channels.slack.accounts.default.allowFrom` 只套用於 `default` 帳號。
    - 具名帳號若未設定自己的 `allowFrom`，會繼承 `channels.slack.allowFrom`。
    - 具名帳號不會繼承 `channels.slack.accounts.default.allowFrom`。

    舊版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，將它們遷移至 `dmPolicy` 和 `allowFrom`。

    私訊中的配對使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="頻道政策">
    `channels.slack.groupPolicy` 控制頻道處理：

    - `open`
    - `allowlist`
    - `disabled`

    頻道允許清單位於 `channels.slack.channels` 底下，且**必須使用穩定的 Slack 頻道 ID**（例如 `C12345678`）作為設定鍵。

    執行階段注意事項：如果完全缺少 `channels.slack`（僅環境變數設定），執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    名稱/ID 解析：

    - 當權杖存取允許時，頻道允許清單項目和私訊允許清單項目會在啟動時解析
    - 未解析的頻道名稱項目會依照設定保留，但預設會在路由時忽略
    - 入站授權和頻道路由預設以 ID 優先；直接使用者名稱/代稱比對需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    以名稱為基礎的鍵（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不會**相符。頻道查詢預設以 ID 優先，因此以名稱為基礎的鍵永遠無法成功路由，該頻道中的所有訊息都會被靜默封鎖。這不同於 `groupPolicy: "open"`；在該模式下，路由不需要頻道鍵，而以名稱為基礎的鍵看起來會正常運作。

    一律使用 Slack 頻道 ID 作為鍵。尋找方式：在 Slack 中以滑鼠右鍵點選頻道 → **Copy link** — ID（`C...`）會出現在 URL 結尾。

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
    頻道訊息預設受到提及閘門限制。

    提及來源：

    - 明確的應用程式提及（`<@botId>`）
    - 當 Bot 使用者是該使用者群組成員時的 Slack 使用者群組提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及正規表示式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 隱含的回覆 Bot 執行緒行為（當 `thread.requireExplicitMention` 為 `true` 時停用）

    每頻道控制項（`channels.slack.channels.<id>`；名稱只能透過啟動解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `users`（允許清單）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 鍵格式：`channel:`、`id:`、`e164:`、`username:`、`name:`，或 `"*"` 萬用字元
      （舊版未加前綴的鍵仍只會對應到 `id:`）

    `ignoreOtherMentions` 預設為 `false`。設為 `true` 時，提及其他使用者或使用者群組但未提及此機器人的頻道訊息會儲存為待處理脈絡，不會被處理。私訊與群組私訊不受影響。此篩選器需要來自 `auth.test` 的機器人使用者 ID；如果該身分無法取得，訊息會原樣通過。

    `allowBots` 對頻道與私人頻道採保守策略：只有在傳送訊息的機器人明確列於該聊天室的 `users` 允許清單中，或 `channels.slack.allowFrom` 中至少有一個明確 Slack 擁有者 ID 目前是聊天室成員時，才會接受機器人撰寫的聊天室訊息。萬用字元與顯示名稱形式的擁有者項目不符合擁有者在場條件。擁有者在場會使用 Slack `conversations.members`；請確認應用程式具備與聊天室類型相符的讀取範圍（公開頻道為 `channels:read`，私人頻道為 `groups:read`）。如果成員查詢失敗，OpenClaw 會丟棄該機器人撰寫的聊天室訊息。

    已接受的機器人撰寫 Slack 訊息會使用共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。使用 `channels.defaults.botLoopProtection` 設定預設額度；當工作區或頻道需要不同限制時，再以 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆寫。

  </Tab>
</Tabs>

## 執行緒、工作階段與回覆標籤

- 私訊會路由為 `direct`；頻道為 `channel`；MPIM 為 `group`。
- Slack 路由繫結接受原始對等 ID，以及 Slack 目標形式，例如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用預設 `session.dmScope=main` 時，Slack 私訊會收合到代理的主要工作階段。
- 頻道工作階段：`agent:<agentId>:slack:channel:<channelId>`。
- 一般頂層頻道訊息會留在各頻道工作階段上，即使 `replyToMode` 不是 `off`。
- Slack 執行緒回覆會使用父層 Slack `thread_ts` 作為工作階段後綴（`:thread:<threadTs>`），即使已用 `replyToMode="off"` 停用外送回覆執行緒。
- 當符合資格的頂層頻道根訊息預期會啟動可見的 Slack 執行緒時，OpenClaw 會將其植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，讓根訊息與後續執行緒回覆共用同一個 OpenClaw 工作階段。這適用於 `app_mention` 事件、明確的機器人提及或已設定的提及模式比對，以及 `requireMention: false` 且 `replyToMode` 非 `off` 的頻道。
- `channels.slack.thread.historyScope` 預設為 `thread`；`thread.inheritParent` 預設為 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新執行緒工作階段開始時要擷取多少現有執行緒訊息（預設 `20`；設為 `0` 可停用）。
- `channels.slack.thread.requireExplicitMention`（預設 `false`）：設為 `true` 時，會抑制隱含執行緒提及，讓機器人只回應執行緒內明確的 `@bot` 提及，即使機器人已參與該執行緒。若未設定此項，機器人參與過的執行緒中的回覆會略過 `requireMention` 閘控。

回覆執行緒控制：

- `channels.slack.replyToMode`: `off|first|all|batched`（預設 `off`）
- `channels.slack.replyToModeByChatType`: 依 `direct|group|channel` 設定
- 直接聊天的舊版備援：`channels.slack.dm.replyToMode`

支援手動回覆標籤：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

若要從 `message` 工具明確傳送 Slack 執行緒回覆，請搭配 `action: "send"` 與 `threadId` 或 `replyTo` 設定 `replyBroadcast: true`，要求 Slack 也將該執行緒回覆廣播到父頻道。這會對應到 Slack 的 `chat.postMessage` `reply_broadcast` 旗標，且僅支援文字或 Block Kit 傳送，不支援媒體上傳。

當 `message` 工具呼叫在 Slack 執行緒內執行並以同一頻道為目標時，OpenClaw 通常會依 `replyToMode` 繼承目前的 Slack 執行緒。若要強制改為新的父頻道訊息，請在 `action: "send"` 或 `action: "upload-file"` 上設定 `topLevel: true`。`threadId: null` 也會被接受為相同的頂層退出選項。

<Note>
`replyToMode="off"` 會停用外送 Slack 回覆執行緒，包括明確的 `[[reply_to_*]]` 標籤。它不會攤平傳入的 Slack 執行緒工作階段：已張貼在 Slack 執行緒內的訊息仍會路由到 `:thread:<threadTs>` 工作階段。這與 Telegram 不同；在 Telegram 中，明確標籤在 `"off"` 模式下仍會生效。Slack 執行緒會將訊息隱藏於頻道之外，而 Telegram 回覆會保持行內可見。
</Note>

## 確認反應

`ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 會決定該表情符號實際在_何時_傳送。

### 表情符號（`ackReaction`）

解析順序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 代理身分表情符號備援（`agents.list[].identity.emoji`，否則為 `"eyes"` / 👀）

注意事項：

- Slack 預期使用短代碼（例如 `"eyes"`）。
- 使用 `""` 可停用該 Slack 帳號或全域的反應。

### 範圍（`messages.ackReactionScope`）

Slack 提供者會從 `messages.ackReactionScope` 讀取範圍（預設 `"group-mentions"`）。目前沒有 Slack 帳號層級或 Slack 頻道層級的覆寫；此值對閘道為全域設定。

值：

- `"all"`：在私訊與群組中反應。
- `"direct"`：僅在私訊中反應。
- `"group-all"`：對每則群組訊息反應（不含私訊）。
- `"group-mentions"`（預設）：在群組中反應，但只在機器人被提及時（或在已選擇加入的群組可提及項中）。**不包含私訊。**
- `"off"` / `"none"`：永不反應。

<Note>
預設範圍（`"group-mentions"`）不會在直接訊息中觸發確認反應。若要在傳入的 Slack 私訊上看到已設定的 `ackReaction`（例如 `"eyes"`），請將 `messages.ackReactionScope` 設為 `"direct"` 或 `"all"`。`messages.ackReactionScope` 會在 Slack 提供者啟動時讀取，因此需要重新啟動閘道才能讓變更生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## 文字串流

`channels.slack.streaming` 控制即時預覽行為：

- `off`：停用即時預覽串流。
- `partial`（預設）：以最新的部分輸出取代預覽文字。
- `block`：附加分塊預覽更新。
- `progress`：產生期間顯示進度狀態文字，然後傳送最終文字。
- `streaming.preview.toolProgress`：當草稿預覽啟用時，將工具/進度更新路由到同一則已編輯的預覽訊息（預設：`true`）。設為 `false` 可保留分開的工具/進度訊息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：設為 `status` 可在隱藏原始命令/執行文字的同時，保留精簡的工具進度列（預設：`raw`）。

隱藏原始命令/執行文字，同時保留精簡進度列：

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

Slack 原生進度任務卡在進度模式中需選擇加入。將 `channels.slack.streaming.progress.nativeTaskCards` 設為 `true`，並搭配 `channels.slack.streaming.mode="progress"`，即可在工作執行期間傳送 Slack 原生計畫/任務卡，並在完成時更新同一張任務卡。若沒有此旗標，進度模式會保留可攜式草稿預覽行為。

- 必須有可用的回覆執行緒，才會顯示原生文字串流與 Slack 助理執行緒狀態。執行緒選擇仍遵循 `replyToMode`。
- 當原生串流不可用或沒有回覆執行緒時，頻道、群組聊天與頂層私訊根訊息仍可使用一般草稿預覽。
- 頂層 Slack 私訊預設保持非執行緒模式，因此不會顯示 Slack 執行緒樣式的原生串流/狀態預覽；OpenClaw 會改為在私訊中張貼並編輯草稿預覽。
- 媒體與非文字酬載會退回一般傳送。
- 媒體/錯誤最終訊息會取消待處理的預覽編輯；符合資格的文字/區塊最終訊息只有在可就地編輯預覽時才會送出。
- 如果串流在回覆中途失敗，OpenClaw 會針對剩餘酬載退回一般傳送。

使用草稿預覽，而非 Slack 原生文字串流：

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

選擇加入 Slack 原生進度任務卡：

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

舊版鍵：

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的舊版執行階段別名。
- 布林值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 與 `channels.slack.streaming.nativeTransport` 的舊版執行階段別名。
- 舊版 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.nativeTransport` 的執行階段別名。
- 執行 `openclaw doctor --fix`，將已保存的 Slack 串流設定改寫為標準鍵。

## 輸入中反應備援

`typingReaction` 會在 OpenClaw 處理回覆時，對傳入的 Slack 訊息新增暫時反應，並在執行完成時移除。這在執行緒回覆之外最有用；執行緒回覆會使用預設的「正在輸入...」狀態指示器。

解析順序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事項：

- Slack 預期使用短代碼（例如 `"hourglass_flowing_sand"`）。
- 此反應採盡力而為，並會在回覆或失敗路徑完成後自動嘗試清理。

## 媒體、分塊與傳送

<AccordionGroup>
  <Accordion title="傳入附件">
    Slack 檔案附件會從 Slack 託管的私人 URL（以權杖驗證的請求流程）下載，並在擷取成功且大小限制允許時寫入媒體儲存區。檔案預留位置包含 Slack `fileId`，讓代理可以使用 `download-file` 擷取原始檔案。

    下載會使用有界的閒置逾時與總逾時。如果 Slack 檔案擷取停滯或失敗，OpenClaw 會繼續處理訊息，並退回使用檔案預留位置。

    執行階段傳入大小上限預設為 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆寫。

  </Accordion>

  <Accordion title="外送文字與檔案">
    - 文字分塊使用 `channels.slack.textChunkLimit`（預設 4000）
    - `channels.slack.chunkMode="newline"` 啟用段落優先切分
    - 檔案傳送使用 Slack 上傳 API，並可包含執行緒回覆（`thread_ts`）
    - 設定時，外送媒體上限遵循 `channels.slack.mediaMaxMb`；否則頻道傳送會使用媒體管線的 MIME 類型預設值

  </Accordion>

  <Accordion title="傳送目標">
    建議使用明確目標：

    - `user:<id>` 用於私訊
    - `channel:<id>` 用於頻道

    僅文字/區塊的 Slack 私訊可直接張貼到使用者 ID；檔案上傳與執行緒傳送會先透過 Slack 對話 API 開啟私訊，因為這些路徑需要具體的對話 ID。

  </Accordion>
</AccordionGroup>

## 命令與斜線行為

斜線命令在 Slack 中會顯示為單一已設定命令或多個原生命令。設定 `channels.slack.slashCommand` 可變更命令預設值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack app 中設定[其他 manifest 設定](#additional-manifest-settings)，並改用全域設定中的 `channels.slack.commands.native: true` 或 `commands.native: true` 啟用。

- Slack 的原生命令自動模式預設為**關閉**，因此 `commands.native: "auto"` 不會啟用 Slack 原生命令。

```txt
/help
```

原生參數選單使用自適應算繪策略，在派送所選選項值之前顯示確認 modal：

- 最多 5 個選項：按鈕區塊
- 6-100 個選項：靜態選取選單
- 超過 100 個選項：當互動選項處理常式可用時，使用具備非同步選項篩選的外部選取
- 超出 Slack 限制：編碼後的選項值會退回為按鈕

```txt
/think
```

斜線命令工作階段使用像 `agent:<agentId>:slack:slash:<userId>` 這樣的隔離金鑰，並且仍會使用 `CommandTargetSessionKey` 將命令執行路由到目標對話工作階段。

## 互動式回覆

Slack 可以算繪由代理撰寫的互動式回覆控制項，但此功能預設停用。
對新的代理、命令列介面與外掛輸出，請優先使用共用的
`presentation` 按鈕或選取區塊。它們使用相同的 Slack 互動
路徑，同時也能在其他頻道上降級。

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

或只為一個 Slack 帳號啟用：

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

啟用後，代理仍可發出已棄用、僅限 Slack 的回覆指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

這些指令會編譯成 Slack Block Kit，並透過現有的 Slack 互動事件路徑
將點擊或選取路由回來。保留它們供舊提示詞與 Slack 專用的逃生出口使用；新的
可攜式控制項請使用共用 presentation。

指令編譯器 API 對新的產生端程式碼也已棄用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 算繪控制項請使用 `presentation` payload 與
`buildSlackPresentationBlocks(...)`。

注意事項：

- 這是 Slack 專用的舊版 UI。其他頻道不會將 Slack Block
  Kit 指令轉譯成自己的按鈕系統。
- 互動回呼值是 OpenClaw 產生的不透明 token，不是代理撰寫的原始值。
- 如果產生的互動區塊會超出 Slack Block Kit 限制，OpenClaw 會退回為原始文字回覆，而不是傳送無效的 blocks payload。

### 外掛擁有的 modal 提交

註冊互動處理常式的 Slack 外掛，也可以在 OpenClaw 將
payload 壓縮成代理可見的系統事件之前，接收 modal
`view_submission` 與 `view_closed` 生命週期事件。開啟 Slack modal 時請使用下列其中一種路由
模式：

- 將 `callback_id` 設為 `openclaw:<namespace>:<payload>`。
- 或保留現有的 `callback_id`，並將 `pluginInteractiveData:
"<namespace>:<payload>"` 放入 modal `private_metadata`。

處理常式會收到 `ctx.interaction.kind`，其值為 `view_submission` 或
`view_closed`、正規化後的 `inputs`，以及來自
Slack 的完整原始 `stateValues` 物件。僅使用 callback ID 路由就足以叫用外掛處理常式；當
modal 也應產生代理可見的系統事件時，請包含
現有 modal `private_metadata` 的使用者/工作階段路由欄位。代理會收到
精簡且已遮蔽的 `Slack interaction: ...` 系統事件。如果處理常式回傳
`systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，這些
欄位會包含在該精簡事件中，讓代理能參照
外掛擁有的儲存空間，而不會看到完整表單 payload。

## Slack 中的原生核准

Slack 可以作為原生核准用戶端，使用互動式按鈕與互動，而不是退回 Web UI 或終端機。

- Exec 與外掛核准可以算繪為 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生 exec 核准用戶端的啟用與 DM/頻道路由設定。
- Exec 核准 DM 使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 當 Slack 對來源工作階段啟用為原生核准用戶端，或當 `approvals.plugin` 路由到來源 Slack 工作階段或 Slack 目標時，外掛核准會使用 Slack 原生按鈕。
- 外掛核准 DM 使用來自 `channels.slack.allowFrom`、具名帳號 `allowFrom` 或帳號預設路由的 Slack 外掛核准者。
- 核准者授權仍會強制執行：僅限 exec 的核准者無法核准外掛請求，除非他們也是外掛核准者。

這使用與其他頻道相同的共用核准按鈕介面。當你的 Slack app 設定中啟用 `interactivity` 時，核准提示會直接在對話中算繪為 Block Kit 按鈕。
當這些按鈕存在時，它們是主要核准使用者體驗；OpenClaw
應只在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，才包含手動 `/approve` 命令。

設定路徑：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（選用；可行時會退回到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
- `agentFilter`, `sessionFilter`

當 `enabled` 未設定或為 `"auto"`，且至少解析出一位
exec 核准者時，Slack 會自動啟用原生 exec 核准。當解析出 Slack 外掛核准者，且請求符合原生用戶端篩選條件時，Slack 也可以透過此原生用戶端
路徑處理原生外掛核准。設定
`enabled: false` 可明確停用 Slack 作為原生核准用戶端。設定 `enabled: true` 可在解析出核准者時
強制開啟原生核准。停用 Slack exec 核准不會停用
透過 `approvals.plugin` 啟用的原生 Slack 外掛核准傳遞；外掛核准
傳遞會改用 Slack 外掛核准者。

沒有明確 Slack exec 核准設定時的預設行為：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆寫核准者、加入篩選條件，或
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

共用 `approvals.exec` 轉送是獨立的。只有在 exec 核准提示也必須
路由到其他聊天或明確的頻外目標時才使用它。共用 `approvals.plugin` 轉送也
是獨立的；只有在 Slack 能原生處理外掛
核准請求時，Slack 原生傳遞才會抑制該退回路徑。

同一聊天中的 `/approve` 也可在已支援命令的 Slack 頻道與 DM 中運作。完整的核准轉送模型請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 事件與操作行為

- 訊息編輯/刪除會對應為系統事件。
- 執行緒廣播（「同時傳送到頻道」的執行緒回覆）會作為一般使用者訊息處理。
- 新增/移除 reaction 事件會對應為系統事件。
- 成員加入/離開、頻道建立/重新命名，以及新增/移除釘選事件會對應為系統事件。
- 啟用 `configWrites` 時，`channel_id_changed` 可以遷移頻道設定金鑰。
- 頻道主題/用途 metadata 會被視為不受信任的上下文，並可注入路由上下文。
- 適用時，執行緒起始訊息與初始執行緒歷史上下文植入會依設定的寄件者允許清單篩選。
- 區塊動作、捷徑與 modal 互動會發出結構化的 `Slack interaction: ...` 系統事件，並包含豐富的 payload 欄位：
  - 區塊動作：所選值、標籤、選取器值與 `workflow_*` metadata
  - 全域捷徑：回呼與動作者 metadata，路由到動作者的直接工作階段
  - 訊息捷徑：回呼、動作者、頻道、執行緒與所選訊息上下文
  - modal `view_submission` 與 `view_closed` 事件，包含已路由的頻道 metadata 與表單輸入

在你的 Slack app 設定中定義全域或訊息捷徑，並使用任何非空的 callback ID。OpenClaw 會確認相符的捷徑 payload，套用與其他 Slack 互動相同的 DM/頻道寄件者政策，並將已清理的事件排入已路由的代理工作階段。Trigger ID 與 response URL 會從代理上下文中遮蔽。

## 設定參考

主要參考：[設定參考 - Slack](/zh-TW/gateway/config-channels#slack)。

<Accordion title="高訊號 Slack 欄位">

- 模式/驗證：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM 存取：`dm.enabled`, `dmPolicy`, `allowFrom`（舊版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 相容性切換：`dangerouslyAllowNameMatching`（緊急破窗；除非必要，否則保持關閉）
- 頻道存取：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 執行緒/歷史：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳遞：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls：`unfurlLinks`（預設：`false`）、`unfurlMedia`，用於 `chat.postMessage` 連結/媒體預覽控制；設定 `unfurlLinks: true` 可選擇重新啟用連結預覽
- 操作/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 疑難排解

<AccordionGroup>
  <Accordion title="頻道中沒有回覆">
    依序檢查：

    - `groupPolicy`
    - 頻道允許清單（`channels.slack.channels`）— **金鑰必須是頻道 ID**（`C12345678`），不是名稱（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基於名稱的金鑰會靜默失敗，因為頻道路由預設以 ID 優先。若要尋找 ID：在 Slack 中右鍵點擊頻道 → **複製連結** — URL 結尾的 `C...` 值就是頻道 ID。
    - `requireMention`
    - 每個頻道的 `users` 允許清單
    - `messages.groupChat.visibleReplies`：一般群組/頻道請求預設為 `"automatic"`。如果你選擇加入 `"message_tool"`，且日誌顯示助理文字但沒有 `message(action=send)` 呼叫，表示模型錯過了可見訊息工具路徑。在此模式下，最終文字會保持私密；請檢查閘道詳細日誌中的受抑制 payload metadata，或若你希望每個一般助理最終回覆都透過舊版路徑張貼，請將其設為 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果它是 `"room_event"`，未提及但允許的頻道閒聊會成為環境上下文，除非代理呼叫 `message` 工具，否則會保持靜默。請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - 配對核准 / 允許清單項目（`dmPolicy: "open"` 仍需要 `channels.slack.allowFrom: ["*"]`）
    - 群組 DM 使用 MPIM 處理；啟用 `channels.slack.dm.groupEnabled`，若已設定，請將 MPIM 包含在 `channels.slack.dm.groupChannels` 中
    - Slack Assistant DM 事件：提到 `drop message_changed` 的詳細日誌
      通常表示 Slack 傳送了已編輯的 Assistant 執行緒事件，但訊息 metadata 中
      沒有可復原的人類寄件者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式無法連線">
    請驗證機器人與應用程式權杖，以及 Slack 應用程式設定中的 Socket Mode 啟用狀態。
    App-Level Token 需要 `connections:write`，而 Bot User OAuth Token
    機器人權杖必須與應用程式權杖屬於同一個 Slack 應用程式/工作區。

    如果 `openclaw channels status --probe --json` 顯示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，代表 Slack 帳戶已設定，
    但目前執行階段無法解析由 SecretRef 支援的值。

    像 `slack socket mode failed to start; retry ...` 這類記錄是可復原的
    啟動失敗。缺少 scope、權杖遭撤銷和無效驗證則會快速失敗。
    `slack token mismatch ...` 記錄表示機器人權杖和應用程式權杖似乎
    屬於不同的 Slack 應用程式；請修正 Slack 應用程式憑證。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    請驗證：

    - 簽署密鑰
    - 網路鉤子路徑
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每個 HTTP 帳戶都有唯一的 `webhookPath`
    - 公開 URL 會終止 TLS，並將請求轉送到閘道路徑
    - Slack 應用程式的 `request_url` 路徑與 `channels.slack.webhookPath` 完全相符（預設 `/slack/events`）

    如果帳戶快照中出現 `signingSecretStatus: "configured_unavailable"`，
    代表 HTTP 帳戶已設定，但目前執行階段無法解析由 SecretRef 支援的簽署密鑰。

    重複出現的 `slack: webhook path ... already registered` 記錄表示兩個 HTTP
    帳戶正在使用相同的 `webhookPath`；請為每個帳戶指定不同的路徑。

  </Accordion>

  <Accordion title="原生命令/斜線命令未觸發">
    請確認你預期的是：

    - 原生命令模式（`channels.slack.commands.native: true`），並已在 Slack 中註冊相符的斜線命令
    - 或單一斜線命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不會自動建立或移除斜線命令。`commands.native: "auto"` 不會啟用 Slack 原生命令；請使用 `true`，並在 Slack 應用程式中建立相符的命令。在 HTTP 模式中，每個 Slack 斜線命令都必須包含閘道 URL。在 Socket Mode 中，命令酬載會透過 WebSocket 抵達，而 Slack 會忽略 `slash_commands[].url`。

    也請檢查 `commands.useAccessGroups`、DM 授權、頻道允許清單，
    以及每個頻道的 `users` 允許清單。Slack 會針對遭封鎖的斜線命令傳送者
    回傳 ephemeral 錯誤，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件視覺參考

當 Slack 檔案下載成功且大小限制允許時，Slack 可以將已下載的媒體附加到代理回合。圖片檔可以透過媒體理解路徑傳遞，或直接傳給具備視覺能力的回覆模型；其他檔案會保留為可下載的檔案脈絡，而不是被視為圖片輸入。

### 支援的媒體類型

| 媒體類型                     | 來源               | 目前行為                                                                  | 備註                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 圖片 | Slack 檔案 URL       | 已下載並附加到回合，以供具備視覺能力的處理使用                   | 每個檔案上限：`channels.slack.mediaMaxMb`（預設 20 MB）                 |
| PDF 檔案                      | Slack 檔案 URL       | 已下載並作為檔案脈絡提供給 `download-file` 或 `pdf` 等工具使用 | Slack 入站不會自動將 PDF 轉換為圖片視覺輸入 |
| 其他檔案                    | Slack 檔案 URL       | 可行時下載並作為檔案脈絡公開                              | 二進位檔案不會被視為圖片輸入                               |
| 執行緒回覆                 | 執行緒起始訊息檔案 | 當回覆沒有直接媒體時，可將根訊息檔案補入為脈絡  | 僅含檔案的起始訊息會使用附件佔位符                          |
| 多圖片訊息           | 多個 Slack 檔案 | 每個檔案會獨立評估                                              | Slack 處理限制為每則訊息最多八個檔案                     |

### 入站管線

當帶有檔案附件的 Slack 訊息抵達時：

1. OpenClaw 會使用機器人權杖，從 Slack 的私人 URL 下載檔案。
2. 成功後，檔案會寫入媒體儲存區。
3. 已下載的媒體路徑和內容類型會加入入站脈絡。
4. 支援圖片的模型/工具路徑可使用該脈絡中的圖片附件。
5. 非圖片檔案仍會以檔案中繼資料或媒體參照的形式，提供給可處理它們的工具使用。

### 執行緒根附件繼承

當訊息抵達執行緒中（具有 `thread_ts` 父項）時：

- 如果回覆本身沒有直接媒體，而包含的根訊息有檔案，Slack 可以將根檔案補入為執行緒起始脈絡。
- 直接回覆附件優先於根訊息附件。
- 只有檔案且沒有文字的根訊息會以附件佔位符表示，讓後備仍可包含其檔案。

### 多附件處理

當單一 Slack 訊息包含多個檔案附件時：

- 每個附件都會透過媒體管線獨立處理。
- 已下載的媒體參照會彙總到訊息脈絡中。
- 處理順序依照事件酬載中的 Slack 檔案順序。
- 某個附件下載失敗不會阻擋其他附件。

### 大小、下載與模型限制

- **大小上限**：每個檔案預設 20 MB。可透過 `channels.slack.mediaMaxMb` 設定。
- **下載失敗**：Slack 無法提供的檔案、過期 URL、無法存取的檔案、超大檔案，以及 Slack 驗證/登入 HTML 回應都會被略過，而不是回報為不支援的格式。
- **視覺模型**：圖片分析會使用支援視覺的作用中回覆模型，或設定於 `agents.defaults.imageModel` 的圖片模型。

### 已知限制

| 情境                               | 目前行為                                                             | 因應方式                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 過期的 Slack 檔案 URL                 | 檔案被略過；不顯示錯誤                                                 | 在 Slack 中重新上傳檔案                                                |
| 未設定視覺模型            | 圖片附件會儲存為媒體參照，但不會作為圖片分析 | 設定 `agents.defaults.imageModel`，或使用具備視覺能力的回覆模型 |
| 非常大的圖片（預設 > 20 MB） | 依大小上限略過                                                         | 若 Slack 允許，請提高 `channels.slack.mediaMaxMb`                       |
| 轉寄/共享的附件           | 文字和 Slack 託管的圖片/檔案媒體會以最佳努力方式處理                       | 直接在 OpenClaw 執行緒中重新分享                                   |
| PDF 附件                        | 儲存為檔案/媒體脈絡，不會自動透過圖片視覺路由  | 使用 `download-file` 取得檔案中繼資料，或使用 `pdf` 工具進行 PDF 分析   |

### 相關文件

- [媒體理解管線](/zh-TW/nodes/media-understanding)
- [PDF 工具](/zh-TW/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件視覺啟用
- 迴歸測試: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- 即時驗證: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Slack 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    頻道和群組 DM 行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將入站訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    設定配置與優先順序。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    命令目錄與行為。
  </Card>
</CardGroup>
